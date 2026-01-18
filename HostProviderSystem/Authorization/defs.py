import psycopg2
import threading
from psycopg2.extras import RealDictCursor
import re
import random
import hashlib
import string
from flask import Flask, request, jsonify, make_response
import asyncio
from multiprocessing import Manager
from functools import partial
from flask_cors import CORS
import requests

from config import *


def validate_email(email):
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return re.match(pattern, email) is not None

def validate_password(password):
    if '"' in password or "'" in password:
        return False
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    return True

def conn_to_db():
    conn = psycopg2.connect(
        host=host,
        database=database,
        user=user,
        password=password
    )
    return conn

def hash_text(text):
    sha256 = hashlib.sha256()
    sha256.update(text.encode('utf-8'))
    return sha256.hexdigest()

def add_user(username, password_hash, email):
    conn = conn_to_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM users WHERE mail = %s;", (email,))
            q = cursor.fetchone()
            if q:
                return False
            cursor.execute(
                "INSERT INTO users (username, passwd_hash, mail, is_verified) VALUES (%s, %s, %s, %s);",
                (str(username), password_hash, email, "FALSE")
            )
            conn.commit()
            return True
    finally:
        conn.close()

def set_username(email):
    conn = conn_to_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE mail = %s", (email,))
            result = cursor.fetchone()
            if result:
                user_id = result[0]
                cursor.execute(
                    "UPDATE users SET username = %s WHERE mail = %s;",
                    (hex(user_id)[2:], email)
                )
                conn.commit()
    finally:
        conn.close()

def get_user_by_email(email):
    conn = conn_to_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, mail, passwd_hash, is_verified FROM users WHERE mail = %s", (email,))
            return cursor.fetchone()
    finally:
        conn.close()

def mark_user_as_verified(email):
    conn = conn_to_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE users SET is_verified = TRUE WHERE mail = %s", (email,))
            conn.commit()
    finally:
        conn.close()

def verify_password(stored_hash, password):
    return stored_hash == hash_text(password)

def create_session(user_id):
    session_id = ''.join(random.choices(string.ascii_letters + string.digits, k=256))
    conn = conn_to_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE users SET cookie = %s WHERE id = %s",
                (session_id, user_id)
            )
            conn.commit()
    finally:
        conn.close()
    return session_id

def send_email_via_api(to_email, subject, body):
    try:
        payload = {
            "to_email": to_email,
            "email_subject": subject,
            "email_body": body,
            "api_passwd": API_PASSWD
        }
        response = requests.post(MAIL_API_URL, json=payload)
        return response.status_code == 200
    except Exception as e:
        print(f"API email sending error: {e}")
        return False

