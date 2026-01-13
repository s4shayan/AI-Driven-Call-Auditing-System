# try:
#     from llama_cpp import Llama
#     HAS_LLAMA = True
# except ImportError:
#     HAS_LLAMA = False
#     # print("⚠️ Warning: llama-cpp-python not found. AI features will be disabled.")

# import json

# class InsightGenerator:
#     def __init__(self, model_path="C:\\AI-DRIVEN Call Auditing\\Backend\\App\\SummaryModel\\Llama-3.2-3B-Instruct-Q4_K_M.gguf"):
#         if HAS_LLAMA:
#             # print("⏳ Loading Local LLM (this may take a moment)...")
#             try:
#                 self.llm = Llama(
#                     model_path=model_path,
#                     n_ctx=4096, 
#                     verbose=False
#                 )
#                 # print("✅ Local LLM Loaded!")
#             except Exception as e:
#                 # print(f"❌ Failed to load model: {e}")
#                 self.llm = None
#         else:
#             # print("❌ AI features disabled due to missing library.")
#             self.llm = None

#     def _query_llm(self, prompt, max_tokens=150):
#         """Helper to send prompts to Llama"""
#         if not self.llm:
#             return "AI Analysis unavailable (Model not loaded)"
            
#         output = self.llm(
#             prompt, 
#             max_tokens=max_tokens, 
#             stop=["Instruction:", "###"],  
#             echo=False
#         )
#         return output['choices'][0]['text'].strip()

#     # --- TASK 1: CALL SUMMARY ---
#     def generate_summary(self, transcript_text):
#         prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
# You are a Medical Billing Call Auditor. Summarize the call below in 3 bullet points:
# 1. The Issue
# 2. The Action Taken
# 3. The Outcome

# <|start_header_id|>user<|end_header_id|>
# TRANSCRIPT:
# {transcript_text}

# <|start_header_id|>assistant<|end_header_id|>
# Here is the summary:"""
        
#         return self._query_llm(prompt, max_tokens=200)

#     # --- TASK 2: CALL REMARKS (Based on Scores) ---
#     def generate_call_remarks(self, k_score, e_score, g_score, c_score, overall_score, mistakes_list):
#         """
#         Generates feedback for a specific call.
#         mistakes_list: list of rules the agent failed (from Knowledge Engine)
#         """
#         mistakes_str = ", ".join(mistakes_list) if mistakes_list else "None"
        
#         prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
# You are a Team Lead. Write a short, constructive feedback paragraph (max 1 sentences) for an agent based on these stats.

# <|start_header_id|>user<|end_header_id|>
# Knowledge Score: {k_score}/100
# Empathy Score: {e_score}/100
# Greeting Score: {g_score}/5
# Closing Score: {c_score}/5
# Overall Score: {overall_score}/100
# Missed Rules: {mistakes_str}

# If scores are low, be coaching. If high, be praising.

# <|start_header_id|>assistant<|end_header_id|>
# Feedback:"""

#         return self._query_llm(prompt, max_tokens=100)

#     # --- TASK 3: AGENT PROFILE REMARKS (Overall Performance) ---
#     def generate_agent_profile_review(self, agent_name, last_5_k_scores, last_5_e_scores):
#         """
#         Generates a performance review for the Agent's profile page.
#         """
#         avg_k = sum(last_5_k_scores) / len(last_5_k_scores)
#         avg_e = sum(last_5_e_scores) / len(last_5_e_scores)
        
#         trend = "improving" if last_5_k_scores[-1] > last_5_k_scores[0] else "declining"
        
#         prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
# Write a 1-sentence performance review for Agent {agent_name}.

# <|start_header_id|>user<|end_header_id|>
# Average Knowledge: {avg_k:.1f}
# Average Empathy: {avg_e:.1f}
# Recent Trend: {trend}

# Highlight their main strength or weakness.

# <|start_header_id|>assistant<|end_header_id|>
# Performance Review:"""

#         return self._query_llm(prompt, max_tokens=100)