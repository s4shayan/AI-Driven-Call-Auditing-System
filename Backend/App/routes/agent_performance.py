from fastapi import APIRouter
from App.crud import agent_performance


agentPerfomance_router=APIRouter(prefix="/agentperformance",tags=(["agent_performance"]))

@agentPerfomance_router.get("/")
def get_all_performances():
    return agent_performance.get_all_score()

@agentPerfomance_router.get("/{agent_id}")
def get_all_performances(agent_id:int):
    return agent_performance.get_score_by_id(agent_id)

@agentPerfomance_router.get("/avg_call_duration/{agent_id}")
def get_avg_call_duration(agent_id:int):
    return agent_performance.get_avg_call_duration(agent_id)

@agentPerfomance_router.get("/performance_history/{agent_id}")
def get_agentPerformance_history(agent_id:int):
    return agent_performance.agent_performance_history(agent_id)
