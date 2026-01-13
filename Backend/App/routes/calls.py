from fastapi import APIRouter,UploadFile,File,Form
from App.crud import calls

calls_router=APIRouter(prefix="/calls",tags=(["calls"]))

@calls_router.get("/")
def get_all_calls(start_date: str = None, end_date: str = None):
    return calls.get_all_calls(start_date, end_date)

@calls_router.get("/flagged_calls/")
def flagged_calls():
    return calls.flagged_calls()

@calls_router.get("/average_call_score/")
def average_call_score():
    return calls.getAverageCallScore()

@calls_router.get("/{call_id}")
def get_call_by_id(call_id:int):
    return calls.get_call_by_id(call_id)

@calls_router.get("/byUser/{user_id}")
def get_call_by_User_id(user_id:int):
    return calls.get_call_by_user(user_id)

@calls_router.get("/byAgent/{agent_id}")
def get_call_by_agent_id(agent_id:int):
    return calls.get_call_by_agent(agent_id)

@calls_router.post("/transcribe/")
async def transcribe_call_endpoint(file: UploadFile = File(...)):
    return await calls.transcribe_call(file)

@calls_router.get("/segment/{transcription_text}")
def get_call_segments(transcription_text:str):
    return calls.get_call_segments(transcription_text)

@calls_router.post("/uploadCall")
async def upload_call_route(
    audio_file: UploadFile = File(...),
    agent_id: int = Form(...),
    user_id: int = Form(...),
    caller_number: str = Form(...),
    num_speakers: int = Form(2)
):
    return await calls.upload_call(audio_file, agent_id, user_id, caller_number, num_speakers)

