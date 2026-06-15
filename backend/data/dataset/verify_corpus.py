import pandas as pd
import os

CSV_FILE = r"C:\sesotho-medical-mt\backend\data\dataset\medical_corpus.csv"
DATASET_DIR = r"C:\sesotho-medical-mt\backend\data\dataset"

df = pd.read_csv(CSV_FILE)

print("=" * 60)
print("       MEDICAL CORPUS VERIFICATION REPORT")
print("=" * 60)

# ── Basic Stats ──
print(f"\n  Total entries        : {len(df)}")
print(f"  First sentence_id    : {df['sentence_id'].min()}")
print(f"  Last sentence_id     : {df['sentence_id'].max()}")
print(f"  Expected entries     : 1000")
print(f"  Missing entries      : {1000 - len(df)}")

# ── Duplicate Check ──
dupes = df[df.duplicated(subset='english_text', keep=False)]
print(f"\n  Duplicate entries    : {len(dupes)}")

# ── Missing Values ──
print(f"\n   Missing values per column:")
for col in df.columns:
    missing = df[col].isna().sum()
    flag = "⚠️ " if missing > 0 else "✅"
    print(f"    {flag}  {col:<30} : {missing} missing")

# ── Domain Breakdown ──
print(f"\n   Entries by domain_category:")
for domain, count in df['domain_category'].value_counts().items():
    print(f"    {domain:<35} : {count}")

# ── Source Breakdown ──
print(f"\n  Entries by source:")
for source, count in df['source'].value_counts().items():
    print(f"    {source:<35} : {count}")

# ── Reviewer Status ──
print(f"\n  Reviewer status breakdown:")
for status, count in df['reviewer_status'].value_counts().items():
    print(f"    {status:<35} : {count}")

# ── Sesotho Translation Status (fixed) ──
print(f"\n  Sesotho translations:")
translated = df['sesotho_text'].apply(
    lambda x: isinstance(x, str) and x.strip() != ''
)
print(f"      Translated          : {translated.sum()}")
print(f"      Awaiting translation : {(~translated).sum()}")

# ── Sentence ID Gap Detection ──
print(f"\n  Checking for sentence_id gaps...")
all_ids     = set(df['sentence_id'].astype(int).tolist())
expected    = set(range(1, df['sentence_id'].max() + 1))
missing_ids = sorted(expected - all_ids)
if missing_ids:
    print(f"      {len(missing_ids)} missing IDs detected:")
    # Print in ranges for readability
    ranges = []
    start = missing_ids[0]
    end   = missing_ids[0]
    for mid in missing_ids[1:]:
        if mid == end + 1:
            end = mid
        else:
            ranges.append((start, end))
            start = mid
            end   = mid
    ranges.append((start, end))
    for s, e in ranges:
        if s == e:
            print(f"        ID {s}")
        else:
            print(f"        IDs {s} – {e}  ({e - s + 1} entries)")
else:
    print(f"      No gaps found — IDs are sequential.")

# ── Batch File Entry Count Diagnosis ──
print(f"\n   Diagnosing batch files in dataset folder...")
batch_files = [
    "hiv_batch1.py",
    "hiv_batch2.py",
    "hiv_batch3.py",
    "hiv_batch4.py",
    "hiv_batch5.py",
]
for fname in batch_files:
    fpath = os.path.join(DATASET_DIR, fname)
    if os.path.exists(fpath):
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        count = content.count('"english_text"')
        print(f"      {fname:<25} : {count} english_text entries found in script")
    else:
        print(f"      {fname:<25} : FILE NOT FOUND")

# ── Sample Rows ──
print(f"\n  First 3 entries:")
print(df[['sentence_id', 'domain_category', 'english_text', 'source']].head(3).to_string(index=False))

print(f"\n  Last 3 entries:")
print(df[['sentence_id', 'domain_category', 'english_text', 'source']].tail(3).to_string(index=False))

print("\n" + "=" * 60)
print("  Verification complete.")
print("=" * 60)
