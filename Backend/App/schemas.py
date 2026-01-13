# schemas.py
from pydantic import BaseModel
from datetime import datetime

class CallSchema(BaseModel):
    user_id: int
    agent_id: int
    call_time: datetime
    call_duration: int
    call_summary: str

class UserSchema(BaseModel):
    username:str
    email:str
    password:str

class AgentSchema(BaseModel):
    agent_name:str
    email:str
    agent_code:str
    
class KnowledgeGraphSchema(BaseModel):
    user_id: int
    JSON_Data_Graph: str

class KnowledgeGraphResponse(KnowledgeGraphSchema):
    id: int

    model_config = {
        "from_attributes": True
    } 
class LoginSchema(BaseModel):
    username_or_email: str
    password: str

class AgentLoginSchema(BaseModel):
    agent_name_or_email: str
    agent_code: str

class TranscriptEvaluationRequest(BaseModel):
    transcript_text: str
