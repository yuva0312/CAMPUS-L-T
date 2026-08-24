import re
import string

# Campus & general synonym map for semantic normalization
SYNONYM_MAP = {
  "cafeteria": "canteen",
  "hut cafe": "canteen",
  "rec cafe": "canteen",
  "j block": "library",
  "audi": "auditorium",
  "indoor audi": "auditorium",
  "gymnasium": "gym",
  "ground": "playground",
  "play ground": "playground",
  "tifac": "tifac core",
  "block a": "a block",
  "block b": "b block",
  "block c": "c block",
  "block d": "d block",
  "phone": "mobile phone",
  "smartphone": "mobile phone",
  "cellphone": "mobile phone",
  "earbuds": "earphones",
  "airpods": "earphones",
  "headphones": "earphones",
  "wristwatch": "wrist watch",
  "watch": "wrist watch",
  "wallet": "leather wallet",
  "purge": "wallet",
  "purse": "wallet",
}

STOPWORDS = {
  "a", "an", "the", "i", "my", "me", "was", "were", "is", "am", "are", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "to", "from",
  "in", "on", "at", "by", "for", "with", "about", "against", "between",
  "into", "through", "during", "before", "after", "above", "below", "to",
  "from", "up", "down", "out", "off", "over", "under", "again", "further",
  "then", "once", "here", "there", "when", "where", "why", "how", "all",
  "any", "both", "each", "few", "more", "most", "other", "some", "such",
  "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
  "s", "t", "can", "will", "just", "don", "should", "now", "lost", "found",
  "near", "close", "around", "beside", "item", "product", "belonging"
}


def normalize_text(text: str) -> str:
  """Clean, lowercase, strip punctuation and normalize campus synonyms."""
  if not text:
    return ""

  # Lowercase
  text = text.lower().strip()

  # Replace punctuation with spaces
  text = text.translate(str.maketrans(string.punctuation, " " * len(string.punctuation)))

  # Split into tokens
  words = text.split()

  # Normalize synonyms
  normalized_words = []
  i = 0
  while i < len(words):
    # Check 2-word phrase synonym
    if i < len(words) - 1:
      two_words = f"{words[i]} {words[i+1]}"
      if two_words in SYNONYM_MAP:
        normalized_words.append(SYNONYM_MAP[two_words])
        i += 2
        continue

    # Single word synonym
    word = words[i]
    if word in SYNONYM_MAP:
      normalized_words.append(SYNONYM_MAP[word])
    else:
      normalized_words.append(word)
    i += 1

  return " ".join(normalized_words)


def preprocess_text(text: str) -> str:
  """Preprocess text: Normalize + filter non-essential stopwords for dense embedding."""
  normalized = normalize_text(text)
  tokens = normalized.split()
  filtered = [w for w in tokens if w not in STOPWORDS]

  # If filtering removed everything, return the normalized string
  return " ".join(filtered) if filtered else normalized
