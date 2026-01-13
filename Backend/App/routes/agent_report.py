from fastapi import APIRouter
from App.crud import agent_report

agentReport_router=APIRouter(prefix="/agentReport", tags=["agentReport"])

@agentReport_router.get("/agentComparison")
def get_agentComparison():
    return agent_report.get_agent_comparison()

@agentReport_router.get("/taskSummary")
def get_taskSummary():
    return agent_report.taskSummary()