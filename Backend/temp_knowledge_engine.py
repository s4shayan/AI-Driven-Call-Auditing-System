import mysql.connector
import numpy as np
import os
from sentence_transformers import SentenceTransformer, CrossEncoder
from numpy.linalg import norm
from typing import List, Dict, Optional

# DB Configuration (Should ideally be shared, but duplicating for standalone usage safety)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Zyrog@13112004")
DB_NAME = os.getenv("DB_NAME", "call_audit_db")
DB_PORT = int(os.getenv("DB_PORT", 3306))

class KnowledgeEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(KnowledgeEngine, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if self.initialized:
            return
            
        print("Initializing Knowledge Engine...")
        # Use the same model as ingestion
        try:
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None
            
        # Load NLI Model for Fact-Checking
        try:
            print("Loading NLI Cross-Encoder...")
            self.nli_model = CrossEncoder('cross-encoder/nli-distilroberta-base')
            print("NLI Model loaded.")
        except Exception as e:
            print(f"Error loading NLI model: {e}")
            self.nli_model = None
            
        self.kb_matrix = None
        self.kb_data = [] # Stores text and metadata
        self._load_database()
        self.initialized = True

    def _load_database(self):
        """Loads all vectors from MySQL into a Numpy Matrix for fast math."""
        try:
            conn = mysql.connector.connect(
                host=DB_HOST, user=DB_USER, 
                password=DB_PASSWORD, database=DB_NAME, 
                port=DB_PORT
            )
            cursor = conn.cursor()
            
            # Fetch everything
            cursor.execute("SELECT content, embedding, category, source_section FROM knowledge_base")
            rows = cursor.fetchall()
            
            vectors = []
            self.kb_data = [] # Reset data
            
            for content, blob, category, source in rows:
                if blob:
                    # Convert BLOB back to Numpy Float32 Array
                    vec = np.frombuffer(blob, dtype=np.float32)
                    vectors.append(vec)
                    self.kb_data.append({
                        "content": content,
                        "category": category,
                        "source": source
                    })
            
            if vectors:
                # Create the Master Matrix (Shape: N_Rules x 384_Dimensions)
                self.kb_matrix = np.array(vectors)
                print(f"Loaded {len(vectors)} rules into memory.")
            else:
                print("No rules found in knowledge base.")
                self.kb_matrix = None

            conn.close()
        except Exception as e:
            print(f"Error loading knowledge base: {e}")
            self.kb_matrix = None

    def reload_knowledge_base(self):
        """Force reload of the knowledge base from DB."""
        print("Reloading Knowledge Base...")
        self._load_database()

    def find_best_match(self, transcript_sentence: str, threshold: float = 0.45) -> Optional[Dict]:
        """
        Compares the sentence against ALL rules using Matrix Multiplication.
        Returns: Best Rule (dict) or None if no good match found.
        """
        if self.model is None or self.kb_matrix is None or len(self.kb_data) == 0:
            return None

        # 1. Vectorize the input sentence
        query_vec = self.model.encode(transcript_sentence)
        
        # 2. Cosine Similarity (The "Search")
        # Dot product of Query vs All Rules / Magnitudes
        # norm(self.kb_matrix, axis=1) should be pre-calculated for speed if large, but fine for now.
        
        norms_matrix = norm(self.kb_matrix, axis=1)
        norm_query = norm(query_vec)
        
        # Avoid division by zero
        if norm_query == 0:
            return None
            
        # Handle zero norms in matrix (shouldn't happen with valid embeddings but safety first)
        norms_matrix[norms_matrix == 0] = 1e-10
        
        similarities = np.dot(self.kb_matrix, query_vec) / (norms_matrix * norm_query)
        
        # 3. Find highest score
        best_idx = np.argmax(similarities)
        best_score = similarities[best_idx]
        
        if best_score < threshold:
            return None # No relevant rule found (it's just chit-chat)
            
        return {
            "score": float(best_score),
            "match": self.kb_data[best_idx]
        }

    def validate_rule_adherence(self, rule_content: str, transcript_sentence: str) -> Dict:
        """
        Uses NLI Cross-Encoder to check if the sentence follows or contradicts the rule.
        Returns: { "label": "Entailment"|"Contradiction"|"Neutral", "score": float }
        """
        if not self.nli_model:
            return {"label": "Neutral", "score": 0.0}

        # Predict: returns logits [contradiction, entailment, neutral] (for this specific model)
        scores = self.nli_model.predict([(transcript_sentence, rule_content)])
        
        label_map = {0: "Contradiction", 1: "Entailment", 2: "Neutral"}
        pred_idx = scores.argmax()
        label = label_map[pred_idx]
        
        # scores is shape (1, 3), we need the score of the predicted class for the 0th sample
        confidence = scores[0][pred_idx]
        
        return {
            "label": label,
            "score": float(confidence)
        }

    def evaluate_transcript(self, transcript_sentences: List[str]) -> Dict:
        """
        Evaluates a list of sentences against the knowledge base.
        Returns a summary of matches and a knowledge score.
        """
        matches = []
        total_sentences = len(transcript_sentences)
        matched_sentences = 0
        total_knowledge_score = 0.0
        
        for sent in transcript_sentences:
            match = self.find_best_match(sent)
            if match:
                # We found a Topic Match (Semantic Search). 
                # Now lets Validated Logic (Fact Checking).
                validation = self.validate_rule_adherence(match['match']['content'], sent)
                
                # Scoring Logic:
                # Contradiction: -1.0 (Penalize heavily)
                # Entailment: +1.0 (Good job)
                # Neutral: +0.5 (On topic, but maybe not explicit confirm)
                
                step_score = 0.0
                if validation['label'] == 'Contradiction':
                    step_score = -1.0
                elif validation['label'] == 'Entailment':
                    step_score = 1.0
                else: # Neutral
                    step_score = 0.8
                
                total_knowledge_score += step_score

                matches.append({
                    "sentence": sent,
                    "rule_category": match['match']['category'],
                    "rule_content": match['match']['content'],
                    "similarity_score": match['score'],
                    "validation_label": validation['label'],
                    "step_score": step_score
                })
                matched_sentences += 1
        
        # Knowledge Score Calculation
        if matched_sentences > 0:
            final_score = (total_knowledge_score / matched_sentences) * 5
            # Clamp to 0-5
            final_score = max(0.0, min(final_score, 5.0))
        else:
            final_score = 0.0
        
        return {
            "knowledge_score": round(final_score, 2),
            "matches": matches,
            "total_sentences": total_sentences,
            "matched_count": matched_sentences
        }
