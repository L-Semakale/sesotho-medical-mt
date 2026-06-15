from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import os

# If you've downloaded the model locally (recommended), set this path.
# Run download_model.py once first, then Flask will never need internet access.
# If the local path doesn't exist, falls back to downloading from HuggingFace.
LOCAL_MODEL_PATH = "./models/nllb-600M"
REMOTE_MODEL_NAME = "facebook/nllb-200-distilled-600M"

MODEL_PATH = LOCAL_MODEL_PATH if os.path.isdir(LOCAL_MODEL_PATH) else REMOTE_MODEL_NAME

LANG_CODES = {
    "english": "eng_Latn",
    "sesotho": "sot_Latn",
}

# Lazy-loaded globals — model is NOT loaded at import time.
# It loads on the first call to nllb_translate(), so Flask starts instantly.
_tokenizer = None
_model = None


def _load_model():
    """Load model and tokenizer into memory (only runs once)."""
    global _tokenizer, _model
    if _model is not None:
        return  # Already loaded

    print(f"Loading NLLB-200 model from: {MODEL_PATH}")
    if MODEL_PATH == REMOTE_MODEL_NAME:
        print("  (local model not found — downloading ~2.5GB from HuggingFace, please wait)")

    _tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    _model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_PATH)
    _model.eval()
    print("NLLB-200 loaded and ready.")


def nllb_translate(text: str, src: str = "english", tgt: str = "sesotho") -> str:
    """
    Translate text using the NLLB-200 neural model.

    Args:
        text: Input text to translate.
        src:  Source language key — 'english' or 'sesotho'.
        tgt:  Target language key — 'english' or 'sesotho'.

    Returns:
        Translated string.
    """
    if src not in LANG_CODES:
        raise ValueError(f"Unsupported source language: '{src}'. Choose from {list(LANG_CODES)}")
    if tgt not in LANG_CODES:
        raise ValueError(f"Unsupported target language: '{tgt}'. Choose from {list(LANG_CODES)}")
    if src == tgt:
        return text  # No-op

    _load_model()

    src_code = LANG_CODES[src]
    tgt_code = LANG_CODES[tgt]

    _tokenizer.src_lang = src_code
    inputs = _tokenizer(text, return_tensors="pt", truncation=True, max_length=512)

    with torch.no_grad():
        generated = _model.generate(
            **inputs,
            forced_bos_token_id=_tokenizer.convert_tokens_to_ids(tgt_code),
            max_length=128,
            num_beams=4,          # beam search for better quality
            early_stopping=True,
        )

    return _tokenizer.batch_decode(generated, skip_special_tokens=True)[0]