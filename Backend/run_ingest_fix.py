
import os
import sys

# Ensure Backend is in path
sys.path.append(os.getcwd())

from App.Knowledge.knowledge_ingestion import ingest_knowledge_data

def run_ingest():
    file_path = os.path.join(os.getcwd(), 'knowledge_input.txt')
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    print("Starting manual ingestion...")
    try:
        count = ingest_knowledge_data(file_path)
        print(f"Ingested {count} chunks successfully.")
    except Exception as e:
        print(f"Ingestion failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_ingest()
