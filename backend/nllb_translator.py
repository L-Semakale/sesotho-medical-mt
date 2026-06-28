from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import os

FINETUNED_PATH = "./models/nllb-finetuned-sesotho"
BASE_PATH      = "./models/nllb-600M"
REMOTE_NAME    = "facebook/nllb-200-distilled-600M"

# Pick the best available model — fine-tuned → base → remote download
if os.path.isdir(FINETUNED_PATH) and os.listdir(FINETUNED_PATH):
    MODEL_PATH = FINETUNED_PATH
elif os.path.isdir(BASE_PATH) and os.listdir(BASE_PATH):
    MODEL_PATH = BASE_PATH
else:
    MODEL_PATH = REMOTE_NAME

LANG_CODES = {
    "english": "eng_Latn",
    "sesotho": "sot_Latn",
}

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

_tokenizer = None
_model     = None


def _load_model():
    global _tokenizer, _model
    if _model is not None:
        return

    print(f"  [nllb] Loading from : {MODEL_PATH}")
    print(f"  [nllb] Device       : {DEVICE}")
    if MODEL_PATH == REMOTE_NAME:
        print("  [nllb] Local model not found — downloading ~2.5GB from HuggingFace...")

    _tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    _model     = AutoModelForSeq2SeqLM.from_pretrained(MODEL_PATH)
    _model.eval()
    _model.to(DEVICE)
    print(f"  [nllb] Ready.")


def nllb_translate(text: str, src: str = "english", tgt: str = "sesotho") -> str:
    """
    Translate text using the NLLB-200 neural model.

    Args:
        text: Input text to translate.
        src:  Source language — 'english' or 'sesotho'.
        tgt:  Target language — 'english' or 'sesotho'.

    Returns:
        Translated string.
    """
    if src not in LANG_CODES:
        raise ValueError(f"Unsupported source language: '{src}'. Choose from {list(LANG_CODES)}")
    if tgt not in LANG_CODES:
        raise ValueError(f"Unsupported target language: '{tgt}'. Choose from {list(LANG_CODES)}")
    if src == tgt:
        return text

    _load_model()

    src_code = LANG_CODES[src]
    tgt_code = LANG_CODES[tgt]

    _tokenizer.src_lang = src_code
    inputs = _tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        generated = _model.generate(
            **inputs,
            forced_bos_token_id=_tokenizer.convert_tokens_to_ids(tgt_code),
            max_length=128,
            num_beams=4,
            early_stopping=True,
        )

    return _tokenizer.batch_decode(generated, skip_special_tokens=True)[0]
