import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

DB = "data/system.db"

conn = sqlite3.connect(DB)

conn.execute("DELETE FROM users WHERE username = 'admin'")
conn.execute(
    "INSERT INTO users (username, password_hash, role) VALUES ('admin', ?, 'admin')",
    (generate_password_hash("Admin@MT2025"),)
)
conn.commit()

# Verify immediately
row = conn.execute("SELECT * FROM users WHERE username = 'admin'").fetchone()
print("Row:         ", row[0], row[1], row[3])
print("Password OK: ", check_password_hash(row[2], "Admin@MT2025"))

conn.close()
