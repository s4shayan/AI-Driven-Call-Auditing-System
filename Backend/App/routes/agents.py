from fastapi import APIRouter
from App.crud import agents
from App.schemas import AgentSchema
from App.schemas import AgentLoginSchema

agent_router=APIRouter(prefix="/agents",tags=(["agents"]))

@agent_router.get("/")
def get_all():
    return agents.get_all_agents()

@agent_router.get("/{agent_id}")
def get_by_id(agent_id:int):
    return agents.get_agent_by_id(agent_id)

@agent_router.post("/create")
def create_Agent(data:AgentSchema):
    return agents.create_agent(data)    

@agent_router.put("/update/{agent_id}")
def update_agent(agent_id:int,data:AgentSchema):
    return agents.update_agent(agent_id,data) 

@agent_router.delete("/delete/{agent_id}")
def delete_agent(agent_id:int):
    return agents.delete_agent(agent_id)   

@agent_router.post("/Login")
def agentLogin(data:AgentLoginSchema):
    return agents.login(data)