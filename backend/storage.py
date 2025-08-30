import json
import os
from typing import Optional, Dict, Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)

def _path_for(doc_id: str) -> str:
    return os.path.join(STORAGE_DIR, f"doc_{doc_id}.json")

def save_document(doc_id: str, data: Dict[str, Any]) -> None:
    with open(_path_for(doc_id), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_document(doc_id: str) -> Optional[Dict[str, Any]]:
    path = _path_for(doc_id)
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
