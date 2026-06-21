from opustools import OpusRead
import pandas as pd
import os
import ssl
import urllib.request
import certifi

CACHE_DIR   = r"C:\sesotho-medical-mt\backend\data\opus_cache"
OUTPUT_PATH = r"C:\sesotho-medical-mt\backend\data\related_language_data.csv"

os.makedirs(CACHE_DIR, exist_ok=True)

# Moses format URLs — small files, language-pair only, no 87 GB zip needed
languages = [
    {
        "label":   "zulu",
        "source":  "en",
        "target":  "zu",
        "src_url": "https://object.pouta.csc.fi/OPUS-CCAligned/v1/moses/en-zu.txt.zip",
    },
    {
        "label":   "xhosa",
        "source":  "en",
        "target":  "xh",
        "src_url": "https://object.pouta.csc.fi/OPUS-CCAligned/v1/moses/en-xh.txt.zip",
    },
    {
        "label":   "tswana",
        "source":  "en",
        "target":  "tn",
        "src_url": "https://object.pouta.csc.fi/OPUS-CCAligned/v1/moses/en-tn.txt.zip",
    },
]


def download_file(url, dest_path):
    if os.path.exists(dest_path):
        print(f"  Already cached: {os.path.basename(dest_path)}")
        return True
    print(f"  Downloading: {url}")
    try:
        ctx = ssl.create_default_context(cafile=certifi.where())
        with urllib.request.urlopen(url, context=ctx) as response, \
             open(dest_path, "wb") as out_file:
            out_file.write(response.read())
        print(f"  Saved: {os.path.basename(dest_path)}")
        return True
    except Exception as e:
        print(f"  Download failed: {e}")
        return False


all_pairs = []

for lang in languages:
    print(f"\nProcessing: CCAligned ({lang['label']})")

    zip_file = os.path.join(CACHE_DIR, f"CCAligned_en-{lang['target']}_moses.zip")

    if not download_file(lang["src_url"], zip_file):
        print(f"  Skipping {lang['label']} — download failed")
        continue

    # Extract the two plain text files from the zip
    import zipfile
    try:
        with zipfile.ZipFile(zip_file, "r") as z:
            members = z.namelist()
            print(f"  Files in zip: {members}")

            # Moses zip contains CCAligned.en-zu.en and CCAligned.en-zu.zu
            src_member = [m for m in members if m.endswith(f".{lang['source']}")][0]
            tgt_member = [m for m in members if m.endswith(f".{lang['target']}")][0]

            src_path = os.path.join(CACHE_DIR, os.path.basename(src_member))
            tgt_path = os.path.join(CACHE_DIR, os.path.basename(tgt_member))

            z.extract(src_member, CACHE_DIR)
            z.extract(tgt_member, CACHE_DIR)

        with open(src_path, encoding="utf-8") as f:
            src_lines = [l.strip() for l in f if l.strip()]
        with open(tgt_path, encoding="utf-8") as f:
            tgt_lines = [l.strip() for l in f if l.strip()]

        pairs = list(zip(src_lines, tgt_lines))
        for en, tgt in pairs:
            all_pairs.append({
                "english": en,
                "sesotho": tgt,
                "source":  lang["label"]
            })

        print(f"  OK: {len(pairs):,} pairs collected")

    except Exception as e:
        print(f"  FAILED extracting {lang['label']}: {e}")


# Save
if len(all_pairs) == 0:
    print("\nNo pairs collected.")
else:
    df = pd.DataFrame(all_pairs).drop_duplicates(subset=["english"]).reset_index(drop=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"\nTotal related language pairs saved: {len(df):,}")
    print(f"Saved to: {OUTPUT_PATH}")
    print("\nBreakdown by language:")
    print(df["source"].value_counts().to_string())
