
def classify_emotion(text: str) -> str:
    """
    Simple keyword-based emotion classifier for the avatar.
    Returns: 'neutral' | 'happy' | 'sad' | 'thinking' | 'surprised' | 'encourage'
    """
    text = text.lower()
    
    if any(w in text for w in ['great', 'good job', 'excellent', 'amazing', 'correct', 'right']):
        return 'happy'
    
    if any(w in text for w in ['sorry', 'wrong', 'mistake', 'fail', 'unfortunate']):
        return 'sad'
        
    if any(w in text for w in ['think', 'let me see', 'analyzing', 'calculating']):
        return 'thinking'
        
    if any(w in text for w in ['wow', 'really', 'wait', 'oh']):
        return 'surprised'

    if any(w in text for w in ['keep going', 'focus', 'try again', 'don\'t worry']):
        return 'encourage'
        
    return 'neutral'
