from fastapi import APIRouter
from App.crud import knowledge_graph
from App.schemas import KnowledgeGraphSchema

knowledgeGraph_router = APIRouter(prefix="/knowledge-graphs", tags=["Knowledge Graphs"])

@knowledgeGraph_router.get("/")
def get_all():
    return knowledge_graph.get_all_knowledge_graphs()

@knowledgeGraph_router.get("/{knowledgeGraph_id}")
def get_by_id(knowledgeGraph_id:int):
    return knowledge_graph.get_knowledge_graph_by_id(knowledgeGraph_id) 

@knowledgeGraph_router.post("/upload")
def upload_knowledgeGraph(data:KnowledgeGraphSchema):
    return knowledge_graph.upload_knowledgeGraph(data)

@knowledgeGraph_router.put("/update/{knowledgeGraph_id}")
def update_knowledgeGraph(knowledgeGraph_id:int,data:KnowledgeGraphSchema):
    return knowledge_graph.update_knowledgeGraph(knowledgeGraph_id,data)  

@knowledgeGraph_router.delete("/delete/{knowledgeGraph_id}")
def delete_knowledgeGraph(knowledgeGraph_id:int):
    return knowledge_graph.delete_knowledge_graph(knowledgeGraph_id)

