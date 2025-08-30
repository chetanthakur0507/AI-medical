from typing import List, Dict, Any
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+")

def _split_sentences(text: str) -> List[str]:
    return [s.strip() for s in _SENT_SPLIT.split(text) if s.strip()]

def build_provenance(summary_text: str, sections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not sections:
        return []

    sent_list = _split_sentences(summary_text)
    section_texts = [s["text"] for s in sections]

    vectorizer = TfidfVectorizer().fit(section_texts + sent_list)
    sec_vecs = vectorizer.transform(section_texts)

    provenance = []
    for sent in sent_list:
        s_vec = vectorizer.transform([sent])
        sims = cosine_similarity(s_vec, sec_vecs).flatten()
        idx = int(sims.argmax())
        provenance.append({
            "summary_sentence": sent,
            "section_id": sections[idx]["id"],
            "section_text": sections[idx]["text"],
            "score": float(sims[idx]),
        })

    return provenance
