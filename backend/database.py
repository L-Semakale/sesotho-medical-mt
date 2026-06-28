import sqlite3

def init_db():
    conn = sqlite3.connect("translations.db")
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS translation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_text   TEXT NOT NULL,
            translated    TEXT NOT NULL,
            direction     TEXT NOT NULL,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS translation_cache (
            source_text TEXT,
            direction   TEXT,
            translated  TEXT,
            PRIMARY KEY (source_text, direction)
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS usability_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sus_score INTEGER,
            comment   TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()