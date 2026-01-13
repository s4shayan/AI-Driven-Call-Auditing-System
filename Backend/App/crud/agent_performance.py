from fastapi import HTTPException
from App.db import engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql import text

def get_all_score():
    try:
        with engine.connect() as conn:
            result=conn.execute(text("Select * from Agent_Performance")).mappings()
            data=[dict(row) for row in result]
            return data
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
def get_score_by_id(agent_id:int):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("Select * from Agent_Performance where agent_id=:agent_id"),
                                {
                                    "agent_id":agent_id
                                }).mappings()
            row=result.fetchone()
            if row:
                return dict(row)
            raise HTTPException(status_code=404, detail="agent not found")
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_avg_call_duration(agent_id:int):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("""SELECT ROUND(AVG((CAST(PARSENAME(REPLACE(duration, ':', '.'), 2) AS INT) * 60) +
            CAST(PARSENAME(REPLACE(duration, ':', '.'), 1) AS FLOAT)) / 60.0,2
            ) AS avg_call_duration FROM Calls WHERE agent_id = :agent_id"""),
                                {
                                    "agent_id":agent_id
                                }).mappings()
            row=result.fetchone()
            if row:
                return dict(row)
            raise HTTPException(status_code=404, detail="agent not found")
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
    

def update_agentPerformance(agent_id: int):
    with engine.connect() as conn:
            # 1. Get Aggregates from Calls table
            metrics_query = text("""
                SELECT 
                    COUNT(*) AS total_calls,
                    ROUND(
                        AVG(
                            (CAST(PARSENAME(REPLACE(duration, ':', '.'), 2) AS INT) * 60) +
                            CAST(PARSENAME(REPLACE(duration, ':', '.'), 1) AS INT)
                        ) / 60.0, 2
                    ) AS avg_duration_minutes,
                    AVG(overall_score) AS avg_score,
                    AVG(empathy_score) AS avg_empathy,
                    AVG(greeting_score) AS avg_greeting,
                    SUM(CASE WHEN compliance_status = 'Passed' THEN 1 ELSE 0 END) AS passed_calls
                FROM Calls
                WHERE agent_id = :agent_id
            """)
            result = conn.execute(metrics_query, {"agent_id": agent_id}).fetchone()
            
            if not result or result.total_calls == 0:
                return 0, 0, 0 # Return defaults if no calls

            total_calls = result.total_calls
            avg_duration = float(result.avg_duration_minutes or 0)
            overall_avg = float(result.avg_score or 0)
            empathy_avg = float(result.avg_empathy or 0)
            greeting_avg = float(result.avg_greeting or 0)
            passed_count = float(result.passed_calls or 0)

            # Compliance Rate calculation
            compliance_rate = round((passed_count / total_calls) * 100, 2)
            
            # CSAT Score (Simulated: Avg Score * 2 for 10 scale)
            csat_score = round(overall_avg, 2)
            
            # Engagement Score: (Avg Empathy + Avg Greeting + Avg Overall) / 3
            engagement_score = round((empathy_avg + greeting_avg + overall_avg) / 3, 2)
            
            # Call Handling Efficiency: Removed as column is deleted
            # if avg_duration > 0:
            #     efficiency_score = round(((overall_avg)*20 / avg_duration) * 100, 2)
            # else:
            #     efficiency_score = 0
            
            # Recommendations Logic
            if compliance_rate < 50:
                rec = "Needs immediate training on compliance protocols."
            elif overall_avg < 3.0:
                rec = "Focus on empathy and greeting structure."
            elif overall_avg > 4.5:
                rec = "Top performer! Consider for mentorship role."
            else:
                rec = "Steady performance. Maintain consistency."

            # 2. Upsert into Agent_Performance
            # Check if exists first
            check_query = text("SELECT 1 FROM Agent_Performance WHERE agent_id = :agent_id")
            exists = conn.execute(check_query, {"agent_id": agent_id}).fetchone()

            if exists:
                update_query = text("""
                    UPDATE Agent_Performance
                    SET 
                        total_call_audited = :total_calls,
                        avg_call_duration = :avg_duration,
                        engagement_score = :engagement_score,
                        overall_compliance_rate = :compliance_rate,
                        csat_score = :csat_score,
                        recommendations = :rec
                    WHERE agent_id = :agent_id
                """)
                conn.execute(update_query, {
                    "total_calls": total_calls,
                    "avg_duration": avg_duration,
                    "engagement_score": engagement_score,
                    "compliance_rate": compliance_rate,
                    "csat_score": csat_score,
                    "rec": rec,
                    "agent_id": agent_id
                })
            else:
                insert_query = text("""
                    INSERT INTO Agent_Performance 
                    (agent_id, total_call_audited, avg_call_duration, 
                     engagement_score, overall_compliance_rate, csat_score, recommendations)
                    VALUES (:agent_id, :total_calls, :avg_duration, 
                            :engagement_score, :compliance_rate, :csat_score, :rec)
                """)
                conn.execute(insert_query, {
                    "agent_id": agent_id,
                    "total_calls": total_calls,
                    "avg_duration": avg_duration,
                    "engagement_score": engagement_score,
                    "compliance_rate": compliance_rate,
                    "csat_score": csat_score,
                    "rec": rec
                })
                
            conn.commit()
            
            return total_calls, avg_duration, csat_score

def agent_performance_history(agent_id:int):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("SELECT call_date, overall_score FROM Calls WHERE agent_id =:agent_id ORDER BY call_date ASC"),
                                {
                                    "agent_id":agent_id
                                }).mappings()
            history=result.fetchall()
            if history:
                return history
            raise HTTPException(status_code=404, detail="agent history not found")
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))  