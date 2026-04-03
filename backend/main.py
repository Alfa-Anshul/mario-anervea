from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import sqlite3, hashlib, secrets, time, os, json
from datetime import datetime

app = FastAPI(title="Mario Anervea API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "/app/data/mario.db"
security = HTTPBearer()

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            avatar TEXT DEFAULT 'mario',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            games_played INTEGER DEFAULT 0,
            best_score INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at REAL NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            coins INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            enemies_killed INTEGER DEFAULT 0,
            time_taken INTEGER DEFAULT 0,
            result TEXT DEFAULT 'gameover',
            played_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    """)
    conn.commit()
    conn.close()

init_db()

def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    conn = get_db()
    session = conn.execute(
        "SELECT * FROM sessions WHERE token=?", (creds.credentials,)
    ).fetchone()
    if not session or time.time() - session["created_at"] > 86400 * 7:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = conn.execute("SELECT * FROM users WHERE id=?", (session["user_id"],)).fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return dict(user)

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    avatar: Optional[str] = "mario"

class LoginRequest(BaseModel):
    username: str
    password: str

class ScoreRequest(BaseModel):
    score: int
    coins: int = 0
    level: int = 1
    enemies_killed: int = 0
    time_taken: int = 0
    result: str = "gameover"

@app.post("/api/register")
def register(req: RegisterRequest):
    if len(req.username) < 3:
        raise HTTPException(400, "Username must be at least 3 characters")
    if len(req.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users(username,email,password_hash,avatar) VALUES(?,?,?,?)",
            (req.username.strip(), req.email.strip().lower(), hash_password(req.password), req.avatar)
        )
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE username=?", (req.username,)).fetchone()
        token = secrets.token_hex(32)
        conn.execute("INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)",
                     (token, user["id"], time.time()))
        conn.commit()
        conn.close()
        return {"token": token, "user": {
            "id": user["id"], "username": user["username"],
            "email": user["email"], "avatar": user["avatar"],
            "best_score": 0, "games_played": 0
        }}
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(400, "Username or email already taken")

@app.post("/api/login")
def login(req: LoginRequest):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE username=? AND password_hash=?",
        (req.username.strip(), hash_password(req.password))
    ).fetchone()
    if not user:
        conn.close()
        raise HTTPException(401, "Invalid username or password")
    token = secrets.token_hex(32)
    conn.execute("INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)",
                 (token, user["id"], time.time()))
    conn.commit()
    conn.close()
    return {"token": token, "user": {
        "id": user["id"], "username": user["username"],
        "email": user["email"], "avatar": user["avatar"],
        "best_score": user["best_score"], "games_played": user["games_played"]
    }}

@app.post("/api/logout")
def logout(creds: HTTPAuthorizationCredentials = Depends(security)):
    conn = get_db()
    conn.execute("DELETE FROM sessions WHERE token=?", (creds.credentials,))
    conn.commit()
    conn.close()
    return {"ok": True}

@app.get("/api/me")
def me(user=Depends(get_current_user)):
    return {k: user[k] for k in ["id","username","email","avatar","best_score","games_played"]}

@app.post("/api/scores")
def post_score(req: ScoreRequest, user=Depends(get_current_user)):
    conn = get_db()
    conn.execute(
        "INSERT INTO scores(user_id,score,coins,level,enemies_killed,time_taken,result) VALUES(?,?,?,?,?,?,?)",
        (user["id"], req.score, req.coins, req.level, req.enemies_killed, req.time_taken, req.result)
    )
    conn.execute("UPDATE users SET games_played=games_played+1 WHERE id=?", (user["id"],))
    if req.score > user["best_score"]:
        conn.execute("UPDATE users SET best_score=? WHERE id=?", (req.score, user["id"]))
    conn.commit()
    conn.close()
    return {"ok": True}

@app.get("/api/leaderboard")
def leaderboard():
    conn = get_db()
    rows = conn.execute("""
        SELECT u.username, u.avatar, u.best_score, u.games_played,
               COUNT(s.id) as total_games,
               MAX(s.score) as top_score,
               SUM(s.coins) as total_coins,
               SUM(s.enemies_killed) as total_kills
        FROM users u
        LEFT JOIN scores s ON s.user_id = u.id
        GROUP BY u.id
        ORDER BY u.best_score DESC
        LIMIT 20
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/scores/me")
def my_scores(user=Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM scores WHERE user_id=? ORDER BY played_at DESC LIMIT 10",
        (user["id"],)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/health")
def health():
    return {"status": "ok"}
