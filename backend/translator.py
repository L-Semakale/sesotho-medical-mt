from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

MODEL_NAME = "facebook/nllb-200-distilled-600M"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

LANG = {"en": "eng_Latn", "st": "sot_Latn"}

def translate(text, src, tgt):
    tokenizer.src_lang = LANG[src]
    inputs = tokenizer(text, return_tensors="pt")
    out = model.generate(
        **inputs,
        forced_bos_token_id=tokenizer.convert_tokens_to_ids(LANG[tgt]),
        max_length=128,
    )
    return tokenizer.batch_decode(out, skip_special_tokens=True)[0]
