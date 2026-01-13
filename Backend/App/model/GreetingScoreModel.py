import joblib
from sentence_transformers import SentenceTransformer


pol_model = joblib.load("C:\AI-DRIVEN Call Auditing\Backend\App\GSM\GreetingPoliteness_model.pkl")
com_model = joblib.load("C:\AI-DRIVEN Call Auditing\Backend\App\GSM\GreetingCompleteness_model.pkl")
cla_model = joblib.load("C:\AI-DRIVEN Call Auditing\Backend\App\GSM\GreetingClarity_model.pkl")
ctx_model = joblib.load("C:\AI-DRIVEN Call Auditing\Backend\App\GSM\GreetingContext_model.pkl")

embedder = SentenceTransformer("C:\AI-DRIVEN Call Auditing\Backend\App\GSM\GreetingSentenceEmbedder")  

def clamp(value, min_val=0, max_val=5):
    return max(min_val, min(value, max_val))


def Greetingscore_sentence(sentence):
    vec = embedder.encode([sentence])

    s1 = float(clamp(pol_model.predict(vec)[0]))
    s2 = float(clamp(com_model.predict(vec)[0]))
    s3 = float(clamp(cla_model.predict(vec)[0]))
    s4 = float(clamp(ctx_model.predict(vec)[0]))
    
    overall = round((s1 + s2 + s3 + s4) / 4, 2)

    return {
        "Politeness": round(s1, 2),
        "Completeness": round(s2, 2),
        "Clarity": round(s3, 2),
        "Context": round(s4, 2),
        "Overall Score": overall
    }


# sentence = "Hello"
# scores = Greetingscore_sentence(sentence)
# print(scores)
