import os
import string
import random
import telebot
import psycopg2
from psycopg2.extras import RealDictCursor

TOKEN = ''
ADMIN_IDS = [5176418706]
IMAGE_DIR = '/'
BASE_IMAGE_URL = 'htes/'

host = ''  
database = 'v'
user = ''
password = ''

bot = telebot.TeleBot(TOKEN)
user_data = {}

def connect_to_db():   # coonect to db
    conn = psycopg2.connect(
        host=host,
        database=database,
        user=user,
        password=password
    )
    return conn

def add_service_to_db(name_ru, description_ru, name_en, description_en, price_usd, price_rub, image_link, enabled):   # ADD row IN services
    conn = connect_to_db()
    with conn.cursor() as cursor:
        cursor.execute("INSERT INTO services (name_ru, description_ru, name_en, description_en, price_usd, price_rub, image_link, enabled) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);", (name_ru, description_ru, name_en, description_en, price_usd, price_rub, image_link, enabled)) 
        conn.commit()
        print("new service with name: " + name_en)
    conn.close()



def generate_filename():
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choice(chars) for _ in range(5)) + '.jpg'

@bot.message_handler(commands=['add'])
def handle_add(message):
    if message.from_user.id not in ADMIN_IDS:
        return
    bot.send_message(message.chat.id, 'Service name RU:')
    bot.register_next_step_handler(message, get_service_name_ru)

def get_service_name_ru(message):
    if message.text == '/stop':
        user_data.pop(message.chat.id, None)
        bot.send_message(message.chat.id, 'Cancelled.')
        return
    user_data[message.chat.id] = {'name_ru': message.text}
    bot.send_message(message.chat.id, 'Service name EN:')
    bot.register_next_step_handler(message, get_service_name_en)

def get_service_name_en(message):
    if message.text == '/stop':
        user_data.pop(message.chat.id, None)
        bot.send_message(message.chat.id, 'Cancelled.')
        return
    user_data[message.chat.id]['name_en'] = message.text
    bot.send_message(message.chat.id, 'Description RU:')
    bot.register_next_step_handler(message, get_description_ru)

def get_description_ru(message):
    if message.text == '/stop':
        user_data.pop(message.chat.id, None)
        bot.send_message(message.chat.id, 'Cancelled.')
        return
    user_data[message.chat.id]['description_ru'] = message.text
    bot.send_message(message.chat.id, 'Description EN:')
    bot.register_next_step_handler(message, get_description_en)

def get_description_en(message):
    if message.text == '/stop':
        user_data.pop(message.chat.id, None)
        bot.send_message(message.chat.id, 'Cancelled.')
        return
    user_data[message.chat.id]['description_en'] = message.text
    bot.send_message(message.chat.id, 'Price USD:')
    bot.register_next_step_handler(message, get_price_usd)

def get_price_usd(message):
    if message.text == '/stop':
        user_data.pop(message.chat.id, None)
        bot.send_message(message.chat.id, 'Cancelled.')
        return
    user_data[message.chat.id]['price_usd'] = message.text
    bot.send_message(message.chat.id, 'Price RUB:')
    bot.register_next_step_handler(message, get_price_rub)

def get_price_rub(message):
    if message.text == '/stop':
        user_data.pop(message.chat.id, None)
        bot.send_message(message.chat.id, 'Cancelled.')
        return
    user_data[message.chat.id]['price_rub'] = message.text
    bot.send_message(message.chat.id, 'Image:')
    bot.register_next_step_handler(message, get_image)

def get_image(message):
    if message.text == '/stop':
        user_data.pop(message.chat.id, None)
        bot.send_message(message.chat.id, 'Cancelled.')
        return
    
    if not message.photo:
        bot.send_message(message.chat.id, 'Send an image.')
        bot.register_next_step_handler(message, get_image)
        return
    
    file_id = message.photo[-1].file_id
    file_info = bot.get_file(file_id)
    downloaded_file = bot.download_file(file_info.file_path)
    
    filename = generate_filename()
    filepath = os.path.join(IMAGE_DIR, filename)
    
    with open(filepath, 'wb') as new_file:
        new_file.write(downloaded_file)
    
    image_link = BASE_IMAGE_URL + filename
    user_data[message.chat.id]['image_link'] = image_link
    
    data = user_data[message.chat.id]
    add_service_to_db(data['name_ru'], data['description_ru'], data['name_en'], data['description_en'], int(data['price_usd']), int(data['price_rub']), data['image_link'], True)
    
    bot.send_message(message.chat.id, 'Service added correct.')
    user_data.pop(message.chat.id, None)

while True:
    try:
        print("bot start")
        bot.polling()
    except:
        print("bot crashed or off")