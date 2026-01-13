import joblib
import os

# Force offline mode
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_HUB_OFFLINE"] = "1"

from sentence_transformers import SentenceTransformer
from nltk.tokenize import sent_tokenize


clf = joblib.load("C:\AI-DRIVEN Call Auditing\Backend\App\Segmentation\\clf_model.pkl")
le = joblib.load("C:\AI-DRIVEN Call Auditing\Backend\App\Segmentation\\label_encoder.pkl")

sbert = SentenceTransformer("C:\AI-DRIVEN Call Auditing\Backend\App\\Segmentation\\")


def segment_transcription(text, greeting_window=5, closing_window=5):
    """
    Segment transcript into Greeting, Body, and Closing.
    Returns a list of dictionaries:
        [{"sentence": ..., "segment": ...}, ...]
    """

    sentences = sent_tokenize(text)
    
    if not sentences:
        return []
    
   
    embeddings = sbert.encode(sentences)
    
    
    pred_ids = clf.predict(embeddings)
    preds = le.inverse_transform(pred_ids)

    n = len(sentences)
    segmented_list = []

    for i, (sentence, label) in enumerate(zip(sentences, preds)):
        # Determine final segment according to position rules
        if i < greeting_window:
            segment = "Greeting" if label == "Greeting" else "Body"
        elif i >= n - closing_window:
            segment = "Closing" if label == "Closing" else "Body"
        else:
            segment = "Body"

        segmented_list.append({"sentence": sentence, "segment": segment})

    return segmented_list


