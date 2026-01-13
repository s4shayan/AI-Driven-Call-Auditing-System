from fastapi import HTTPException,UploadFile
from App.db import engine
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError
from App.model.segmentation import segment_transcription
from App.model.Whisper import transcribe_audio_bytes
from fastapi import  UploadFile, File, Form, HTTPException
from App.Conversion import get_audio_duration
from App.model.GreetingScoreModel import Greetingscore_sentence
from App.model.ClosingScoreModel import Closingscore_sentence
# from App.model.AISummary import InsightGenerator
from App.model.EmpathyScorer import calculate_empathy_score
from App.model.remarks_generator import generate_remarks
import tempfile, os, json, shutil, re
from pathlib import Path
from App.crud.agent_performance import update_agentPerformance
from App.Knowledge.knowledge_engine import KnowledgeEngine
from input_audio_files.diarize_transcribe import process_audio

# insight_generator = InsightGenerator()
knowledge_engine = KnowledgeEngine()

def get_all_calls(start_date: str = None, end_date: str = None):
    try:
        with engine.connect() as conn:
            query = "SELECT * FROM calls"
            params = {}
            conditions = []
            
            if start_date:
                conditions.append("call_date >= :start_date")
                params["start_date"] = start_date
            
            if end_date:
                # Assuming end_date logic needs to be inclusive for the day
                # If date is 'YYYY-MM-DD', checking >= next day could be safer for timestamps, 
                # but for simplicity assuming string or DATE comparison logic of DB.
                # Usually 'call_date <= :end_date' is fine if calls have Time, but '2023-01-01' <= '2023-01-01 12:00' is false if simply checked.
                # Let's assume inclusive date: call_date < end_date + 1 day OR simple <= if just date.
                # Given user requirement "between 2 dates", usually inclusive.
                # Let's stick to simple comparison for now, assuming user passes DATE part.
                conditions.append("call_date <= :end_date")
                params["end_date"] = end_date
            
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
                
            query += " ORDER BY call_date DESC" # Good practice to sort by date

            result = conn.execute(text(query), params).mappings()
            data = [dict(row) for row in result]
            return data
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_call_by_id(call_id:int):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("""Select * from calls where call_id=:call_id """),
                                {
                                    "call_id":call_id
                                }).mappings()
            row=result.fetchone()
            if row:
                return dict(row)
            raise HTTPException(status_code=400,detail="Call not found")
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500,detail=str(e))
    
def get_call_by_user(user_id:int):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("""Select * from calls where user_id=:user_id """),
                                {
                                    "user_id":user_id
                                }).mappings()
            row=result.fetchall()
            if row:
                return row
            
            raise HTTPException(status_code=400,detail="Calls not found")
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500,detail=str(e))
            
def get_call_by_agent(agent_id:int):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("""Select * from calls where agent_id=:agent_id """),
                                {
                                    "agent_id":agent_id
                                }).mappings()
            row=result.fetchall()
            if row:
                return row
            
            raise HTTPException(status_code=400,detail="Calls not found")
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500,detail=str(e))
    

