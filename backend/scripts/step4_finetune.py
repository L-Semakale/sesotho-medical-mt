# save as: C:\sesotho-medical-mt\backend\scripts\step4_finetune.py

from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    DataCollatorForSeq2Seq,
    get_linear_schedule_with_warmup,
)
from datasets import Dataset
from torch.utils.data import DataLoader
from torch.optim import AdamW
import pandas as pd
import numpy as np
import torch
import os

# Config
CORPUS_PATH = r"C:\sesotho-medical-mt\backend\data\full_corpus.csv"
OUTPUT_DIR  = r"C:\sesotho-medical-mt\backend\models\nllb-finetuned-sesotho"
MODEL_NAME  = "facebook/nllb-200-distilled-600M"
SRC_LANG    = "eng_Latn"
TGT_LANG    = "sot_Latn"
MAX_LENGTH  = 64     # reduced from 128 — cuts memory usage by ~4x
EPOCHS      = 3
BATCH_SIZE  = 2      # reduced from 4
ACCUM_STEPS = 16     # increased to keep effective batch = 32
LR          = 5e-5
CPU_SOURCES = ["verified_medical", "back_translation"]

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Load corpus
print("Loading corpus...")
df     = pd.read_csv(CORPUS_PATH)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device: {device}")

df = df[df["source"].isin(CPU_SOURCES)].reset_index(drop=True)
df = df[["english", "sesotho"]].dropna().reset_index(drop=True)
print(f"Training pairs: {len(df):,}")

split    = int(len(df) * 0.95)
train_df = df.iloc[:split].reset_index(drop=True)
val_df   = df.iloc[split:].reset_index(drop=True)
print(f"Train: {len(train_df):,}  |  Validation: {len(val_df):,}")

# Tokenizer & model
print("Loading tokenizer...")
tokenizer          = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenizer.src_lang = SRC_LANG
tokenizer.tgt_lang = TGT_LANG

print("Loading model...")
model      = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
forced_bos = tokenizer.convert_tokens_to_ids(TGT_LANG)
model.generation_config.forced_bos_token_id = forced_bos
model.to(device)
print(f"Model loaded. forced_bos={forced_bos}")

# Tokenise — convert to numpy arrays to avoid slow tensor warning
def tokenize(batch):
    tokenizer.src_lang = SRC_LANG
    model_inputs = tokenizer(
        batch["english"], max_length=MAX_LENGTH, truncation=True, padding="max_length"
    )
    tokenizer.src_lang = TGT_LANG
    labels = tokenizer(
        batch["sesotho"], max_length=MAX_LENGTH, truncation=True, padding="max_length"
    )
    tokenizer.src_lang     = SRC_LANG
    # replace padding token id in labels with -100 so loss ignores them
    label_ids = np.array(labels["input_ids"])
    label_ids[label_ids == tokenizer.pad_token_id] = -100
    model_inputs["labels"] = label_ids.tolist()
    return model_inputs

print("Tokenising...")
train_ds = Dataset.from_pandas(train_df).map(tokenize, batched=True, batch_size=64)
val_ds   = Dataset.from_pandas(val_df).map(tokenize,   batched=True, batch_size=64)
train_ds = train_ds.remove_columns(["english", "sesotho"])
val_ds   = val_ds.remove_columns(["english", "sesotho"])
train_ds.set_format("torch")
val_ds.set_format("torch")
print("Tokenisation complete.")

# DataLoaders — no collator needed since we pad to max_length in tokenize
train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0)
val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

# Sanity check — forward pass on one batch before full training
print("\nRunning sanity check (1 forward pass)...")
model.eval()
with torch.no_grad():
    sample = next(iter(train_loader))
    sample = {k: v.to(device) for k, v in sample.items()}
    out    = model(**sample)
    print(f"Sanity check passed — loss: {out.loss.item():.4f}")

# Optimizer & scheduler
optimizer     = AdamW(model.parameters(), lr=LR, weight_decay=0.01)
total_steps   = (len(train_loader) // ACCUM_STEPS) * EPOCHS
scheduler     = get_linear_schedule_with_warmup(optimizer, 100, total_steps)

print(f"\nStarting training — {EPOCHS} epochs, {len(train_loader)} batches/epoch")
print(f"Effective batch size: {BATCH_SIZE * ACCUM_STEPS}  |  Total optimizer steps: {total_steps}\n")

best_val_loss = float("inf")

for epoch in range(1, EPOCHS + 1):
    model.train()
    optimizer.zero_grad()
    running_loss = 0.0
    step_count   = 0

    for step, batch in enumerate(train_loader, 1):
        batch   = {k: v.to(device) for k, v in batch.items()}
        outputs = model(**batch)
        loss    = outputs.loss / ACCUM_STEPS
        loss.backward()
        running_loss += outputs.loss.item()

        if step % ACCUM_STEPS == 0:
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            optimizer.zero_grad()
            step_count += 1

            if step_count % 10 == 0:
                avg = running_loss / (ACCUM_STEPS * 10)
                print(f"  Epoch {epoch} | opt-step {step_count} | loss {avg:.4f}")
                running_loss = 0.0

    # Validate
    model.eval()
    val_loss = 0.0
    with torch.no_grad():
        for batch in val_loader:
            batch     = {k: v.to(device) for k, v in batch.items()}
            val_loss += model(**batch).loss.item()

    avg_val = val_loss / len(val_loader)
    print(f"\nEpoch {epoch} complete — val_loss: {avg_val:.4f}")

    if avg_val < best_val_loss:
        best_val_loss = avg_val
        print(f"  New best! Saving checkpoint...")
        model.save_pretrained(OUTPUT_DIR)
        tokenizer.save_pretrained(OUTPUT_DIR)

print(f"\nTraining complete. Best val_loss: {best_val_loss:.4f}")
print(f"Model saved to: {OUTPUT_DIR}")
