import pandas as pd
import os

DATA_DIR    = r"C:\sesotho-medical-mt\backend\data"
OUTPUT_PATH = os.path.join(DATA_DIR, "full_corpus.csv")

#  Source files and their column mappings 
sources = [
    {
        "path":   os.path.join(DATA_DIR, "medical_corpus.csv"),
        "label":  "verified_medical",
        "en_col": "english_text",   # <-- fixed
        "st_col": "sesotho_text",   # <-- fixed
    },
    {
        "path":   os.path.join(DATA_DIR, "corpus.csv"),
        "label":  "opus_general",
        "en_col": "english",
        "st_col": "sesotho",
    },
    {
        "path":   os.path.join(DATA_DIR, "related_language_data.csv"),
        "label":  "related_language",
        "en_col": "english",
        "st_col": "sesotho",
    },
    {
        "path":   os.path.join(DATA_DIR, "synthetic_pairs.csv"),
        "label":  "back_translation",
        "en_col": "english",
        "st_col": "sesotho",
    },
]

#  Load and normalise each source 
frames = []
print("Loading sources:\n")

for src in sources:
    if not os.path.exists(src["path"]):
        print(f"  SKIPPED (not found): {src['path']}")
        continue

    df = pd.read_csv(src["path"])

    # Normalise column names to standard 'english' / 'sesotho'
    df = df.rename(columns={
        src["en_col"]: "english",
        src["st_col"]: "sesotho"
    })

    # Keep only the two core columns + source label
    df = df[["english", "sesotho"]].copy()
    df["source"] = src["label"]

    # Basic cleaning
    df = df.dropna(subset=["english", "sesotho"])
    df["english"] = df["english"].str.strip()
    df["sesotho"] = df["sesotho"].str.strip()
    df = df[df["english"].str.len() > 3]
    df = df[df["sesotho"].str.len() > 3]

    print(f"  {src['label']:<25} {len(df):>8,} pairs  ({os.path.basename(src['path'])})")
    frames.append(df)

#  Merge 
print("\nMerging...")
full = pd.concat(frames, ignore_index=True)

before_dedup = len(full)
full = full.drop_duplicates(subset=["english", "sesotho"]).reset_index(drop=True)
after_dedup  = len(full)

print(f"  Removed {before_dedup - after_dedup:,} duplicate pairs")

#  Source breakdown 
print("\nFinal corpus breakdown:")
for source, count in full["source"].value_counts().items():
    pct = count / len(full) * 100
    print(f"  {source:<25} {count:>8,} pairs  ({pct:.1f}%)")

print(f"\n  {'TOTAL':<25} {len(full):>8,} pairs")

#  Save 
full.to_csv(OUTPUT_PATH, index=False)
print(f"\nSaved full corpus to: {OUTPUT_PATH}")
