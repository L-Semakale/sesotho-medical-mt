import sqlite3

conn = sqlite3.connect("C:/sesotho-medical-mt/backend/data/system.db")
c = conn.cursor()

c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = c.fetchall()

print("Tables found in system.db:")
for t in tables:
    print(f"  → {t[0]}")

conn.close()
