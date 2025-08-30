import io
from typing import Optional, Dict, Any, List

import fitz  # PyMuPDF
from PIL import Image
import pytesseract
import spacy

# Try to load spaCy English model; fallback to blank pipeline
try:
    _NLP = spacy.load("en_core_web_sm", disable=["ner", "parser"])
except Exception:
    _NLP = spacy.blank("en")
    if "lemmatizer" not in _NLP.pipe_names:
        _NLP.add_pipe("lemmatizer", config={"mode": "rule"})

def _is_scanned_page(page) -> bool:
    text = page.get_text("text") or ""
    return len(text.strip()) < 10

def _extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    texts: List[str] = []
    for page in doc:
        if _is_scanned_page(page):
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            ocr_text = pytesseract.image_to_string(img)
            texts.append(ocr_text)
        else:
            texts.append(page.get_text("text") or "")
    return "\n".join(texts)

def _clean_text_spacy(raw: str) -> str:
    doc = _NLP(raw)
    tokens = []
    for t in doc:
        if t.is_space:
            continue
        if not t.is_stop:
            lemma = t.lemma_.lower().strip() if t.lemma_ else t.text.lower().strip()
            if lemma:
                tokens.append(lemma)
    return " ".join(tokens)

async def process_input_pdf_or_text(file, text: Optional[str]) -> Dict[str, Any]:
    if file is not None:
        content = await file.read()
        extracted = _extract_text_from_pdf(content)
    else:
        extracted = text or ""

    extracted = extracted.strip()
    cleaned = _clean_text_spacy(extracted)

    paragraphs = [p.strip() for p in extracted.split("\n\n") if p.strip()]
    sections = [{"id": i, "text": p} for i, p in enumerate(paragraphs)]

    return {
        "text": extracted,
        "cleaned_text": cleaned,
        "sections": sections,
    }
