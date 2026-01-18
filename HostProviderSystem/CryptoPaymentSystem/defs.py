import asyncio
from web3 import Web3
import os
from config import *

#w3 = Web3(Web3.HTTPProvider(BSC_RPC_URL))

# if not w3.is_connected():
#     print("❌ ERROR connect to bnb")
#     exit()

# print("✅ CONNECTION done")

def create_wallet(): # return ADDR PRIVE_KEY
    account = Web3().eth.account.create()
    private_key = account.key.hex()
    address = account.address  # Уже в checksum формате
    return address, private_key

def validate_and_checksum(address): # check and convert to chacksumm
    w3 = Web3()
    if not w3.is_address(address):
        raise ValueError("Невалидный адрес")
    return w3.to_checksum_address(address)

def get_balance(address):
    checksum_address = validate_and_checksum(address)
    balance_wei = w3.eth.get_balance(checksum_address)
    balance_bnb = w3.from_wei(balance_wei, 'ether')
    return balance_bnb

def check_payment(destination_address, required_amount_bnb):
    checksum_address = validate_and_checksum(destination_address)
    current_balance_bnb = get_balance(checksum_address)
    print(f"now balance: {current_balance_bnb} BNB, need: {required_amount_bnb} BNB")
    return current_balance_bnb >= required_amount_bnb

print(create_wallet())