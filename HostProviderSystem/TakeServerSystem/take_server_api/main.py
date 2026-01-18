from defs import *


# Пример использования
#if __name__ == "__main__":
    #success, message = configure_pfsense(mac="aa:bb:cc:dd:ee:ff", lan_ip="192.168.2.222", wan_ip="32.32.32.32")
  #  pm_configure_vm_network(106, "aa:aa:aa:aa:aa:bb", 99)
#print(f"Успешно: {success}, Сообщение: {message}")
# #
# if success:
#     print("all ok")
# else:
#     print("ululu chinise party fall down your social reyting")

app = Flask(__name__)
#CORS(app)

CORS(app, supports_credentials=True) 


@app.route('/create_machine', methods=['POST'])
def create_machine():
    data = request.get_json()

    cookie = request.cookies.get("session_id")
    #username = data.get("username")

    core = data.get("core")
    ram = data.get("ram")
    hdd = data.get("hdd")
    promo = data.get("promo")
    os = data.get("os")

    print(core, ram, hdd, promo, cookie, os)

    logined, username = check_user(cookie=cookie)
    
    if (not logined):
        response_data = {
            "status": "error",
            "message": "unlogin"
        }
        return jsonify(response_data), 401

    if (not core or not ram or not hdd or not promo or not cookie or not os):
        response_data = {
            "status": "error",
            "message": "not any confs: core, ram, hdd, promo, os"
        }
        return jsonify(response_data), 422

    discount = 0
    
    if (core <= mx_core and ram <= mx_ram and hdd <= mx_hdd 
            and core >= min_core and ram >= min_ram and hdd >= min_hdd):
        print("ok, user logined")
        if promo:
            discount = check_promo_discount(promo)
        
        if os not in OSS:
            response_data = {
                "status": "error",
                "message": "bad os"
            }
            return jsonify(response_data), 400

        price = core * pr_core + ram * pr_ram + hdd * pr_hdd
        price *= (100 - discount) / 100 
        price = price // 1
        
       
        balance = get_balance_db(username=username)
        if (price > balance):
            response_data = {
                "status": "error",
                "message": "small balance"
            }
            return jsonify(response_data), 402
        
        old_balance = balance
        buy =  set_balance(username=username, balance=balance - price)
        if (not buy):
            print("system error 1111-------------->>>>>")
            response_data = {
                "status": "error",
                "message": "server error"
            }
            return jsonify(response_data), 500
        
        server_id = get_server(os)
        if not server_id:
            print("error to get server with os " + os)
            set_balance(username=username, balance=old_balance)
            response_data = {
                "status": "error",
                "message": "not server now"
            }
            return jsonify(response_data), 501
        
        mac = generate_random_mac()

        edit_server(vm_id=server_id, core=core, ram=ram, hdd=hdd, promo=promo, username=username,mac=mac, name=str(server_id)+"-"+username)
        config_vm_proxmox(vm_id=server_id, ram=ram, cores=core, hdd=hdd-min_hdd, name=str(server_id)+"-"+username)
        start_vm_proxmox(vm_id=server_id)
        #pm_configure_vm_network(vmid=server_id, mac_address=mac)
        response_data = {
            "status": "created",
            "message": "Server started creating, server_id: " + str(server_id)
        }
        send_server_details(server_id)

    else:
        response_data = {
            "status": "error",
            "message": f"unlogin or more max parameters"
        }
        return jsonify(response_data), 400
    
    return jsonify(response_data), 201



@app.route('/get_balance', methods=['GET'])
def get_balance():
    #data = request.get_json()

    cookie = request.cookies.get("session_id")

    logined, username = check_user(cookie=cookie)
    
    if (not logined):
        response_data = {
            "status": "error",
            "message": "unlogin"
        }
        return jsonify(response_data), 401
    
    print(username)
    balance = get_balance_db(username=username)
    
    print(str(balance) + " user balance----------->>>>>>>>>")
    if balance != None:
        response_data = {
            "status": "good",
            "balance": balance,
            "message": "balance got"
        }
        return jsonify(response_data), 200
    
    response_data = {
        "status": "error",
        "message": "bad ballance"
    }
    return jsonify(response_data), 500

@app.route('/countries', methods=['GET'])
def get_countries():
    response_data = {
        "status": "good",
        "message": "countries",
        "countries": Countries
    }
    return jsonify(response_data), 200

@app.route('/osystems', methods=['GET'])
def get_oss():
    response_data = {
        "status": "good",
        "message": "params",
        "oss": list(OSS.keys())
    }
    return jsonify(response_data), 200

@app.route('/parametrs', methods=['GET'])
def get_parametrs():
    response_data = {
        "status": "good",
        "message": "oss",
        ########## PRICES
        "pr_ram":pr_ram,
        "pr_hdd":pr_hdd,
        "pr_core":pr_core,
        "pr_ip":pr_ip,
        ##########
        ########## MAXPARMETRS
        "mx_ram":mx_ram,
        "mx_core":mx_core,
        "mx_hdd":mx_hdd,
        ##########
        ########## MINPARAMETRS
        "min_ram":min_ram,
        "min_core":min_core,
        "min_hdd":min_hdd
        ##########
    }

    return jsonify(response_data), 200


@app.route('/calc_price', methods=['POST'])
def calc_price():
    data = request.get_json()

    # cookie = request.cookies.get("user_token")
    #username = data.get("username")

    # logined, username = check_user(cookie=cookie)
    
    # if (not logined):
    #     response_data = {
    #         "status": "error",
    #         "message": "unlogin"
    #     }
    #     return jsonify(response_data), 401

    core = data.get("core")
    ram = data.get("ram")
    hdd = data.get("ssd")

    response_data = {
        "status": "good",
        "message": "price",
        "price": core * pr_core + ram * pr_ram + hdd * pr_hdd
    }
    return jsonify(response_data), 200


@app.route('/user_services', methods=['GET'])
def user_services():

    cookie = request.cookies.get("session_id")
    
    logined, username = check_user(cookie=cookie)

    if (not logined):
        response_data = {
            "status": "error",
            "message": "Unrecognized"
        }
        return jsonify(response_data), 401

    services = get_services_by_username(username=username)

    print(services)
    if services:
        response_data = {
            "status": "good",
            "message": "services",
            "services": services
        }
        return jsonify(response_data), 200
    else:
        response_data = {
            "status": "error",
            "message": "NOT"
        }
        return jsonify(response_data), 404

@app.route('/get_mail', methods=['GET'])
def get_mail():
    cookie = request.cookies.get("session_id")
    
    mail = get_mail_by_cookie(cookie=cookie)

    if mail:
        response_data = {
            "status": "good",
            "message": "mail",
            "mail": mail
        }
        return jsonify(response_data), 200
    else:
        response_data = {
            "status": "error",
            "message": "Unrecognized"
        }
        return jsonify(response_data), 401




if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=7002)