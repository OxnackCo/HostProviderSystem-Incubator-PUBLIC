
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

host = ''  
database = ''
user = ''
password = ''

app = Flask(__name__)
CORS(app, supports_credentials=True) 

def connect_to_db():   # coonect to db
    conn = psycopg2.connect(
        host=host,
        database=database,
        user=user,
        password=password
    )
    return conn

def select_enabled_services():  
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM services WHERE enabled = %s", (True,))
        row = cursor.fetchall()
        return row
    conn.close()

@app.route('/services', methods=['GET'])  
def services():      
    try:
        services = select_enabled_services()
        return jsonify(services)
    except:
        return jsonify({'error': 'err'}), 500

app.run(host='0.0.0.0', port=7001)