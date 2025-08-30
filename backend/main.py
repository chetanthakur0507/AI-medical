from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from uuid import uuid4
import os

from .preprocessing import process_input_pdf_or_text
from .storage import save_document, load_document
from .summarizer import ensure_model, generate_patient_summary, generate_clinician_summary
from .utils.provenance import build_provenance

DISCLAIMER = "This summary is AI-generated. Consult a healthcare professional before making decisions."

app = FastAPI(title="Medical Summarization API")

# CORS for local dev frontend(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)

@app.on_event("startup")
async def startup_event():
    ensure_model()

class SummarizeRequest(BaseModel):
    doc_id: Optional[str] = None
    text: Optional[str] = None

@app.post("/upload")
async def upload(file: Optional[UploadFile] = File(None), text: Optional[str] = Form(None)):
    if file is None and (text is None or text.strip() == ""):
        raise HTTPException(status_code=400, detail="Provide a PDF file or non-empty text.")

    try:
        processed = await process_input_pdf_or_text(file, text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(e)}")

    doc_id = str(uuid4())
    save_document(doc_id, processed)

    return {
        "doc_id": doc_id,
        "message": "Uploaded and processed successfully.",
        "disclaimer": DISCLAIMER,
        "sections_preview": processed.get("sections", [])[:5],
    }

@app.post("/summarize")
async def summarize(body: SummarizeRequest):
    if not body.doc_id and not (body.text and body.text.strip()):
        raise HTTPException(status_code=400, detail="Provide doc_id or non-empty text.")

    if body.doc_id:
        doc = load_document(body.doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        cleaned_text = doc.get("cleaned_text") or doc.get("text", "")
        sections = doc.get("sections", [])
    else:
        cleaned_text = (body.text or "").strip()
        paragraphs = [p.strip() for p in cleaned_text.split("\n\n") if p.strip()]
        sections = [{"id": i, "text": p} for i, p in enumerate(paragraphs)]

    patient_summary = generate_patient_summary(cleaned_text)
    clinician_summary = generate_clinician_summary(cleaned_text)

    prov_patient = build_provenance(patient_summary, sections)
    prov_clinician = build_provenance(clinician_summary, sections)

    return {
        "patient_summary": patient_summary,
        "clinician_summary": clinician_summary,
        "provenance": {
            "patient": prov_patient,
            "clinician": prov_clinician
        },
        "disclaimer": DISCLAIMER,
    }
