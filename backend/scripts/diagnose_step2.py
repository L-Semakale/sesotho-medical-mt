# save as: C:\sesotho-medical-mt\backend\scripts\diagnose_step2.py

from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

MODEL_NAME = "facebook/nllb-200-distilled-600M"
SRC_LANG   = "eng_Latn"
TGT_LANG   = "sot_Latn"

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

print("Loading model...")
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
model.eval()

print("Testing single sentence...")
test_sentence = "Wash your hands before eating."

try:
    tokenizer.src_lang = SRC_LANG
    inputs = tokenizer(
        test_sentence,
        return_tensors="pt",
        truncation=True,
        max_length=256
    )

    forced_bos = tokenizer.convert_tokens_to_ids(TGT_LANG)
    print(f"Forced BOS token ID for {TGT_LANG}: {forced_bos}")

    if forced_bos == tokenizer.unk_token_id:
        print(f"ERROR: '{TGT_LANG}' is not a recognised language token!")
        print("Trying alternative token name...")
        # Try alternative Sesotho token
        for alt in ["sot_Latn", "nso_Latn", "sot"]:
            tid = tokenizer.convert_tokens_to_ids(alt)
            print(f"  {alt} -> token ID: {tid}")
    else:
        with torch.no_grad():
            output_ids = model.generate(
                **inputs,
                forced_bos_token_id=forced_bos,
                max_length=256
            )
        result = tokenizer.batch_decode(output_ids, skip_special_tokens=True)
        print(f"Translation: {result[0]}")
        print("SUCCESS — model is working correctly")

except Exception as e:
    import traceback
    print(f"FAILED: {e}")
    traceback.print_exc()
