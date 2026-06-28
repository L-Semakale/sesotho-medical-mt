# download.py — handles both .zip and .gz formats
import pandas as pd
import requests
import zipfile
import gzip
import io
import os

all_pairs = []

def fetch_opus_zip(name, url):
    """Download a .zip OPUS corpus and return list of (st, en) pairs."""
    global all_pairs
    print(f"Downloading {name}...")
    try:
        r = requests.get(url, timeout=120)
        z = zipfile.ZipFile(io.BytesIO(r.content))
        names = z.namelist()
        st_file = [f for f in names if f.endswith(".st")][0]
        en_file = [f for f in names if f.endswith(".en")][0]
        st_lines = z.read(st_file).decode("utf-8").splitlines()
        en_lines = z.read(en_file).decode("utf-8").splitlines()
        before = len(all_pairs)
        for st, en in zip(st_lines, en_lines):
            if st.strip() and en.strip():
                all_pairs.append({"sesotho": st.strip(), "english": en.strip()})
        print(f"   {name} → +{len(all_pairs) - before:,} pairs")
    except Exception as e:
        print(f"   {name} failed: {e}")


def fetch_opus_gz(name, url_st, url_en):
    """Download two separate .gz files (source + target) and return pairs."""
    global all_pairs
    print(f"Downloading {name}...")
    try:
        r_st = requests.get(url_st, timeout=120)
        r_en = requests.get(url_en, timeout=120)
        st_lines = gzip.decompress(r_st.content).decode("utf-8").splitlines()
        en_lines = gzip.decompress(r_en.content).decode("utf-8").splitlines()
        before = len(all_pairs)
        for st, en in zip(st_lines, en_lines):
            if st.strip() and en.strip():
                all_pairs.append({"sesotho": st.strip(), "english": en.strip()})
        print(f"   {name} → +{len(all_pairs) - before:,} pairs")
    except Exception as e:
        print(f"   {name} failed: {e}")


#  1. JW300 (.gz) 
fetch_opus_gz(
    "JW300",
    "https://object.pouta.csc.fi/OPUS-JW300/v1/moses/en-st.txt.zip",
    "https://object.pouta.csc.fi/OPUS-JW300/v1/moses/en-st.txt.zip",
)

# Try alternative direct gz links
fetch_opus_gz(
    "JW300 (gz)",
    "https://object.pouta.csc.fi/OPUS-JW300/v1/mono/st.txt.gz",
    "https://object.pouta.csc.fi/OPUS-JW300/v1/mono/en.txt.gz",
)

#  2. WikiMatrix (.gz) 
fetch_opus_gz(
    "WikiMatrix (gz)",
    "https://object.pouta.csc.fi/OPUS-WikiMatrix/v1/mono/st.txt.gz",
    "https://object.pouta.csc.fi/OPUS-WikiMatrix/v1/mono/en.txt.gz",
)

#  3. CCAligned (.zip) — already works 
fetch_opus_zip(
    "CCAligned",
    "https://object.pouta.csc.fi/OPUS-CCAligned/v1/moses/en-st.txt.zip",
)

#  4. GNOME (.zip) — already works 
fetch_opus_zip(
    "GNOME",
    "https://object.pouta.csc.fi/OPUS-GNOME/v1/moses/en-st.txt.zip",
)

#  5. Ubuntu (.zip) — already works 
fetch_opus_zip(
    "Ubuntu",
    "https://object.pouta.csc.fi/OPUS-Ubuntu/v14.10/moses/en-st.txt.zip",
)

#  6. OpenSubtitles 
fetch_opus_zip(
    "OpenSubtitles",
    "https://object.pouta.csc.fi/OPUS-OpenSubtitles/v2018/moses/en-st.txt.zip",
)

#  7. GlobalVoices 
fetch_opus_zip(
    "GlobalVoices",
    "https://object.pouta.csc.fi/OPUS-GlobalVoices/v2018q4/moses/en-st.txt.zip",
)

#  8. KDE4 
fetch_opus_zip(
    "KDE4",
    "https://object.pouta.csc.fi/OPUS-KDE4/v2/moses/en-st.txt.zip",
)


#  Clean & Save 
print(f"\nRaw collected: {len(all_pairs):,} pairs")
print("Cleaning...")

if len(all_pairs) == 0:
    print(" No pairs collected.")
else:
    df = pd.DataFrame(all_pairs)
    df = df.dropna()
    df = df[df["sesotho"].str.len() > 5]
    df = df[df["english"].str.len() > 5]
    df = df[df["sesotho"] != df["english"]]
    df = df.drop_duplicates(subset=["sesotho"])
    df = df.reset_index(drop=True)

    print(f" Final corpus: {len(df):,} pairs")
    df.to_csv("corpus.csv", index=False)
    print("Saved → corpus.csv")
    print("\nSample:")
    print(df.head(3).to_string())
