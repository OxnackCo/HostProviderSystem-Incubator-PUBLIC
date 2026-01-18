from helpers import *
from config import *


def connect_to_db():   # coonect to db
    conn = psycopg2.connect(
        host=host,
        database=database,
        user=user,
        password=password
    )
    return conn

def find_user_cookie(cookie):   # FIND user by cookie USERS
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM users WHERE cookie = %s", (cookie,))
        row = cursor.fetchone()
        return row
    conn.close()


def add_transaction(username, type, amount, date, discript, transaction_id, status=None):   # ADD transaction
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute("INSERT INTO transactions (username, type, amount, date, discription, status, transaction_id) VALUES (%s, %s, %s, %s, %s, %s, %s);", (username, type, amount, date, discript, status, transaction_id))  
        conn.commit()
        print("new trensaction with id: " + str(username) + "with disc: " + discript)
    conn.close()

def transaction_status_update(transaction_id, status):   # Edit dates users
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute("UPDATE transactions SET status = %s WHERE transaction_id = %s;", (status, transaction_id))  
        conn.commit()
        print("update transac status tr_id: " + str(transaction_id))
    conn.close()




def select_all_users():   # SELECT ALL USERS
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM users;")
        rows = cursor.fetchall()  # Получаем ВСЕ записи
        return rows  #RealDictRow)
    conn.close()

def select_all_tg_id():   # SELECT ALL tg_id
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT tg_id FROM users;")
        rows = cursor.fetchall()  
        return rows  # RealDictRow)
    conn.close()

def select_date_stop_users(tg_id):   # SELECT date_stop
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(f"SELECT date_stop WHERE tg_id={str(tg_id)};")
        row = cursor.fetchone()
        return row["date_stop"]
    conn.close()

def add_user(tg_id, username):   # ADD user
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute("INSERT INTO users (tg_id, tg_username, balance, use) VALUES (%s, %s, %s, %s);", (tg_id, username, 0, False))  
        conn.commit()
        print("new user with id: " + str(tg_id))
    conn.close()


def transaction_status_update(discription, status):   # Edit dates users
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute("UPDATE transactions SET status = %s WHERE discription = %s;", (status, discription))  
        conn.commit()
        print("update transac status discription: " + str(discription))
    conn.close()

def date_update(date_start, date_stop, tg_id):   # Edit dates users
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute(f"UPDATE users SET date_start = '{date_start}', date_stop = '{date_stop}' WHERE tg_id = {str(tg_id)};")  
        conn.commit()

        print("date update for user: " + str(tg_id))
    conn.close()

def user_balance_update(balance, tg_id):   # Edit user balance
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute("UPDATE users SET balance = %s WHERE tg_id = %s;", (balance, tg_id))  
        conn.commit()

        print("balance update for user: " + str(tg_id))
    conn.close()

def user_sub_update(tg_id, sub : bool):   # Edit user balance
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute("UPDATE users SET sub = %s WHERE tg_id = %s;", (sub, tg_id))  
        conn.commit()
        print("sub update for user: " + str(tg_id))
    conn.close()

def user_add_balance(tg_id, add_balance : int): # add balance to user 
    user = find_user(tg_id)
    user_balance_update(user["balance"] + add_balance, tg_id)

def reff_balance_user_add(tg_id, add_balance : int): # add balance to user who give deeplink
    user = find_user(tg_id)
    if user["ref_id"]:
        user_add_balance(user["ref_id"], int(add_balance * REF_SHARE))

def user_use_update(use, tg_id):   # Edit user use True/False
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute("UPDATE users SET use = %s WHERE tg_id = %s;", (use, tg_id, ))  
        conn.commit()

        print("use update for user: " + str(tg_id))
    conn.close()


def expires_at_update(expires_at, tg_id):   # Edit expires_at users
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute("UPDATE users SET expires_at = %s WHERE tg_id = %s;", (expires_at, str(tg_id), ))  
        conn.commit()
        print("expires_at update for user: " + str(tg_id))
    conn.close()

def token_update(token, tg_id):   # Edit token users
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute(f"UPDATE users SET token = '{token}' WHERE tg_id = {str(tg_id)};")  
        conn.commit()
        print("token update for user: " + str(tg_id))
    conn.close()


def username_update(username, tg_id):   # Edit username users
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute(f"UPDATE users SET tg_username = '{username}' WHERE tg_id = {str(tg_id)};")  
        conn.commit()
        print("username update for user: " + str(tg_id))
    conn.close()

def ref_id_update(id, tg_id):   # Edit ref_id users
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute(f"UPDATE users SET ref_id = {str(id)} WHERE tg_id = {tg_id};")
        conn.commit()
        print("ref_id update for user: " + str(tg_id))
    conn.close()

