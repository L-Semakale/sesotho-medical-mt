from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import pandas as pd
import torch
import os
import time
import traceback

INPUT_PATH      = r"C:\sesotho-medical-mt\backend\data\english_medical_sentences.txt"
OUTPUT_PATH     = r"C:\sesotho-medical-mt\backend\data\synthetic_pairs.csv"
CHECKPOINT_PATH = r"C:\sesotho-medical-mt\backend\data\synthetic_pairs_checkpoint.csv"

MODEL_NAME  = "facebook/nllb-200-distilled-600M"
SRC_LANG    = "eng_Latn"
TGT_LANG    = "sot_Latn"
BATCH_SIZE  = 4    # smaller batch — safer for CPU RAM
MAX_LENGTH  = 128  # reduced from 256 — medical sentences are short, 2x speed boost
SAVE_EVERY  = 20   # save every 20 sentences — frequent checkpoints on CPU

#  Input 
with open(INPUT_PATH, encoding="utf-8") as f:
    all_sentences = [line.strip() for line in f if line.strip()]

print(f"Loaded {len(all_sentences):,} English sentences")

#  Resume from checkpoint 
results = []
already_done = set()
if os.path.exists(CHECKPOINT_PATH):
    df_ckpt = pd.read_csv(CHECKPOINT_PATH)
    results = df_ckpt.to_dict("records")
    already_done = set(df_ckpt["english"].tolist())
    print(f"Resuming — {len(already_done):,} already translated")

english_sentences = [s for s in all_sentences if s not in already_done]
print(f"Sentences to translate: {len(english_sentences):,}")

if len(english_sentences) == 0:
    print("Nothing to translate.")
    exit()

#  Device 
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device: {device}")

#  Load model 
print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

print("Loading model...")
model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float32  # explicit — avoids half-precision issues on CPU
)
model.to(device)
model.eval()
print("Model ready.\n")

#  Translate 
forced_bos = tokenizer.convert_tokens_to_ids(TGT_LANG)

def translate_batch(sentences):
    tokenizer.src_lang = SRC_LANG
    inputs = tokenizer(
        sentences,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=MAX_LENGTH
    ).to(device)

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            forced_bos_token_id=forced_bos,
            max_length=MAX_LENGTH,
            num_beams=2,          # reduced from default 4 — 2x faster on CPU
            early_stopping=True
        )

    return tokenizer.batch_decode(output_ids, skip_special_tokens=True)


total   = len(english_sentences)
start   = time.time()

for i in range(0, total, BATCH_SIZE):
    batch     = english_sentences[i : i + BATCH_SIZE]
    batch_num = i // BATCH_SIZE + 1

    try:
        t0           = time.time()
        translations = translate_batch(batch)
        elapsed      = time.time() - t0

        for sent, translation in zip(batch, translations):
            results.append({
                "english": sent,
                "sesotho": translation,
                "source":  "back_translation"
            })

        done     = min(i + BATCH_SIZE, total)
        pct      = done / total * 100
        avg_sec  = (time.time() - start) / done
        eta_min  = avg_sec * (total - done) / 60

        print(
            f"[{done:>4}/{total}] {pct:5.1f}% | "
            f"batch {elapsed:.1f}s | "
            f"ETA {eta_min:.1f} min"
        )

    except Exception as e:
        print(f"Batch {batch_num} FAILED: {e}")
        traceback.print_exc()

    # Checkpoint
    if (i // BATCH_SIZE + 1) % (SAVE_EVERY // BATCH_SIZE) == 0:
        pd.DataFrame(results).to_csv(CHECKPOINT_PATH, index=False)
        print(f"  checkpoint saved ({len(results)} pairs)")

#  Final save  
df = pd.DataFrame(results).drop_duplicates(subset=["english"]).reset_index(drop=True)
df.to_csv(OUTPUT_PATH, index=False)

if os.path.exists(CHECKPOINT_PATH):
    os.remove(CHECKPOINT_PATH)

total_time = (time.time() - start) / 60
print(f"\nGenerated {len(df):,} synthetic pairs in {total_time:.1f} minutes")
print(f"Saved to: {OUTPUT_PATH}")
