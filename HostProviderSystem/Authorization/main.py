from defs import *
from config import *

app = Flask(__name__)
CORS(app, supports_credentials=True)

manager = Manager()
code_cache = manager.dict()


def create_registration_code(email):
    code = random.randint(100000, 999999)
    code_cache[email] = code

    subject = "Код подтверждения регистрации Oxnack"
    body = f"""
Ваш код подтверждения для регистрации: {code}

Введите данный код в форме регистрации для завершения процесса.

Код действителен в течение 10 минут.

С уважением,
команда сервиса Oxnack.
"""
    
    send_email_via_api(email, subject, body)
    
    threading.Thread(
        target=partial(_run_async, del_code_scheduled(email)),
        daemon=True
    ).start()
    
    return code

async def del_code_scheduled(email):
    await asyncio.sleep(CODE_EXPIRE_MINUTES * 60)
    if email in code_cache:
        del code_cache[email]

def _run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(coro)
    loop.close()

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get('mail')
    password = data.get('passwd')

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    if not validate_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    if not validate_password(password):
        return jsonify({"error": "Password too weak"}), 400

    password_hash = hash_text(password)
    uniq = add_user(password_hash[5:10], password_hash, email)
    
    if not uniq:
        return jsonify({"error": "User already exists"}), 409
    
    set_username(email)
    code = create_registration_code(email)
    return jsonify({"message": "Confirmation code sent to email"})

@app.route('/register/code', methods=['POST'])
def verify_code():
    data = request.json
    email = data.get('mail')
    code = data.get('code')

    if not email or not code:
        return jsonify({"error": "Email and code required"}), 400
    
    if not code.isdigit():
        return jsonify({"error": "Code must be numeric"}), 400
    
    if email not in code_cache:
        return jsonify({"error": "Code not found or expired"}), 404
    
    if code_cache[email] == int(code):
        mark_user_as_verified(email)
        del code_cache[email]
        return jsonify({"message": "Email confirmed"})

    return jsonify({"error": "Invalid code"}), 422

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get('mail')
    password = data.get('passwd')

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    if not validate_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    user = get_user_by_email(email)
    if not user:
        return jsonify({"error": "User not found"}), 401
    
    user_id, user_email, password_hash, is_verified = user
    
    if not is_verified:
        return jsonify({"error": "Email not verified"}), 403

    if not verify_password(password_hash, password):
        return jsonify({"error": "Invalid password"}), 401

    session_id = create_session(user_id)

    response = make_response(jsonify({"message": "Authentication successful"}))
    response.set_cookie(
        'session_id',
        session_id,
        httponly=True,
        secure=True,
        samesite='Strict',
        max_age=86400 * SESSION_EXPIRE_DAYS
    )
    return response

@app.route('/register', methods=['OPTIONS'])
@app.route('/register/code', methods=['OPTIONS'])
@app.route('/login', methods=['OPTIONS'])
def options_handler():
    return '', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7004)