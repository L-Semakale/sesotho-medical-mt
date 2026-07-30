import os
import re
import sqlite3
import threading
from datetime import datetime

import faiss
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from sentence_transformers import SentenceTransformer

from nllb_translator import nllb_translate
from safety import check_safety


app = Flask(__name__)

CORS(app,
     origins=[
         "https://sesotho-medical-mt.vercel.app",
         "https://sesotho-medical-2tym4ugnj-limpho.vercel.app",

         "http://localhost:3000",
         "http://127.0.0.1:3000",

         "http://localhost:5173",
         "http://127.0.0.1:5173",

         "http://192.168.56.1:3000",
         "http://192.168.1.79:3000",
         "http://192.168.1.79:5173",
     ],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True
)

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")
os.makedirs(DATA_DIR, exist_ok=True)

CSV_FILE = os.path.join(DATA_DIR, "medical_corpus.csv")
DB_FILE = os.path.join(DATA_DIR, "system.db")

COLUMNS = [
    "sentence_id", "domain_category", "english_text",
    "sesotho_text", "source", "source_reference",
    "translator_code", "reviewer_status", "notes"
]

VALID_STATUSES = {"raw", "translated", "reviewed", "verified", "rejected"}


# ---------------------------------------------------------------------
# Input language validation helpers
# ---------------------------------------------------------------------

def contains_unsupported_script(text: str) -> bool:
    """
    Blocks scripts outside the expected English/Sesotho Latin alphabet.

    This prevents the prototype from translating languages outside scope,
    such as Japanese, Chinese, Korean, Arabic, Cyrillic, and Devanagari.
    """

    unsupported_patterns = [
        r"[\u3040-\u309F]",  # Japanese Hiragana
        r"[\u30A0-\u30FF]",  # Japanese Katakana
        r"[\u4E00-\u9FFF]",  # Chinese/Japanese/Korean ideographs
        r"[\uAC00-\uD7AF]",  # Korean Hangul
        r"[\u0600-\u06FF]",  # Arabic
        r"[\u0400-\u04FF]",  # Cyrillic
        r"[\u0900-\u097F]",  # Devanagari
        r"[\u0E00-\u0E7F]",  # Thai
        r"[\u0590-\u05FF]",  # Hebrew
    ]

    return any(re.search(pattern, text) for pattern in unsupported_patterns)


def looks_like_supported_latin_text(text: str) -> bool:
    """
    Allows English/Sesotho-style Latin text, digits, whitespace,
    and common medical punctuation.

    Sesotho and English mainly use Latin-script characters, so this keeps
    the prototype within the approved English-Sesotho project scope.
    """

    allowed_pattern = r"^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s.,;:!?'\-()/%]+$"
    return bool(re.match(allowed_pattern, text))


def validate_translation_input_language(text: str, direction: str):
    """
    Validates that the input text is suitable for the selected
    English-Sesotho translation direction.

    Returns:
        tuple: (is_valid: bool, error_message: str)
    """

    if contains_unsupported_script(text):
        return False, (
            "Unsupported input language detected. "
            "This prototype only supports English and Sesotho medical text."
        )

    if not looks_like_supported_latin_text(text):
        return False, (
            "Unsupported characters detected. "
            "Please enter English or Sesotho medical text only."
        )

    return True, ""


# ---------------------------------------------------------------------
# Semantic corpus cache
# ---------------------------------------------------------------------

_embedder = None
_faiss_index = {"en": None, "st": None}
_corpus_sentences = {"en": [], "st": []}

_model_lock = threading.Lock()
_model_ready = threading.Event()


