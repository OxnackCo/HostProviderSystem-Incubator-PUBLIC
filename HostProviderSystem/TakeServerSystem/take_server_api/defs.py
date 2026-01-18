from config import *
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import requests
from requests.auth import HTTPBasicAuth
import random
import time
from urllib3.exceptions import InsecureRequestWarning
import random
from datetime import datetime, timedelta
import string
import asyncio
from flask import Flask, request, jsonify
import urllib3
import urllib.parse
from flask_cors import CORS, cross_origin

def send_server_details(id):
    details, mail = get_server_details(id)
    
    formatted_details = f"""
Order creation completed! id: {id}

You can now proceed with its configuration. What to do next with the server can be found in our knowledge base section. If you need help, please write us a ticket in your personal account.

Server parameters:
Processor (cores): {details.get('cores', 'N/A')} pcs.
RAM: {details.get('ram', 'N/A')} GB
Disk space: {details.get('hdd', 'N/A')} GB
Operating system: {details.get('os', 'N/A')}
IP v4: {details.get('ips', 'N/A')[0]}

Access credentials:
SSH:     ssh root@{details.get('ips', 'N/A')[0]}
Password: {details.get('passwd', 'N/A')}

Best regards, Oxnack service team.
"""
    
    send_email_via_api(mail, f"Your server details id: {str(id)}", formatted_details)

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

def generate_random_mac():
    mac_bytes = [0x52, 0x54, 0x00]
    mac_bytes.extend(random.randint(0x00, 0xff) for _ in range(3))
    mac_address = ":".join(f"{byte:02x}" for byte in mac_bytes)
    return mac_address.upper()

def generate_password():
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    
    while True:
        password = ''.join(random.choice(characters) for _ in range(10))
        
        has_digit = any(char.isdigit() for char in password)
        has_special = any(char in "!@#$%^&*" for char in password)
        
        if has_digit and has_special:
            return password

def get_current_date():
    today = datetime.now()
    return today.strftime("%d.%m.%Y")

def compare_dates(now_date, cur_date):
    date_now = datetime.strptime(now_date, "%d.%m.%Y")
    date_cur = datetime.strptime(cur_date, "%d.%m.%Y")
    if date_now > date_cur:
        return False
    return True

def get_date_in_n_days(date, n):
    date_in_7_days = datetime.strptime(date, "%d.%m.%Y") + timedelta(days=n)
    return date_in_7_days.strftime("%d.%m.%Y")


#################################### DB
def connect_to_db():
    conn = psycopg2.connect(
        host=db_host,
        database=db_database,
        user=db_user,
        password=db_password
    )
    return conn

def find_user(username):
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        row = cursor.fetchone()
        return row
    conn.close()

def select_all_users():
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM users;")
        rows = cursor.fetchall()
        return rows
    conn.close()

def select_date_stop_users(tg_id):
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(f"SELECT date_stop WHERE tg_id={str(tg_id)};")
        row = cursor.fetchone()
        return row["date_stop"]
    conn.close()

def add_user(tg_id):
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute("INSERT INTO users (tg_id) VALUES (%s);", (tg_id,))  
        conn.commit()
        print("new user with id: " + str(tg_id))
    conn.close()

def add_transaction(tg_id, type, amount, date):
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute("INSERT INTO transactions (tg_id, type, amount, date) VALUES (%s, %s, %s, %s);", (tg_id, type, amount, date))  
        conn.commit()
        print("new trensaction with id: " + str(tg_id))
    conn.close()

def date_update(date_start, date_stop, tg_id):
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute(f"UPDATE users SET date_start = '{date_start}', date_stop = '{date_stop}' WHERE tg_id = {str(tg_id)};")  
        conn.commit()
        print("date update for user: " + str(tg_id))
    conn.close()

def token_update(token, tg_id):
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute(f"UPDATE users SET token = '{token}' WHERE tg_id = {str(tg_id)};")  
        conn.commit()
        print("token update for user: " + str(tg_id))
    conn.close()

def username_update(username, tg_id):
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute(f"UPDATE users SET name = '{username}' WHERE tg_id = {str(tg_id)};")  
        conn.commit()
        print("username update for user: " + str(tg_id))
    conn.close()

