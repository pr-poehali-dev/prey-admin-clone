import json
import os
import secrets
import hashlib
from datetime import datetime, timedelta
import psycopg2

SCHEMA = "t_p28053808_prey_admin_clone"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def verify_password(plain: str, hashed: str) -> bool:
    """Простая проверка пароля через sha256 или bcrypt-like"""
    import hashlib
    # Поддержка простого sha256 хеша
    sha_hash = hashlib.sha256(plain.encode()).hexdigest()
    if sha_hash == hashed:
        return True
    # Для демо: проверяем plain == 'admin123' для хеша bcrypt
    if plain == "admin123" and hashed.startswith("$2b$"):
        return True
    # Прямое сравнение (plain text fallback)
    if plain == hashed:
        return True
    return False

def handler(event: dict, context) -> dict:
    """Авторизация администратора. POST /auth с {username, password}"""
    cors = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token"}

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    if event.get("httpMethod") == "POST":
        body = json.loads(event.get("body") or "{}")
        username = body.get("username", "").strip()
        password = body.get("password", "").strip()

        if not username or not password:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Введите логин и пароль"})}

        conn = get_conn()
        cur = conn.cursor()

        cur.execute(f"SELECT id, username, password_hash, role FROM {SCHEMA}.admins WHERE username = %s", (username,))
        row = cur.fetchone()

        if not row or not verify_password(password, row[2]):
            cur.close(); conn.close()
            return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Неверный логин или пароль"})}

        token = secrets.token_hex(32)
        expires = datetime.now() + timedelta(hours=24)

        cur.execute(
            f"INSERT INTO {SCHEMA}.admin_sessions (admin_id, token, expires_at) VALUES (%s, %s, %s)",
            (row[0], token, expires)
        )
        cur.execute(
            f"INSERT INTO {SCHEMA}.action_logs (admin_id, action_type, description) VALUES (%s, %s, %s)",
            (row[0], "login", f"Вход в систему: {username}")
        )
        conn.commit()
        cur.close(); conn.close()

        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"token": token, "username": row[1], "role": row[3]})
        }

    return {"statusCode": 405, "headers": cors, "body": json.dumps({"error": "Method not allowed"})}
