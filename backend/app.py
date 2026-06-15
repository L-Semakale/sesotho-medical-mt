import os
import sqlite3
from datetime import datetime

import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from nllb_translator import nllb_translate


app = Flask(__name__)
CORS(app)

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")
os.makedirs(DATA_DIR, exist_ok=True)

CSV_FILE = os.path.join(DATA_DIR, "medical_corpus.csv")
DB_FILE  = os.path.join(DATA_DIR, "system.db")

COLUMNS = [
    "sentence_id", "domain_category", "english_text",
    "sesotho_text", "source", "source_reference",
    "translator_code", "reviewer_status", "notes"
]
VALID_STATUSES = {"raw", "translated", "reviewed", "verified", "rejected"}


#  Database helpers 

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

    # FIX 1: Moved usability_feedback table creation here from submit_feedback()
    # where it was unreachable dead code (placed after a return statement).
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

    # Seed admin — only once
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


#  Corpus helpers 

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


#  Auth routes 

@app.route("/api/register", methods=["POST"])
def register():
    data     = request.get_json() or {}
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
        return jsonify({"message": "Account created! You can now sign in."}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username already taken"}), 400
    finally:
        conn.close()


@app.route("/api/login", methods=["POST"])
def login():
    data     = request.get_json() or {}
    username = data.get("username", "").strip().lower()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = get_db()
    row  = conn.execute(
        "SELECT * FROM users WHERE username = ?", (username,)
    ).fetchone()
    conn.close()

    if row and check_password_hash(row["password_hash"], password):
        return jsonify({"username": row["username"], "role": row["role"]}), 200

    return jsonify({"error": "Invalid username or password"}), 401


#  Translation routes 

@app.route("/api/translate", methods=["POST"])
def translate_text():
    data      = request.get_json() or {}
    text      = data.get("text", "").strip()
    direction = data.get("direction", "en-st")
    username  = data.get("username", "anonymous")

    if not text:
        return jsonify({"error": "Text is required"}), 400

    if direction == "en-st":
        label = "English → Sesotho"
        src_col, tgt_col = "english_text", "sesotho_text"
        src_lang, tgt_lang = "english", "sesotho"
    elif direction == "st-en":
        label = "Sesotho → English"
        src_col, tgt_col = "sesotho_text", "english_text"
        src_lang, tgt_lang = "sesotho", "english"
    else:
        return jsonify({"error": "Invalid direction"}), 400

    # 1. Cache lookup — exact match against verified corpus (case-insensitive)
    match = corpus_df[corpus_df[src_col].str.lower() == text.lower()]
    if not match.empty:
        translated = match.iloc[0][tgt_col]
        model_used = "verified_corpus"
    else:
        # 2. Fall back to NLLB neural translation
        translated = nllb_translate(text, src=src_lang, tgt=tgt_lang)
        model_used = "nllb_model"

    conn = get_db()
    conn.execute(
        """INSERT INTO history
           (username, input_text, direction, direction_label, translated_text, model, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (username, text, direction, label, translated, model_used,
         datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    )
    conn.commit()
    conn.close()

    return jsonify({
        "input_text":     text,
        "direction":      direction,
        "direction_label": label,
        "translated_text": translated,
        "model":          model_used
    })


@app.route("/api/history", methods=["GET"])
def get_history():
    username = request.args.get("username", "")
    conn     = get_db()
    if username:
        rows = conn.execute(
            "SELECT * FROM history WHERE username = ? ORDER BY id DESC", (username,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM history ORDER BY id DESC"
        ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


#  Feedback routes 

@app.route("/api/feedback", methods=["POST"])
def submit_feedback():
    data     = request.get_json() or {}
    username = data.get("username", "anonymous")
    rating   = data.get("rating", "5")
    comment  = data.get("comment", "").strip()

    # FIX 2: Validate rating is a number in range 1–10 before inserting.
    # Previously any value was accepted with no validation.
    try:
        rating_int = int(rating)
        if not (1 <= rating_int <= 10):
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Rating must be an integer between 1 and 10"}), 400

    conn = get_db()
    conn.execute(
        "INSERT INTO feedback (username, rating, comment, created_at) VALUES (?, ?, ?, ?)",
        (username, str(rating_int), comment, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Feedback submitted. Thank you!"})


@app.route("/api/feedback", methods=["GET"])
def get_feedback():
    conn = get_db()
    rows = conn.execute("SELECT * FROM feedback ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


#  Corpus routes 

@app.route("/api/corpus", methods=["GET"])
def get_corpus():
    return jsonify(load_corpus().to_dict(orient="records"))


@app.route("/api/stats", methods=["GET"])
def get_stats():
    df    = load_corpus()
    total = len(df)
    if total == 0:
        return jsonify({"total": 0, "translated": 0, "missing": 0, "status_counts": {}})
    translated    = len(df[df["sesotho_text"].astype(str).str.strip() != ""])
    status_counts = df["reviewer_status"].astype(str).value_counts().to_dict()
    return jsonify({
        "total":         total,
        "translated":    translated,
        "missing":       total - translated,
        "status_counts": status_counts
    })


@app.route("/api/corpus/<int:sentence_id>", methods=["PUT"])
def update_sentence(sentence_id):
    global corpus_df  # FIX 3: Declare global so the in-memory cache stays in sync after edits.

    df = load_corpus()
    if df.empty:
        return jsonify({"error": "Corpus is empty"}), 404

    df["sentence_id"] = df["sentence_id"].astype(int)
    if sentence_id not in df["sentence_id"].values:
        return jsonify({"error": "Sentence not found"}), 404

    data = request.get_json() or {}
    idx  = df.index[df["sentence_id"] == sentence_id][0]

    for field in ("sesotho_text", "translator_code", "notes"):
        if field in data:
            df.at[idx, field] = data[field]

    if "reviewer_status" in data:
        if data["reviewer_status"] not in VALID_STATUSES:
            return jsonify({"error": "Invalid status"}), 400
        df.at[idx, "reviewer_status"] = data["reviewer_status"]

    save_corpus(df)
    corpus_df = df  # FIX 3: Keep in-memory cache in sync so translate hits updated data.
    return jsonify({"message": "Updated successfully", "sentence_id": sentence_id})


#  Root 

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Sesotho Medical MT Backend — running"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)