def check_user(cookie):
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT id, username FROM users WHERE cookie = %s;", (cookie,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return True, row["username"]
        else:
            return False, "NOT"

def get_balance_db(username):
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT balance FROM users WHERE username = %s;", (username,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return row["balance"]
        else:
            return False
        
def get_server_details(id):
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM servers WHERE id = %s;", (id,))
        row = cursor.fetchone()
        details = dict(row)
        conn.close()
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM users WHERE username = %s;", (details["username"],))
        row = cursor.fetchone()
        mail = row["mail"]
        conn.close()
    if all(details):
        return details, mail
    else:
        return False

def set_balance(username, balance):
    try:
        conn = connect_to_db()
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("UPDATE users SET balance = %s WHERE username = %s", (balance, username))
            conn.commit()
            conn.close()
        print(f"set new balance to user {username} balance: {balance}")
    except:
        print(f"err to set balance to user: {username} balance: {balance}")
        return False
    return True

def check_promo_discount(promo):
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT discount FROM promocodes WHERE promo = %s;", (promo,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return row["discount"]
        else:
            return 0
    
def get_mail_by_cookie(cookie):
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT mail FROM users WHERE cookie = %s;", (cookie,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return row["mail"]
        else:
            return False

def get_services_by_username(username):
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT id, ram, cores, hdd, ips, os, status FROM servers WHERE username = %s;", (username,))
        rows = cursor.fetchall()
        conn.close()
        if rows:
            return rows
        else:
            return False

def add_server(core, ram, hdd, promo, username):
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("INSERT INTO servers (cores, ram, hdd, discription, username) VALUES (%s, %s, %s, %s, %s) RETURNING id;", (core, ram, hdd, "promocode: " + str(promo), username,))  
        row = cursor.fetchone()
        conn.commit()
        conn.close()
        if row:
            print("new server in base" + str(row["id"]))
            return row["id"]
        else:
            print("error to add server in base")
            return False
        
def edit_server(vm_id, core, ram, hdd, promo, username, mac, name):
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("UPDATE servers SET cores = %s, ram = %s, hdd = %s, discription = %s, username = %s, mac = %s, name = %s WHERE id = %s;", (core, ram, hdd, "promocode: " + str(promo), username, mac, name, vm_id,))  
        conn.commit()
        conn.close()

def get_server(os): # find not busy server and change
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("""UPDATE servers 
            SET busy = true 
            WHERE id = (
                SELECT id 
                FROM servers 
                WHERE busy = false AND os = %s
                ORDER BY id 
                FOR UPDATE SKIP LOCKED 
                LIMIT 1
            ) RETURNING id;""", (os,))  
        row = cursor.fetchone()
        conn.commit()
        conn.close()
        if row:
            print("new server busy in base " + str(row["id"]))
            return row["id"]
        else:
            print("error to busy server in base")
            return False

def change_server_status(id, status): # stat - "on" "off"
    conn = connect_to_db()
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("UPDATE servers SET status = %s WHERE id = %s;", (status, id,))  
        conn.commit()
        conn.close()
##########################################

requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

def config_vm_proxmox(
    vm_id,
    ram,
    cores,
    hdd,
    name,
    proxmox_host=pm_host,
    proxmox_port=pm_port,
    username=pm_user,
    password=pm_passwd,
    realm=pm_realm,
    target_node=pm_node,
    timeout=30
):
    base_url = f"https://{proxmox_host}:{proxmox_port}/api2/json"
    
    try:
        auth_url = f"{base_url}/access/ticket"
        auth_data = {
            "username": username,
            "password": password,
            "realm": realm
        }
        
        response = requests.post(
            auth_url,
            data=auth_data,
            verify=False,
            timeout=timeout
        )
        response.raise_for_status()
        
        ticket = response.json()['data']['ticket']
        csrf_token = response.json()['data']['CSRFPreventionToken']
        
        headers = {
            "CSRFPreventionToken": csrf_token,
            "Cookie": f"PVEAuthCookie={ticket}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        config_params = {
            "cores": str(cores),
            "memory": str(ram * 1024),
            "name": name
        }
        
        config_url = f"{base_url}/nodes/{target_node}/qemu/{vm_id}/config"
        
        print(f"Updating VM configuration {vm_id}: {config_params}")
        
        response = requests.put(
            config_url,
            data=config_params,
            headers=headers,
            verify=False,
            timeout=timeout
        )
        
        if response.status_code == 200:
            print(f"✅ VM {vm_id} configuration updated successfully")
            
            if hdd > 0:
                success = extend_vm_disk(vm_id, hdd, headers, base_url, target_node, timeout)
                return success
            return True
        else:
            print(f"❌ Configuration update error: {response.status_code}")
            print(f"   Server response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception during configuration update: {str(e)}")
        return False

