from fastapi import FastAPI
from .routes.knowledge_graph import knowledgeGraph_router
from .routes.agents import agent_router
from .routes.calls import calls_router
from .routes.users import user_router
from .routes.agent_performance import agentPerfomance_router
from .routes.agent_report import agentReport_router
from .routes.knowledge_base import knowledge_router
app = FastAPI()

@app.get("/")
def health_check():
    return {"message": "FASTAPI is running successfully."}

app.include_router(knowledgeGraph_router)
app.include_router(agent_router)
app.include_router(calls_router)
app.include_router(user_router)
app.include_router(agentPerfomance_router)
app.include_router(agentReport_router)
app.include_router(knowledge_router)
