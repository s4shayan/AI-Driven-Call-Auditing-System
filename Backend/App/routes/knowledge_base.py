from fastapi import APIRouter, UploadFile, File, HTTPException
from App.Knowledge.knowledge_engine import KnowledgeEngine
from App.Knowledge.knowledge_ingestion import ingest_knowledge_data
from App.crud import knowledge as knowledge_crud

from App.schemas import TranscriptEvaluationRequest
import nltk
import os

knowledge_router = APIRouter(prefix="/knowledge", tags=["knowledge"])

# Global Knowledge Engine instance
engine = KnowledgeEngine()

# ==========================================================
# 1. INGEST KNOWLEDGE BASE
# ==========================================================
@knowledge_router.post("/ingest")
async def ingest_knowledge_base_endpoint(file: UploadFile = File(...)):
    try:
        # Folder to store uploaded knowledge documents
        knowledge_dir = os.path.join(os.getcwd(), "Knowledge_Score")
        os.makedirs(knowledge_dir, exist_ok=True)

        file_path = os.path.join(knowledge_dir, file.filename)

        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Run ingestion pipeline
        num_chunks = ingest_knowledge_data(file_path)

        return {
            "message": "Knowledge base ingested successfully",
            "chunks_processed": num_chunks,
            "file_path": file_path
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


# ==========================================================
# 2. VIEW KNOWLEDGE BASE
# ==========================================================
@knowledge_router.get("/", tags=["knowledge"])
def get_knowledge_base():
    return knowledge_crud.get_all_knowledge()


# ==========================================================
# 3. EVALUATE TRANSCRIPT AGAINST KNOWLEDGE BASE
# ==========================================================
@knowledge_router.post("/evaluate")
def evaluate_transcript_endpoint(request: TranscriptEvaluationRequest):
    try:
        # Reuse global engine
        global engine

        # Try sentence tokenization
        try:
            sentences = nltk.sent_tokenize(request.transcript_text)
        except:
            # Fallback basic split
            sentences = request.transcript_text.split(".")

        result = engine.evaluate_transcript(sentences)

        return {
            "status": "success",
            "evaluation": result
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

# ==========================================================
# 4. UPDATE KNOWLEDGE
# ==========================================================
from pydantic import BaseModel

class UpdateKnowledgeRequest(BaseModel):
    content: str

@knowledge_router.put("/{id}")
def update_knowledge_item(id: int, request: UpdateKnowledgeRequest):
    return knowledge_crud.update_knowledge(id, request.content)

class CreateKnowledgeRequest(BaseModel):
    content: str
    category: str
    source_section: str

@knowledge_router.post("/add")
def add_knowledge_item_endpoint(request: CreateKnowledgeRequest):
    return knowledge_crud.add_knowledge_item(request.content, request.category, request.source_section)