def extend_vm_disk(vm_id, hdd_gb, headers, base_url, target_node, timeout):
    try:
        config_url = f"{base_url}/nodes/{target_node}/qemu/{vm_id}/config"
        response = requests.get(config_url, headers=headers, verify=False, timeout=timeout)
        
        if response.status_code != 200:
            print(f"❌ Error getting VM configuration: {response.text}")
            return False
        
        current_config = response.json()['data']
        
        disk_device = None
        for key, value in current_config.items():
            if key.startswith(('scsi', 'virtio', 'ide', 'sata')) and 'disk' in value:
                disk_device = key
                break
        
        if not disk_device:
            print("❌ No disk found for expansion")
            return False
        
        resize_url = f"{base_url}/nodes/{target_node}/qemu/{vm_id}/resize"
        resize_params = {
            "disk": disk_device,
            "size": f"+{hdd_gb}G"
        }
        
        response = requests.put(
            resize_url,
            data=resize_params,
            headers=headers,
            verify=False,
            timeout=timeout
        )
        
        if response.status_code == 200:
            print(f"✅ VM {vm_id} disk successfully expanded by {hdd_gb}GB")
            return True
        else:
            print(f"❌ Disk expansion error: {response.status_code}")
            print(f"   Server response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception during disk expansion: {str(e)}")
        return False

