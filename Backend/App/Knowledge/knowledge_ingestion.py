from sqlalchemy import text
from App.db import engine   # <-- Use your existing MSSQL engine

import os
from sentence_transformers import SentenceTransformer
from typing import List, Dict


# print("Loading SentenceTransformer Model...")
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Error loading model: {e}")
    model = None


def parse_optimized_doc(file_path: str) -> List[Dict]:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    raw_blocks = content.split('###')
    chunks = []
    
    for block in raw_blocks:
        if not block.strip():
            continue
        
        lines = block.strip().split('\n')
        data = {}
        text_for_embedding = ""
        
        for line in lines:
            if ':' in line:
                key, val = line.split(':', 1)
                key = key.strip()
                val = val.strip()
                data[key] = val
                
                if key in ['TERM', 'RULE', 'NAME', 'CONTENT', 'QUESTION', 'ANSWER', 'SCENARIO']:
                    text_for_embedding += f"{val}. "
        
        if text_for_embedding:
            chunks.append({
                "type": data.get('TYPE', 'General'),
                "text": text_for_embedding.strip(),
                "source": data.get('SOURCE_SECTION', 'N/A')
            })
            
    return chunks



def ingest_knowledge_data(file_path: str):
    """
    Ingests parsed knowledge into SQL Server using SQLAlchemy.
    """
    if model is None:
        raise RuntimeError("SentenceTransformer model is not loaded.")

    print(f"Parsing file: {file_path}")
    chunks = parse_optimized_doc(file_path)
    print(f"Parsed {len(chunks)} chunks. Generating vectors...")

    # Start DB connection
    with engine.begin() as conn:

        # Clear table (SQL Server)
        conn.execute(text("TRUNCATE TABLE knowledge_base"))

        sql = text("""
            INSERT INTO knowledge_base (content, embedding, category, source_section)
            VALUES (:content, :embedding, :category, :source)
        """)

        for item in chunks:
            vector = model.encode(item['text'])
            vector_blob = vector.tobytes()   # raw bytes

            conn.execute(sql, {
                "content": item['text'],
                "embedding": vector_blob,
                "category": item['type'],
                "source": item['source']
            })

    print("✅ Success! Knowledge Base updated in SQL Server.")
    return len(chunks)