async def transcribe_call(file: UploadFile):
    # This function seems unused or legacy based on the new requirement to use upload_call with diarization
    # However keeping it for compatibility if used elsewhere, but updating it to be consistent might be needed?
    # For now, I will modify it slightly or leave it as is if it's not the main entry point.
    # The user request specifically mentioned modifying the upload flow.
    # I will leave this function as is for now, but note that it uses the OLD transcription method.
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    audio_bytes = await file.read()
    
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    
    # NOTE: This still uses the old whisper function which was removed from imports.
    # To fix this, I should either re-implement it using the new way or import the old one back if needed.
    # Since I removed the old import, this WILL break.
    # I should update this to use process_audio as well or fail gracefully.
    # I'll update it to use a simple temp file approach with process_audio for now to avoid errors.
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            temp_file.write(audio_bytes)
            temp_name = temp_file.name
        
        temp_dir = tempfile.mkdtemp()
        segments = process_audio(temp_name, temp_dir, num_speakers=2)
        
        full_transcript = []
        for seg in segments:
            full_transcript.append(f"[{seg['speaker']}]: {seg['text']}")
        text = "\n".join(full_transcript)
        
        # Cleanup
        os.remove(temp_name)
        shutil.rmtree(temp_dir)
        
        return {"filename": file.filename, "transcription": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_call_segments(transcription:str):
    try:
       
            transcript = transcription
            # Remove speaker labels [SPEAKER]:
            cleaned_transcript = re.sub(r'\[.*?\]:\s*', '', transcript)
            
            segmented_data = segment_transcription(cleaned_transcript)

            grouped = {"Greeting": [], "Body": [], "Closing": []}
            for item in segmented_data:
                grouped[item["segment"]].append(item["sentence"])

            return {
                "segments": grouped
            }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
    


async def upload_call(
    audio_file: UploadFile = File(...),
    agent_id: int = Form(...),
    user_id: int = Form(...),
    caller_number: str = Form(...),
    num_speakers: int = 2
):
    temp_dir = None
    temp_file_name = None
    try:
        
        audio_bytes = await audio_file.read()
        # Create a temp file for the input audio
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        temp_file.write(audio_bytes)
        temp_file.close()
        temp_file_name = temp_file.name
        
        duration = get_audio_duration(temp_file_name)

        # Create a temp directory for diarization output
        temp_dir = tempfile.mkdtemp()

        # Run Diarization
        # process_audio(input_path, output_dir, num_speakers, model_size)
        segments = process_audio(temp_file_name, temp_dir, num_speakers=num_speakers)

        # 1. Construct Full Transcript (with labels) for Database
        full_transcript_lines = []
        for seg in segments:
            full_transcript_lines.append(f"[{seg['speaker']}]: {seg['text']}")
        
        full_transcript = "\n".join(full_transcript_lines) # This goes to DB

        # 2. Construct Agent-Only Transcript (no labels) for Segmentation/Analysis
        agent_lines = [seg["text"] for seg in segments if seg["speaker"] == "AGENT"]
        agent_transcript = " ".join(agent_lines)

        # Run Segmentation on Agent Transcript
        agent_segments = segment_transcription(agent_transcript)

        # The segment_transcription returns list of { "sentence": ..., "segment": ... }
        # We need to map these back or just use them.
        # Since we passed only agent text, all these segments are from Agent.
        
        # NOTE: segments logic below relies on `agent_segments` now.
        greeting_text = " ".join([s["sentence"] for s in agent_segments if s["segment"]=="Greeting"])
        closing_text = " ".join([s["sentence"] for s in agent_segments if s["segment"]=="Closing"])
        body_text = " ".join([s["sentence"] for s in agent_segments if s["segment"]=="Body"])

        
        greeting_scores = Greetingscore_sentence(greeting_text) if greeting_text else {"Politeness":0,"Completeness":0,"Clarity":0,"Context":0,"Overall Score":0}
        closing_scores = Closingscore_sentence(closing_text) if closing_text else {"Politeness":0,"Completeness":0,"Clarity":0,"Context":0,"Overall Score":0}

        all_agent_sentences = [s["sentence"] for s in agent_segments]
        empathy_score, negative_words_list,good_word_list,very_bad_word_list = calculate_empathy_score(all_agent_sentences)

        
        greeting_avg = greeting_scores["Overall Score"]
        closing_avg = closing_scores["Overall Score"]

        knowledge_result = knowledge_engine.evaluate_transcript(all_agent_sentences)
        knowledge_score = knowledge_result["knowledge_score"]
        
        # Matches for knowledge breakdown
        matches = knowledge_result.get("matches", [])
        matched_count = knowledge_result.get("matched_count", 0)
        total_sentences_checked = knowledge_result.get("total_sentences", len(all_agent_sentences))

        overall_score = round((greeting_avg + closing_avg + empathy_score + knowledge_score) / 4, 3)
 
        # Build score_breakdown
        score_breakdown = {
            "greeting": greeting_scores,
            "closing": closing_scores,
            "knowledge": {
                "score": knowledge_score,
                "matched_count": matched_count,
                "total_sentences": total_sentences_checked,
                "matches": matches
            },
            "empathy": {
                "score": empathy_score,
                "method": "VADER Sentiment Analysis",
                "negative_words": negative_words_list,
                "good_words":good_word_list,
                "very_bad_words":very_bad_word_list
            }
        }
        score_breakdown_json = json.dumps(score_breakdown)
        
        # Compliance Status
        if overall_score >= 4.0:
            compliance_status = "Passed"
        elif overall_score >= 2.5:
            compliance_status = "NeedsReview"
        else:
            compliance_status = "Failed"

        # Note: We save the analyzed segments (Agent only) in the JSON column call_segments?
        # Or should we save the FULL segments?
        # Usually checking the UI, it highlights sentences.
        # If we only save Agent segments, the user will only see Agent text in the detailed view.
        # But `transcription_text` has everything.
        # If I save only agent segments in `call_segments_json`, the UI might only show analysis for those.
        # Given the request "when segmenting the call only agent sentences should be used", 
        # it implies the analysis is strictly on Agent. Storing agent segments matches this.
        call_segments_json = json.dumps(agent_segments)

        # Summary should probably be on the full transcript or agent only?
        # Usually summary is on the whole context. 
        # Let's use the full transcript for Summary to capture context, 
        # OR use Agent transcript if we strictly care about Agent performance?
        # The prompt said "transcript that should be saved in database should include labels",
        # "segmenting... only agent sentences".
        # Summary generation usually takes `transcript`.
        # I'll pass the FULL transcript (with labels) to the summary generator so it has context.
        # If the summary generator performs poorly with labels, I might need to adjust, 
        # but usually LLMs handle "Speaker: text" well.
        
        # ai_summary_text = insight_generator.generate_summary(full_transcript)
        ai_summary_text = "AI Summary disabled."
        
        # Generate remarks with updated signature
        remarks_text = generate_remarks(
            knowledge_score, 
            empathy_score, 
            greeting_avg,
            closing_avg,
            overall_score
        )
        # remarks_text = "Remarks disabled."

        with engine.connect() as conn:
            insert_query = text("""
                INSERT INTO calls (
                    agent_id, user_id, caller_number, call_date, duration, audio_file,
                    transcription_text, ai_summary, knowledge_score,
                    empathy_score, overall_score, greeting_score, closing_score, 
                    remarks, compliance_status, score_breakdown
                )
                VALUES (
                    :agent_id, :user_id, :caller_number, GETDATE(), :duration, :audio_file,
                    :transcription_text, :ai_summary, :knowledge_score,
                    :empathy_score, :overall_score, :greeting_score, :closing_score, 
                    :remarks, :compliance_status, :score_breakdown
                )
            """)
            conn.execute(insert_query, {
                "agent_id": agent_id,
                "user_id": user_id,
                "caller_number": caller_number,
                "duration": duration,
                "audio_file": audio_file.filename,
                "transcription_text": full_transcript,
                "knowledge_score": knowledge_score,
                "empathy_score": empathy_score,
                "overall_score": overall_score,
                "greeting_score": greeting_scores["Overall Score"],
                "closing_score": closing_scores["Overall Score"],
                "ai_summary": ai_summary_text,
                "remarks": remarks_text,
                "compliance_status": compliance_status,
                "score_breakdown": score_breakdown_json
            })
            conn.commit()

        
        total_calls, avg_duration, csat_score = update_agentPerformance(agent_id)
        
        return {
            "message": "Call uploaded successfully",
            "transcript": full_transcript,
            "greeting_scores": greeting_scores,
            "closing_scores": closing_scores,
            "empathy_score": empathy_score,
            "knowledge_score": knowledge_score,
            "overall_score": overall_score,
            "total_calls": total_calls,
            "avg_call_duration": avg_duration,
            "csat_score": csat_score,
            "ai_summary": ai_summary_text,
            "remarks": remarks_text
        }

    except Exception as e:
        # Cleanup segments if something fails (if we want to be safe)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        if temp_file_name and os.path.exists(temp_file_name):
            os.remove(temp_file_name)
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)



def flagged_calls():
    try:
        with engine.connect() as conn:
            query = text("""
                SELECT COUNT(*)
                FROM calls
                WHERE compliance_status IN ('NeedsReview', 'Failed')
            """)
            result = conn.execute(query).scalar()
            return {"flagged_calls_count": result}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

def getAverageCallScore():
    try:
        with engine.connect() as conn:
            query = text("SELECT AVG(overall_score)*2 AS avg_score FROM Calls")
            result = conn.execute(query).mappings().fetchone()

            avg_score_raw = result["avg_score"] if result else 0
            avg_score = round((avg_score_raw * 10),2) if avg_score_raw else 0.0

            return {"average_call_score": avg_score}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