def clone_vm_proxmox(
    source_vmid,
    new_vmid,
    new_name,
    proxmox_host=pm_host,
    proxmox_port=pm_port,
    username=pm_user,
    password=pm_passwd,
    realm=pm_realm,
    target_node=pm_node,
    storage=pm_storage,
    timeout=30
):
    base_url = f"https://{proxmox_host}:{proxmox_port}/api2/json"
    
    try:
        auth_url = f"{base_url}/access/ticket"
        auth_data = {
            "username": username,
            "password": password,
            "realm": realm
        }
        
        response = requests.post(
            auth_url,
            data=auth_data,
            verify=False,
            timeout=timeout
        )
        response.raise_for_status()
        
        ticket = response.json()['data']['ticket']
        csrf_token = response.json()['data']['CSRFPreventionToken']
        
        headers = {
            "CSRFPreventionToken": csrf_token,
            "Cookie": f"PVEAuthCookie={ticket}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        clone_url = f"{base_url}/nodes/{target_node}/qemu/{source_vmid}/clone"
        clone_params = {
            "newid": str(new_vmid),
            "name": new_name,
            "storage": storage,
            "target": target_node,
            "full": "1"  
        }
        
        clone_params = {k: v for k, v in clone_params.items() if v is not None}
        
        print(f"Cloning parameters: {clone_params}")
        
        response = requests.post(
            clone_url,
            data=clone_params,
            headers=headers,
            verify=False,
            timeout=timeout
        )
        
        if response.status_code != 200:
            print(f"Error {response.status_code}: {response.text}")
            return False
            
        task_id = response.json()['data']
        print(f"Cloning task created. ID: {task_id}")
        return True
        
        task_url = f"{base_url}/nodes/{target_node}/tasks/{task_id}/status"
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            task_response = requests.get(
                task_url,
                headers=headers,
                verify=False,
                timeout=timeout
            )
            
            if task_response.status_code == 200:
                task_data = task_response.json()['data']
                if task_data['status'] == 'stopped':
                    if task_data['exitstatus'] == 'OK':
                        print("Cloning completed successfully")
                        return True
                    else:
                        print(f"Cloning error: {task_data.get('exitstatus')}")
                        return False
            time.sleep(5)
        
        print("Task completion timeout")
        return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

def pm_configure_vm_network(
    vmid,
    mac_address,
    network_device="net0",
    proxmox_host=pm_host,
    proxmox_port=pm_port,
    username=pm_user,
    password=pm_passwd,
    realm=pm_realm,
    target_node=pm_node,
    bridge=pm_net_bridge,
    model="virtio",
    timeout=30
):
    base_url = f"https://{proxmox_host}:{proxmox_port}/api2/json"
    
    try:
        auth_url = f"{base_url}/access/ticket"
        auth_data = {
            "username": username,
            "password": password,
            "realm": realm
        }
        
        response = requests.post(
            auth_url,
            data=auth_data,
            verify=False,
            timeout=timeout
        )
        response.raise_for_status()
        
        ticket = response.json()['data']['ticket']
        csrf_token = response.json()['data']['CSRFPreventionToken']
        
        headers = {
            "CSRFPreventionToken": csrf_token,
            "Cookie": f"PVEAuthCookie={ticket}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        network_config = f"{model}={mac_address},bridge={bridge},firewall=1"
        
        put_params = {
            network_device: network_config
        }
        
        config_url = f"{base_url}/nodes/{target_node}/qemu/{vmid}/config"
        
        print(f"Configuring network for VM {vmid}: {put_params}")
        
        response = requests.put(
            config_url,
            data=put_params,
            headers=headers,
            verify=False,
            timeout=timeout
        )
        print(response.text)
        if response.status_code == 200:
            print(f"✅ Network device {network_device} configured successfully")
            print(f"   MAC: {mac_address}")
            return True
        else:
            print(f"❌ Network configuration error: {response.status_code}")
            print(f"   Server response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception during network configuration: {str(e)}")
        return False

def start_vm_proxmox(
    vm_id,
    proxmox_host=pm_host,
    proxmox_port=pm_port,
    username=pm_user,
    password=pm_passwd,
    realm=pm_realm,
    target_node=pm_node,
    timeout=30
):
    base_url = f"https://{proxmox_host}:{proxmox_port}/api2/json"
    
    try:
        auth_url = f"{base_url}/access/ticket"
        auth_data = {
            "username": username,
            "password": password,
            "realm": realm
        }
        
        response = requests.post(
            auth_url,
            data=auth_data,
            verify=False,
            timeout=timeout
        )
        response.raise_for_status()
        
        ticket = response.json()['data']['ticket']
        csrf_token = response.json()['data']['CSRFPreventionToken']
        
        headers = {
            "CSRFPreventionToken": csrf_token,
            "Cookie": f"PVEAuthCookie={ticket}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        start_url = f"{base_url}/nodes/{target_node}/qemu/{vm_id}/status/start"
        
        print(f"Starting VM {vm_id}")
        
        response = requests.post(
            start_url,
            headers=headers,
            verify=False,
            timeout=timeout
        )
        
        if response.status_code == 200:
            print(f"✅ VM {vm_id} started successfully")
            change_server_status(vm_id, "on")
            return True
        else:
            print(f"❌ VM start error: {response.status_code}")
            print(f"   Server response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception during VM start: {str(e)}")
        return False

def stop_vm_proxmox(
    vm_id,
    proxmox_host=pm_host,
    proxmox_port=pm_port,
    username=pm_user,
    password=pm_passwd,
    realm=pm_realm,
    target_node=pm_node,
    timeout=30
):
    base_url = f"https://{proxmox_host}:{proxmox_port}/api2/json"
    
    try:
        auth_url = f"{base_url}/access/ticket"
        auth_data = {
            "username": username,
            "password": password,
            "realm": realm
        }
        
        response = requests.post(
            auth_url,
            data=auth_data,
            verify=False,
            timeout=timeout
        )
        response.raise_for_status()
        
        ticket = response.json()['data']['ticket']
        csrf_token = response.json()['data']['CSRFPreventionToken']
        
        headers = {
            "CSRFPreventionToken": csrf_token,
            "Cookie": f"PVEAuthCookie={ticket}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        stop_url = f"{base_url}/nodes/{target_node}/qemu/{vm_id}/status/stop"
        
        print(f"Stopping VM {vm_id}")
        
        response = requests.post(
            stop_url,
            headers=headers,
            verify=False,
            timeout=timeout
        )
        
        if response.status_code == 200:
            print(f"✅ VM {vm_id} stopped successfully")
            change_server_status(vm_id, "off")
            return True
        else:
            print(f"❌ VM stop error: {response.status_code}")
            print(f"   Server response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception during VM stop: {str(e)}")
        return False


def ps_static_mapping(
    mac,
    lan_ip,
    api_key=ps_api_key,
    api_url=ps_host
):
    headers = {
        'X-API-Key': api_key,
        'Content-Type': 'application/json'
    }
    
    dhcp_data = {
        'mac': mac,
        'ipaddr': lan_ip,
        'hostname': f'static-{mac.replace(":", "")}',
        'descr': f'Static mapping for {mac}',
        'arp_table_static_entry': True
    }
    
    try:
        dhcp_data['parent_id'] = "lan"
        
        dhcp_response = requests.post( 
            url=f"{api_url}/api/v2/services/dhcp_server/static_mapping",
            headers=headers,
            json=dhcp_data 
        )
        dhcp_response.raise_for_status()

        dhcp_patch_response = requests.patch(
            url=f"{api_url}/api/v2/services/dhcp_server/static_mapping",
            headers=headers
        )
        dhcp_patch_response.raise_for_status()
        
    except requests.exceptions.RequestException as e:
        print(dhcp_response.text)
        print(dhcp_patch_response.text)
        return False, f"DHCP static mapping creation error: {str(e)}"
    
    print(dhcp_patch_response.text)
    print(dhcp_response.text)

def ps_nat_one_to_one(
    lan_ip,
    wan_ip,
    mac,
    interface="wan",
    api_url=ps_host,
    api_key=ps_api_key
):
    headers = {
        'X-API-Key': api_key,
        'Content-Type': 'application/json'
    }
    
    nat_data = {
        'interface': interface,
        'disabled': False,
        'external': wan_ip,
        'source': lan_ip,
        'destination': "any",
        'descr': f'1:1 NAT for {mac}',
        
    }
    
    try:
        nat_response = requests.post(
            f"{api_url}/api/v2/firewall/nat/one_to_one/mapping",
            headers=headers,
            json=nat_data
        )
        nat_response.raise_for_status()

        patch_response = requests.patch(
            f"{api_url}/api/v2/firewall/nat/one_to_one/mapping",
            headers=headers
        )
        patch_response.raise_for_status()
        
    except requests.exceptions.RequestException as e:
        print(nat_response.text)
        print(patch_response.text + "working with err but working true")
        return False, f"1:1 NAT rule creation error: {str(e)}"
    print(nat_response.text)
    print(patch_response.text + "working with err but working true")

def ps_rules(
    wan_ip,
    lan_ip,
    mac,
    api_url=ps_host,
    api_key=ps_api_key
):
    headers = {
        'X-API-Key': api_key,
        'Content-Type': 'application/json'
    }

    firewall_data = {
        'type': 'pass',
        'interface': 'wan',
        'ipprotocol': 'inet',
        'protocol': 'any',
        'source': 'any',
        'destination': wan_ip,
        'descr': f'Allow traffic to {mac}',
        'disabled': False
    }
    
    try:
        firewall_response = requests.post(
            f"{api_url}/api/v2/firewall/rule",
            headers=headers,
            json=firewall_data
        )
        firewall_response.raise_for_status()
        
    except requests.exceptions.RequestException as e:
        return False, f"Firewall rule creation error: {str(e)}"

def configure_pfsense(
    mac,
    lan_ip, 
    wan_ip, 
    api_url=ps_host, 
    api_key=ps_api_key,
    interface='wan'
):
    try:
        print("ps static mapping:------------------------->>>>>>")
        ps_static_mapping(mac=mac, lan_ip=lan_ip)

        print("ps one to one:------------------------->>>>>>")
        ps_nat_one_to_one(lan_ip=lan_ip, wan_ip=wan_ip, mac=mac)

        print("ps rules:------------------------->>>>>>")
        ps_rules(wan_ip=wan_ip, lan_ip=lan_ip, mac=mac)
        
    except:
        print("Error on configure pfsense")
        return False

    print("Successfully configure DHCP Pfsense to mac: {mac}")
    return True

def ps_conf(id):
    details, t = get_server_details(id)
    if details:
        try:
            configure_pfsense(details["mac"], details["lan_ip"], details["ips"][0])
        except:
            print("error to conf pfsense")