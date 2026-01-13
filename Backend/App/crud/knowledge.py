from fastapi import HTTPException
from App.db import engine
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError
from App.Knowledge.knowledge_engine import KnowledgeEngine

def get_all_knowledge():
    try:
        with engine.connect() as conn:
            # Fetch relevant fields, excluding vector embedding to reduce payload size
            query = text("SELECT id, content, category, source_section FROM knowledge_base")
            result = conn.execute(query).mappings()
            data = [dict(row) for row in result]
            return data
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

def update_knowledge(id: int, new_content: str):
    try:
        # Get embedding using the singleton KnowledgeEngine model
        k_engine = KnowledgeEngine()
        if k_engine.model is None:
             raise HTTPException(status_code=500, detail="Embedding model not loaded")

        vector = k_engine.model.encode(new_content)
        vector_blob = vector.tobytes()

        with engine.connect() as conn:
            query = text("""
                UPDATE knowledge_base
                SET content = :content, embedding = :embedding
                WHERE id = :id
            """)
            result = conn.execute(query, {
                "content": new_content,
                "embedding": vector_blob,
                "id": id
            })
            conn.commit()
            
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Knowledge item not found")
            
        # Reload the knowledge base in memory to reflect changes
        k_engine.reload_knowledge_base()
        
        return {"message": "Knowledge updated successfully"}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

def add_knowledge_item(content: str, category: str, source: str):
    try:
        # Get embedding using the singleton KnowledgeEngine model
        k_engine = KnowledgeEngine()
        if k_engine.model is None:
             raise HTTPException(status_code=500, detail="Embedding model not loaded")

        vector = k_engine.model.encode(content)
        vector_blob = vector.tobytes()

        with engine.connect() as conn:
            query = text("""
                INSERT INTO knowledge_base (content, embedding, category, source_section)
                VALUES (:content, :embedding, :category, :source)
            """)
            conn.execute(query, {
                "content": content,
                "embedding": vector_blob,
                "category": category,
                "source": source
            })
            conn.commit()
        
        # Reload knowledge base
        k_engine.reload_knowledge_base()

        return {"message": "Knowledge rule added successfully"}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
