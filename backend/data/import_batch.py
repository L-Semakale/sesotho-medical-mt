import pandas as pd
import sys
import os

# Config 
CSV = "medical_corpus.csv"

# Check argument 
if len(sys.argv) < 2:
    print("Usage: python import_batch.py translation_batches/batch_001_done.csv")
    sys.exit(1)

batch_file = sys.argv[1]

if not os.path.exists(batch_file):
    print(f"ERROR: File not found → {batch_file}")
    sys.exit(1)

#  Load files 
print(f"Loading corpus     : {CSV}")
print(f"Loading batch file : {batch_file}")

df    = pd.read_csv(CSV, encoding="utf-8")
batch = pd.read_csv(batch_file, encoding="utf-8-sig")

df["sesotho_text"]    = df["sesotho_text"].fillna("").astype(str).str.strip()
batch["sesotho_text"] = batch["sesotho_text"].fillna("").astype(str).str.strip()

#  Import translations 
updated = 0
empty   = 0
missing = 0

for _, row in batch.iterrows():
    sid  = row["sentence_id"]
    text = row["sesotho_text"]

    if not text:
        empty += 1
        continue

    idx = df[df["sentence_id"] == sid].index

    if len(idx) == 0:
        missing += 1
        continue

    df.at[idx[0], "sesotho_text"]    = text
    df.at[idx[0], "reviewer_status"] = "reviewed"
    updated += 1

#  Save 
df.to_csv(CSV, index=False, encoding="utf-8")

#  Report 
print()
print("─" * 50)
print(f"Batch file : {batch_file}")
print(f"Updated    : {updated} rows")
print(f"Empty      : {empty} rows (not translated)")
print(f"Not found  : {missing} rows")
print("─" * 50)
print()

#  Overall progress 
total      = len(df)
done       = len(df[df["sesotho_text"] != ""])
remaining  = total - done
pct        = round((done / total) * 100, 1)

bar_done  = int(pct // 5)
bar_left  = 20 - bar_done
bar       = "█" * bar_done + "░" * bar_left

print(f" Translation Progress ")
print(f"  [{bar}] {pct}%")
print(f"  Translated : {done} / {total}")
print(f"  Remaining  : {remaining}")
print("─" * 50)
