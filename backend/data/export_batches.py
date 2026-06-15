import pandas as pd
import os

#  Config 
CSV        = "medical_corpus.csv"
OUTPUT_DIR = "translation_batches"
BATCH_SIZE = 200

# Setup 
os.makedirs(OUTPUT_DIR, exist_ok=True)

#  Load CSV 
print("Loading corpus...")
df = pd.read_csv(CSV, encoding="utf-8")

print(f"Total rows loaded : {len(df)}")
print(f"Columns           : {list(df.columns)}")

# Normalize sesotho_text column 
df["sesotho_text"] = df["sesotho_text"].fillna("").astype(str).str.strip()

#  Filter untranslated rows
untranslated = df[df["sesotho_text"] == ""].copy()
untranslated = untranslated[["sentence_id", "domain_category", "english_text", "sesotho_text"]].reset_index(drop=True)

print(f"Untranslated rows : {len(untranslated)}")
print(f"Already translated: {len(df) - len(untranslated)}")
print()

if len(untranslated) == 0:
    print("All sentences are already translated. Nothing to export.")
    exit()

#  Split into batches 
total   = len(untranslated)
batches = (total // BATCH_SIZE) + (1 if total % BATCH_SIZE else 0)

print(f"Exporting {total} sentences into {batches} batches of {BATCH_SIZE}...")
print()

for i in range(batches):
    start     = i * BATCH_SIZE
    end       = start + BATCH_SIZE
    chunk     = untranslated.iloc[start:end].copy()
    batch_num = str(i + 1).zfill(3)
    filename  = os.path.join(OUTPUT_DIR, f"batch_{batch_num}.csv")

    chunk.to_csv(filename, index=False, encoding="utf-8-sig")

    print(f"  batch_{batch_num}.csv  →  {len(chunk)} sentences  "
          f"(IDs {chunk['sentence_id'].iloc[0]} to {chunk['sentence_id'].iloc[-1]})")

#  Summary 
print()
print("─" * 50)
print(f"Done!")
print(f"Total sentences : {total}")
print(f"Total batches   : {batches}")
print(f"Batch size      : {BATCH_SIZE}")
print(f"Output folder   : {os.path.abspath(OUTPUT_DIR)}")
print("─" * 50)
print()
print("Next steps:")
print("  1. Open translation_batches/ folder")
print("  2. Upload each batch_XXX.csv to Google Sheets")
print("  3. Share with your translators")
print("  4. When done, run: python import_batch.py translation_batches/batch_001_done.csv")