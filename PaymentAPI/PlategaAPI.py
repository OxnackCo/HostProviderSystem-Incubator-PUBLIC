from helpers import *
from config import *
import json

def create_invoice_platega_sbpqr(amount: int, paymentMethod=2):
    url = f"{PLATEGA_API_URL}/transaction/process"
    body = {
        "paymentMethod": paymentMethod,
        "paymentDetails": {
            "amount": amount,
            "currency": "RUB"
        },
        "description": "Oxnack VDS add balance",
        "return": "https://oxnack.com/",
        "failedUrl": "https://oxnack.com/",
        "payload": "Pay balance"
    }
    
    headers = PLATEGA_HEADERS.copy() if PLATEGA_HEADERS else {}
    
    headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
    })
    
    try:
        response = requests.post(url, headers=headers, json=body, timeout=30)
        response.raise_for_status()
        data = response.json()
        if data.get("status") == "PENDING":
            return data.get("transactionId"), data.get("redirect")
        else:
            print(f"[API Error]: {data.get('error')}")
            return None
    except Exception as e:
        print(f"[Request Error]: {e}")
        return None

def check_invoice_status_platega(transactionId):
    url = f"{PLATEGA_API_URL}/transaction/{transactionId}"
    
    headers = PLATEGA_HEADERS.copy() if PLATEGA_HEADERS else {}
    headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
    })
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data.get("status")
    
    except Exception as e:
        print(f"[Request Error]: {e}")
        return None