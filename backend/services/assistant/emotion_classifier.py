import re

def classify_emotion(text: str) -> str:
    """
    Enhanced keyword and heuristics-based emotion classifier for the avatar.
    Returns: 'neutral' | 'happy' | 'sad' | 'thinking' | 'surprised' | 'encourage'
    """
    text_lower = text.lower()
    
    # Happy / Praise
    if any(w in text_lower for w in ['great', 'good job', 'excellent', 'amazing', 'correct', 'right', 'awesome', 'perfect', 'brilliant', 'wonderful', 'yay', 'nailed it']):
        return 'happy'
    
    # Sad / Empathy
    if any(w in text_lower for w in ['sorry', 'wrong', 'mistake', 'fail', 'unfortunate', 'incorrect', 'oh no', 'that\'s tough', 'sad']):
        return 'sad'
        
    # Thinking / Processing
    if any(w in text_lower for w in ['think', 'let me see', 'analyzing', 'calculating', 'hmm', 'let\'s figure this out', 'let\'s see', 'give me a second']):
        return 'thinking'
        
    # Surprised / Shocked
    if any(w in text_lower for w in ['wow', 'really', 'wait', 'oh,', 'oh!', 'whoa', 'gosh']):
        return 'surprised'

    # Encourage / Motivate
    if any(w in text_lower for w in ['keep going', 'focus', 'try again', 'don\'t worry', 'you can do this', 'you\'ve got this', 'believe in yourself', 'almost there', 'don\'t give up']):
        return 'encourage'
        
    # Punctuation heuristics if no keywords hit
    if '!' in text:
        if any(w in text_lower for w in ['good', 'yes', 'agreed', 'sure', 'absolutely']):
            return 'happy'
        return 'surprised' # Default excitement

    return 'neutral'

