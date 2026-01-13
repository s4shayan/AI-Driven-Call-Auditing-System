from fastapi import HTTPException
from App.db import engine
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError
from App.schemas import AgentSchema
from App.schemas import AgentLoginSchema



def get_all_agents():
    try:
        with engine.connect() as conn:
            result=conn.execute(text("select * from Agent")).mappings()
            data=[dict(row) for row in result]
            return data
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500,detail=str(e))
        

def get_agent_by_id(agent_id:int):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("select * from Agent where agent_id=:agent_id"),
                                {"agent_id":agent_id}).mappings()
            row=result.fetchone()
            if row:
                return dict(row)
            raise HTTPException(status_code=404,detail=f"agent with id={agent_id}not found")
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

def create_agent(data:AgentSchema):
    try:
        with engine.connect() as conn:
            conn.execute(text("Insert into Agent (agent_name,email,agent_code) values(:agent_name,:email,:agent_code)"),
                            {
                                "agent_name":data.agent_name,
                                "email":data.email,
                                "agent_code":data.agent_code
                            })
            conn.commit()
            return{
                "status":"success",
                "message":"Agent uploaded succesfully"
            }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500,detail=str(e))
    
def update_agent(agent_id:int, data:AgentSchema):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("""update Agent set agent_name=:agent_name,email=:email,agent_code=:agent_code where agent_id=:agent_id"""),
                         {
                            "agent_name":data.agent_name,
                            "email":data.email,
                            "agent_code":data.agent_code,
                            "agent_id":agent_id
                         })
            if result.rowcount==0:
                raise HTTPException(status_code=404,detail="Agent not found")
            conn.commit()
            return{
                "status":"success",
                "message":f"Agent with id={agent_id} updated successfully"
            }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500,detail=str(e))

def delete_agent(agent_id:int):
    try:
        with engine.begin() as conn:
            result=conn.execute(text("""Delete from Agent where agent_id=:agent_id"""),
                         {
                             "agent_id":agent_id
                         })
            if result.rowcount==0:
                raise HTTPException(status_code=404,detail="Agent not found")
            conn.commit()
            return{
                "status":"success",
                "message":f"Agent with id={agent_id} Deleted successfully"
            }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500,detail=str(e))
            

            
def login(data:AgentLoginSchema):
    try:
        with engine.connect() as conn:
            result = conn.execute(  
                text("""
                    SELECT * FROM Agent 
                    WHERE (agent_name=:ae OR email=:ae) AND agent_code=:agt_code
                """),
                {"ae": data.agent_name_or_email, "agt_code": data.agent_code}
            ).mappings()

            user = result.fetchone()
            if user:
                return {
                    "success": True,
                    "user": dict(user)
                }
            else:
                return {
                    "success": False,
                    "message": "Invalid Agent name/email or agent_code"
                }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
