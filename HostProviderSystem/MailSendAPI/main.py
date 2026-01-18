import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr
from flask import Flask, request, jsonify
import json
from config import *

app = Flask(__name__)
      


@app.route('/send_mail', methods=['POST'])
def send_mail():
    data = request.get_json()

    to_mail = data.get("to_email")
    email_subject = data.get("email_subject")
    email_body = data.get("email_body")
    api_passwd = data.get("api_passwd")

    if not all([to_mail, email_subject, email_body, api_passwd]):
        return jsonify({"status": "err_missing_fields"}), 400

    if (api_passwd == API_PASSWD):
        status = send_and_save(to_mail, email_subject, email_body)

        if status == "sended":
            response_data = {
                "status": status
            }
            return jsonify(response_data), 200
        else:
            response_data = {
                "status": status
            }
            return jsonify(response_data), 500
    else:
        response_data = {
            "status": "err Unrecognized"
        }
        return jsonify(response_data), 401


def send_and_save(recipient_email, subject, body, sender_email = EMAIL, sender_password = MAIL_PASSWD):
    smtp_server = SMTP_ADDR
    smtp_port = SMTP_PORT
    
    msg = MIMEText(body, 'plain', 'utf-8')
    msg['Subject'] = subject
    msg['From'] = formataddr(("Oxnack", sender_email))
    msg['To'] = recipient_email

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            
            server.sendmail(sender_email, [recipient_email], msg.as_string())
            
            msg['To'] = sender_email
            msg['Subject'] = f"[COPY] (sended to: {recipient_email}) {subject}"
            server.sendmail(sender_email, [sender_email], msg.as_string())
            
        print("sended to "+ recipient_email)
        return "sended"
    
    except Exception as e:
        print(f"ERR: {e}")
        return "error"



if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=7003)