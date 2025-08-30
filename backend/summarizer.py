import os
from transformers import T5ForConditionalGeneration, T5TokenizerFast, pipeline, Trainer, TrainingArguments, DataCollatorForSeq2Seq
from datasets import Dataset
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
FINETUNED_DIR = os.path.join(MODELS_DIR, "t5-med")
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data")
QA_PATH = os.path.join(DATA_DIR, "medical_qa.json")

_model = None
_tokenizer = None
_summarizer_pipe = None

def _load_or_prepare_dataset():
    df = pd.read_json(QA_PATH)
    inputs = [f"summarize: {q} {a}" for q, a in zip(df["question"], df["answer"])]
    targets = df["answer"].tolist()
    return Dataset.from_dict({"input_text": inputs, "target_text": targets})

def _train_small_t5():
    global _model, _tokenizer
    os.makedirs(FINETUNED_DIR, exist_ok=True)

    base_model_name = "t5-small"
    _tokenizer = T5TokenizerFast.from_pretrained(base_model_name)
    _model = T5ForConditionalGeneration.from_pretrained(base_model_name)

    ds = _load_or_prepare_dataset()

    def preprocess(batch):
        model_inputs = _tokenizer(batch["input_text"], max_length=256, truncation=True)
        labels = _tokenizer(text_target=batch["target_text"], max_length=128, truncation=True)
        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    tokenized = ds.map(preprocess, batched=True, remove_columns=ds.column_names)

    data_collator = DataCollatorForSeq2Seq(_tokenizer, model=_model)

    args = TrainingArguments(
        output_dir=os.path.join(MODELS_DIR, "runs"),
        per_device_train_batch_size=2,
        num_train_epochs=1,
        learning_rate=5e-5,
        logging_steps=5,
        save_strategy="no",
        report_to=[],
    )

    trainer = Trainer(
        model=_model,
        args=args,
        train_dataset=tokenized,
        data_collator=data_collator,
    )
    trainer.train()

    _model.save_pretrained(FINETUNED_DIR)
    _tokenizer.save_pretrained(FINETUNED_DIR)

def ensure_model():
    global _model, _tokenizer, _summarizer_pipe
    if os.path.exists(FINETUNED_DIR):
        _tokenizer = T5TokenizerFast.from_pretrained(FINETUNED_DIR)
        _model = T5ForConditionalGeneration.from_pretrained(FINETUNED_DIR)
    else:
        try:
            _train_small_t5()
        except Exception:
            base_model_name = "t5-small"
            _tokenizer = T5TokenizerFast.from_pretrained(base_model_name)
            _model = T5ForConditionalGeneration.from_pretrained(base_model_name)

    _summarizer_pipe = pipeline(
        "text2text-generation",
        model=_model,
        tokenizer=_tokenizer,
        framework="pt",
    )

def _generate(text: str, max_new_tokens: int = 160) -> str:
    out = _summarizer_pipe(text, max_new_tokens=max_new_tokens, do_sample=False)
    return out[0]["generated_text"]

def generate_patient_summary(cleaned_text: str) -> str:
    prompt = f"summarize for patient in plain words: {cleaned_text}"
    return _generate(prompt, max_new_tokens=160)

def generate_clinician_summary(cleaned_text: str) -> str:
    prompt = f"summarize clinically with medical terms: {cleaned_text}"
    return _generate(prompt, max_new_tokens=200)
