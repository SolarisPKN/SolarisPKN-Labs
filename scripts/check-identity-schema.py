"""Validate D1 migration using stdlib SQLite; no production data or secrets."""
import sqlite3
from pathlib import Path

schema = Path("migrations/0001_identity.sql").read_text(encoding="utf-8")
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript(schema)
tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
required = {"users","identities","oauth_flows","sessions","rate_buckets","favorites","follows","preferences","comments"}
assert required.issubset(tables), sorted(required - tables)
assert db.execute("PRAGMA foreign_keys").fetchone()[0] == 1
db.execute("INSERT INTO users(id,created_at) VALUES(?,?)", ("unit-user",1))
db.execute("INSERT INTO identities(provider,subject_digest,user_id,created_at) VALUES(?,?,?,?)", ("google","opaque-hmac-digest","unit-user",1))
db.execute("INSERT INTO sessions(token_digest,user_id,created_at,expires_at) VALUES(?,?,?,?)", ("sha256-token-digest","unit-user",1,2))
db.execute("INSERT INTO favorites(user_id,project,created_at) VALUES(?,?,?)", ("unit-user","SolarisPKN-Labs",1))
db.execute("INSERT INTO follows(user_id,project,created_at) VALUES(?,?,?)", ("unit-user","SolarisPKN-Stats",1))
db.execute("INSERT INTO comments(id,user_id,post_slug,body,status,created_at) VALUES(?,?,?,?,?,?)", ("unit-comment","unit-user","fake-post","sample","pending",1))
assert db.execute("SELECT COUNT(*) FROM comments WHERE status='approved'").fetchone()[0] == 0
try:
    db.execute("INSERT INTO comments(id,user_id,post_slug,body,status,created_at) VALUES(?,?,?,?,?,?)", ("invalid-status","unit-user","fake-post","sample","public",1))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Comment status CHECK constraint not enforced")
db.execute("DELETE FROM users WHERE id=?", ("unit-user",))
for child in ("identities","sessions","favorites","follows","comments"):
    assert db.execute("SELECT COUNT(*) FROM " + child).fetchone()[0] == 0, child
print("PASS: private identity schema, moderation constraint and deletion cascades")