def build_faiss_index(df=None):
    global _embedder, _faiss_index, _corpus_sentences, corpus_df

    if df is None:
        df = load_corpus()

    corpus_df = df

    if _embedder is None:
        _embedder = SentenceTransformer(
            "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        )

    for lang, src_col, tgt_col in (
        ("en", "english_text", "sesotho_text"),
        ("st", "sesotho_text", "english_text"),
    ):
        sentences = df[src_col].astype(str).tolist()
        targets = df[tgt_col].astype(str).tolist()

        if not sentences:
            _faiss_index[lang] = None
            _corpus_sentences[lang] = []
            continue

        embeddings = _embedder.encode(sentences, show_progress_bar=False)
        embeddings = np.array(embeddings).astype("float32")
        faiss.normalize_L2(embeddings)

        index = faiss.IndexFlatIP(embeddings.shape[1])
        index.add(embeddings)

        _faiss_index[lang] = index
        _corpus_sentences[lang] = targets

    print(f"  FAISS index built — {len(df):,} rows")


def add_to_faiss_index(src_text: str, tgt_text: str, lang: str):
    if _embedder is None or _faiss_index.get(lang) is None:
        return

    vec = _embedder.encode([src_text], show_progress_bar=False)
    vec = np.array(vec).astype("float32")
    faiss.normalize_L2(vec)

    with _model_lock:
        _faiss_index[lang].add(vec)
        _corpus_sentences[lang].append(tgt_text)


def _load_model_and_index():
    with _model_lock:
        build_faiss_index()

    _model_ready.set()
    print("  Model + FAISS index ready — semantic search now active")


def semantic_lookup(text: str, lang: str = "en", threshold: float = 0.88):
    if not _model_ready.is_set():
        return None, 0.0

    index = _faiss_index.get(lang)

    if index is None or _embedder is None:
        return None, 0.0

    with _model_lock:
        vec = _embedder.encode([text], show_progress_bar=False)
        vec = np.array(vec).astype("float32")
        faiss.normalize_L2(vec)
        scores, indices = index.search(vec, k=1)

    score = float(scores[0][0])
    idx = int(indices[0][0])

    if score >= threshold:
        return _corpus_sentences[lang][idx], score

    return None, score


# ---------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT    UNIQUE NOT NULL,
            password_hash TEXT    NOT NULL,
            role          TEXT    NOT NULL DEFAULT 'user'
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            username         TEXT NOT NULL,
            input_text       TEXT NOT NULL,
            direction        TEXT NOT NULL,
            direction_label  TEXT NOT NULL,
            translated_text  TEXT NOT NULL,
            model            TEXT NOT NULL,
            created_at       TEXT NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            username   TEXT NOT NULL,
            rating     TEXT NOT NULL,
            comment    TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS usability_feedback (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            username   TEXT    NOT NULL,
            q1         INTEGER, q2  INTEGER, q3  INTEGER, q4  INTEGER, q5  INTEGER,
            q6         INTEGER, q7  INTEGER, q8  INTEGER, q9  INTEGER, q10 INTEGER,
            sus_score  REAL    NOT NULL,
            comment    TEXT,
            created_at TEXT    NOT NULL
        )
    """)

    c.execute("SELECT id FROM users WHERE username = 'admin'")

    if not c.fetchone():
        c.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            ("admin", generate_password_hash("Admin@MT2025"), "admin")
        )
        print("  Admin account created  →  admin / Admin@MT2025")

    conn.commit()
    conn.close()


init_db()


# ---------------------------------------------------------------------
# Corpus helpers
# ---------------------------------------------------------------------

def load_corpus():
    if not os.path.exists(CSV_FILE):
        return pd.DataFrame(columns=COLUMNS)

    df = pd.read_csv(CSV_FILE)

    for col in COLUMNS:
        if col not in df.columns:
            df[col] = ""

    return df[COLUMNS].fillna("")


def save_corpus(df):
    df.to_csv(CSV_FILE, index=False, encoding="utf-8")


corpus_df = load_corpus()

print("  Starting background model load...")
threading.Thread(target=_load_model_and_index, daemon=True).start()

print("  Translation pipeline ready:")
print("  Layer 1 → Exact corpus match")
print("  Layer 2 → Semantic similarity (FAISS + Sentence Transformers) [loading...]")
print("  Layer 3 → NLLB-200 neural translation")
print("  Safety  → High-risk term detection active for ALL layers")


# ---------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    username = data.get("username", "").strip().lower()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if username == "admin":
        return jsonify({"error": "That username is reserved"}), 400

    conn = get_db()

    try:
        conn.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'user')",
            (username, generate_password_hash(password))
        )
        conn.commit()

        return jsonify({
            "message": "Account created! You can now sign in."
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({"error": "Username already taken"}), 400

    finally:
        conn.close()


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    username = data.get("username", "").strip().lower()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = get_db()

    row = conn.execute(
        "SELECT * FROM users WHERE username = ?",
        (username,)
    ).fetchone()

    conn.close()

    if row and check_password_hash(row["password_hash"], password):
        return jsonify({
            "username": row["username"],
            "role": row["role"]
        }), 200

    return jsonify({"error": "Invalid username or password"}), 401


# ---------------------------------------------------------------------
# Translation route
# ---------------------------------------------------------------------

@app.route("/api/translate", methods=["POST"])
def translate_text():
    global corpus_df

    data = request.get_json() or {}

    text = data.get("text", "").strip()
    direction = data.get("direction", "en-st").strip().lower()
    username = data.get("username", "anonymous").strip().lower()

    SUPPORTED_DIRECTIONS = {
        "en-st": {
            "label": "English → Sesotho",
            "src_col": "english_text",
            "tgt_col": "sesotho_text",
            "src_lang": "english",
            "tgt_lang": "sesotho",
            "lookup_lang": "en"
        },
        "st-en": {
            "label": "Sesotho → English",
            "src_col": "sesotho_text",
            "tgt_col": "english_text",
            "src_lang": "sesotho",
            "tgt_lang": "english",
            "lookup_lang": "st"
        }
    }

    if not text:
        return jsonify({
            "error": "Text is required. Please enter English or Sesotho medical text."
        }), 400

    if direction not in SUPPORTED_DIRECTIONS:
        return jsonify({
            "error": (
                "Unsupported language direction. "
                "This system only supports English to Sesotho and Sesotho to English medical translation."
            ),
            "supported_directions": [
                {
                    "code": "en-st",
                    "label": "English → Sesotho"
                },
                {
                    "code": "st-en",
                    "label": "Sesotho → English"
                }
            ]
        }), 400

    is_valid_language, language_error = validate_translation_input_language(
        text,
        direction
    )

    if not is_valid_language:
        return jsonify({
            "error": language_error,
            "supported_language_pair": "English-Sesotho only",
            "input_rejected": True
        }), 400

    config = SUPPORTED_DIRECTIONS[direction]

    label = config["label"]
    src_col = config["src_col"]
    tgt_col = config["tgt_col"]
    src_lang = config["src_lang"]
    tgt_lang = config["tgt_lang"]
    lookup_lang = config["lookup_lang"]

    source = "unknown"
    model_used = "unknown"

    # Layer 1 — Exact corpus match
    match = corpus_df[
        corpus_df[src_col].astype(str).str.lower().str.strip()
        == text.lower().strip()
    ]

    if not match.empty:
        translated = match.iloc[0][tgt_col]
        model_used = "verified_corpus_exact"
        source = "corpus_match"

    else:
        # Layer 2 — Semantic similarity
        semantic_result, similarity = semantic_lookup(
            text,
            lang=lookup_lang,
            threshold=0.88
        )

        if semantic_result:
            translated = semantic_result
            model_used = f"verified_corpus_semantic ({similarity:.2f})"
            source = "semantic_search"

        else:
            # Layer 3 — NLLB-200 neural translation
            translated = nllb_translate(
                text,
                src=src_lang,
                tgt=tgt_lang
            )

            model_used = "nllb_model"
            source = "neural"

            # Run safety check here only to decide corpus promotion
            _pre_safety = check_safety(text, translated)

            if not _pre_safety["is_high_risk"]:
                df = load_corpus()

                if not df.empty:
                    df["sentence_id"] = df["sentence_id"].astype(int)

                    mask = (
                        df[src_col].astype(str).str.lower().str.strip()
                        == text.lower().strip()
                    ) & (
                        df["reviewer_status"] == "raw"
                    )

                    if mask.any():
                        df.loc[mask, tgt_col] = translated
                        df.loc[mask, "reviewer_status"] = "translated"

                        save_corpus(df)
                        corpus_df = df

                        add_to_faiss_index(
                            text,
                            translated,
                            lookup_lang
                        )

    # Safety check — always runs for every layer
    safety_check = check_safety(text, translated)

    # Log to history
    conn = get_db()

    conn.execute(
        """INSERT INTO history
           (username, input_text, direction, direction_label,
            translated_text, model, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            username,
            text,
            direction,
            label,
            translated,
            model_used,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
    )

    conn.commit()
    conn.close()

    return jsonify({
        "input_text": text,
        "direction": direction,
        "direction_label": label,
        "translated_text": translated,
        "model": model_used,
        "source": source,
        "safety": safety_check,
        "supported_language_pair": "English-Sesotho only"
    })


# ---------------------------------------------------------------------
# History route
# ---------------------------------------------------------------------

@app.route("/api/history", methods=["GET"])
def get_history():
    username = request.args.get("username", "")

    conn = get_db()

    if username:
        rows = conn.execute(
            "SELECT * FROM history WHERE username = ? ORDER BY id DESC",
            (username,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM history ORDER BY id DESC"
        ).fetchall()

    conn.close()

    return jsonify([dict(r) for r in rows])


# ---------------------------------------------------------------------
# Feedback routes
# ---------------------------------------------------------------------

@app.route("/api/feedback", methods=["POST"])
def submit_feedback():
    data = request.get_json() or {}

    username = data.get("username", "anonymous")
    rating = data.get("rating", "5")
    comment = data.get("comment", "").strip()

    try:
        rating_int = int(rating)

        if not (1 <= rating_int <= 10):
            raise ValueError

    except (ValueError, TypeError):
        return jsonify({
            "error": "Rating must be an integer between 1 and 10"
        }), 400

    conn = get_db()

    conn.execute(
        "INSERT INTO feedback (username, rating, comment, created_at) VALUES (?, ?, ?, ?)",
        (
            username,
            str(rating_int),
            comment,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Feedback submitted. Thank you!"
    })


@app.route("/api/feedback", methods=["GET"])
def get_feedback():
    conn = get_db()

    rows = conn.execute(
        "SELECT * FROM feedback ORDER BY id DESC"
    ).fetchall()

    conn.close()

    return jsonify([dict(r) for r in rows])


# ---------------------------------------------------------------------
# SUS usability routes
# ---------------------------------------------------------------------

@app.route("/api/sus", methods=["POST"])
def submit_sus():
    data = request.get_json() or {}

    username = data.get("username", "anonymous")
    responses = data.get("responses", {})
    sus_score = data.get("sus_score", 0)
    comment = data.get("comment", "").strip()

    try:
        sus_score = float(sus_score)

        if not (0 <= sus_score <= 100):
            raise ValueError

    except (ValueError, TypeError):
        return jsonify({
            "error": "Invalid SUS score. Must be between 0 and 100."
        }), 400

    conn = get_db()

    conn.execute(
        """INSERT INTO usability_feedback
           (username, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
            sus_score, comment, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            username,
            responses.get("1"),
            responses.get("2"),
            responses.get("3"),
            responses.get("4"),
            responses.get("5"),
            responses.get("6"),
            responses.get("7"),
            responses.get("8"),
            responses.get("9"),
            responses.get("10"),
            sus_score,
            comment,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "SUS response recorded.",
        "sus_score": sus_score
    })


@app.route("/api/sus", methods=["GET"])
def get_sus_results():
    conn = get_db()

    rows = conn.execute(
        "SELECT * FROM usability_feedback ORDER BY id DESC"
    ).fetchall()

    conn.close()

    results = [dict(r) for r in rows]

    avg_score = (
        round(sum(r["sus_score"] for r in results) / len(results), 1)
        if results else 0
    )

    return jsonify({
        "average_sus": avg_score,
        "count": len(results),
        "results": results,
    })


# ---------------------------------------------------------------------
# Corpus routes
# ---------------------------------------------------------------------

@app.route("/api/corpus", methods=["GET"])
def get_corpus():
    return jsonify(load_corpus().to_dict(orient="records"))


@app.route("/api/stats", methods=["GET"])
def get_stats():
    df = load_corpus()
    total = len(df)

    if total == 0:
        return jsonify({
            "total": 0,
            "translated": 0,
            "missing": 0,
            "status_counts": {}
        })

    translated = len(
        df[df["sesotho_text"].astype(str).str.strip() != ""]
    )

    status_counts = (
        df["reviewer_status"]
        .astype(str)
        .value_counts()
        .to_dict()
    )

    return jsonify({
        "total": total,
        "translated": translated,
        "missing": total - translated,
        "status_counts": status_counts,
    })


@app.route("/api/corpus/<int:sentence_id>", methods=["PUT"])
def update_sentence(sentence_id):
    global corpus_df

    df = load_corpus()

    if df.empty:
        return jsonify({"error": "Corpus is empty"}), 404

    df["sentence_id"] = df["sentence_id"].astype(int)

    if sentence_id not in df["sentence_id"].values:
        return jsonify({"error": "Sentence not found"}), 404

    data = request.get_json() or {}

    idx = df.index[df["sentence_id"] == sentence_id][0]

    old_en = str(df.at[idx, "english_text"])
    old_st = str(df.at[idx, "sesotho_text"])

    for field in ("sesotho_text", "translator_code", "notes"):
        if field in data:
            df.at[idx, field] = data[field]

    if "reviewer_status" in data:
        if data["reviewer_status"] not in VALID_STATUSES:
            return jsonify({"error": "Invalid status"}), 400

        df.at[idx, "reviewer_status"] = data["reviewer_status"]

    save_corpus(df)
    corpus_df = df

    new_en = str(df.at[idx, "english_text"])
    new_st = str(df.at[idx, "sesotho_text"])

    if new_st != old_st:
        add_to_faiss_index(new_en, new_st, lang="en")

    if new_en != old_en:
        add_to_faiss_index(new_st, new_en, lang="st")

    return jsonify({
        "message": "Updated successfully",
        "sentence_id": sentence_id
    })


# ---------------------------------------------------------------------
# Root route
# ---------------------------------------------------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Sesotho Medical MT Backend — running",
        "model_ready": _model_ready.is_set(),
        "supported_language_pair": "English-Sesotho only"
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860, debug=True)
