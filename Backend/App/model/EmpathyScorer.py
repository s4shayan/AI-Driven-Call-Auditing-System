import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

# Ensure VADER lexicon is downloaded
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon')

sia = SentimentIntensityAnalyzer()

def calculate_empathy_score(sentences):
    """
    Calculates empathy score based on VADER sentiment analysis.
    Output: float (0.0 to 5.0)
    """
    goodwords=['thanks', 'happy', 'grateful', 'better' 'great', 'nice', 'lovely', 'good','help', 'thankful', 'please', ]
    # badwords=['dumb', 'stupid','idiot', 'deaf']
    verybadwords=['india','france', 'america','israel','shut','bloody', 'china']

    if not sentences or not sia:
        return 0.0, []

    total_compound = 0.0
    count = 0

    good_words=set()
    negative_words = set()
    very_bad_words=set()
    discarded_words=set()

    for sent in sentences:
        scores = sia.polarity_scores(sent)
        total_compound += scores['compound']
        count += 1
        
        # Extract negative words
        words = nltk.word_tokenize(sent)
        for word in words:
            lower_word = word.lower()
            if lower_word in verybadwords:
                    very_bad_words.add(lower_word)
            elif lower_word in sia.lexicon:
                # Check if valence is negative (threshold < -0.05)
                if sia.lexicon[lower_word] < -0.05:
                    negative_words.add(lower_word)
                elif sia.lexicon[lower_word] > 0.5:
                    good_words.add(lower_word)
            else:
                discarded_words.add(lower_word)
                    
                
            
    if count == 0:
        return 0.0, []
        
    avg_compound = total_compound / count
    

    score = (((avg_compound + 1) / 2) * 5)+1
    
    # print(f"DEBUG: VADER Avg Compound: {avg_compound:.4f}")
    # print(f"DEBUG: Calculated Empathy Score: {score:.2f}")
    print(f"good_words:{good_words}")
    print(f"Negative_words:{negative_words}")
    print(f"very_bad_words:{very_bad_words}")
    print(f"discarded_words:{discarded_words}")
    # print(sia.lexicon)
    
    return round(score, 2), list(negative_words),list(good_words),list(very_bad_words)
 