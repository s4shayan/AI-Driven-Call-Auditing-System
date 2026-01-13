from fastapi import HTTPException
from App.db import engine
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError
from App.schemas import KnowledgeGraphSchema


def get_all_knowledge_graphs():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT * FROM Knowledge_Graph")).mappings()
            data = [dict(row) for row in result]
            return data
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

def upload_knowledgeGraph(data:KnowledgeGraphSchema):
    try:
        with engine.connect() as conn:
            query=text("""Insert into Knowledge_Graph(user_id,JSON_Data_Graph) values (:user_id,:JSON_Data_Graph)
                       """)
            conn.execute(query,{
                "user_id":data.user_id,
                "JSON_Data_Graph":data.JSON_Data_Graph
            })
            conn.commit()
            return{
                "status":"success",
                "message":"knowledge graph uploaded succesfully"
            }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
        

def get_knowledge_graph_by_id(knowledgeGraph_id:int):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("Select * from Knowledge_Graph where id=:knowledgeGraph_id"),
                                {"knowledgeGraph_id":knowledgeGraph_id}).mappings()
            row=result.fetchone()
            if row:
                return dict(row)
            raise HTTPException(status_code=404,detail="Knowledge graph not found")
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500,detail=str(e))


def delete_knowledge_graph(knowledgeGraph_id:int):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("Delete from Knowledge_Graph where id=:knowledgeGraph_id"),
                                {"knowledgeGraph_id":knowledgeGraph_id})
            if result.rowcount==0:
                raise HTTPException(status_code=404,detail="knowledge graph not found")
            conn.commit()
        return{
                "status":"success",
                "message": f"Knowledge graph with id={knowledgeGraph_id} deleted successfully"
                }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
    

def update_knowledgeGraph(knowledgeGraph_id:int, data:KnowledgeGraphSchema):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("""update Knowledge_Graph set user_id=:user_id,JSON_Data_Graph=:JSON_Data_Graph where id=:knowledgeGraph_id"""),
                        {
                            "user_id":data.user_id,
                            "JSON_Data_Graph":data.JSON_Data_Graph,
                            "knowledgeGraph_id":knowledgeGraph_id
                        })
            if result.rowcount==0:
                raise HTTPException(status_code=404,detail="knowledge graph not found")
            conn.commit()
        return{
                "status":"success",
                "message": f"Knowledge graph with id={knowledgeGraph_id} updated successfully"
                }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

