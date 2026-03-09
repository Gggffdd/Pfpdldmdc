import telebot
import sqlite3
import json
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

# ========== НАСТРОЙКИ ==========
TOKEN = "8554211393:AAFvVaR-TaxdR3jBOoH7CMAPlSGwlGruZr0"  # ВСТАВЬ СЮДА ТОКЕН
ADMIN_ID = 896706118
bot = telebot.TeleBot(TOKEN)

# ========== БАЗА ДАННЫХ ==========
conn = sqlite3.connect('houses.db', check_same_thread=False)
cursor = conn.cursor()

cursor.execute('''
CREATE TABLE IF NOT EXISTS houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    username TEXT,
    first_name TEXT,
    description TEXT DEFAULT '',
    x INTEGER,
    y INTEGER,
    house_type INTEGER DEFAULT 1
)
''')
conn.commit()

# ========== ТОЛЬКО СТАРТ ==========
@bot.message_handler(commands=['start'])
def start(message):
    # Кнопка для открытия Mini App
    markup = InlineKeyboardMarkup()
    webapp_url = "https://твой-сайт.vercel.app"  # ЗАМЕНИ НА СВОЙ URL
    markup.add(InlineKeyboardButton(
        "🏡 Открыть город",
        web_app=WebAppInfo(url=webapp_url)
    ))
    
    bot.send_message(
        message.chat.id,
        "🏙️ Добро пожаловать в город!\nВсё управление — внутри приложения.",
        reply_markup=markup
    )

# ========== ОБРАБОТКА ДАННЫХ ИЗ MINI APP ==========
@bot.message_handler(content_types=['web_app_data'])
def handle_webapp_data(message):
    data = json.loads(message.web_app_data.data)
    action = data.get('action')
    
    # 1. ПОЛУЧИТЬ ВСЕ ДОМА
    if action == 'get_houses':
        cursor.execute("SELECT user_id, username, first_name, description, x, y, house_type FROM houses")
        houses = cursor.fetchall()
        
        result = []
        for h in houses:
            result.append({
                'user_id': h[0],
                'username': h[1],
                'first_name': h[2],
                'description': h[3] or "",
                'x': h[4],
                'y': h[5],
                'type': h[6]
            })
        
        bot.reply_to(message, json.dumps({'houses': result}))
    
    # 2. ДОБАВИТЬ ДОМ (ТОЛЬКО АДМИН)
    elif action == 'add_house':
        if message.from_user.id != ADMIN_ID:
            bot.reply_to(message, json.dumps({'error': 'Только админ'}))
            return
        
        username = data.get('username', '').replace('@', '')
        if not username:
            bot.reply_to(message, json.dumps({'error': 'Нужен юзернейм'}))
            return
        
        try:
            # Получаем данные пользователя
            user = bot.get_chat(username)
            user_id = user.id
            first_name = user.first_name or ""
            
            # Проверяем, есть ли уже дом
            cursor.execute("SELECT id FROM houses WHERE user_id = ?", (user_id,))
            if cursor.fetchone():
                bot.reply_to(message, json.dumps({'error': 'Уже есть дом'}))
                return
            
            # Случайные координаты
            import random
            x = random.randint(10, 90)
            y = random.randint(10, 90)
            house_type = random.randint(1, 5)
            
            cursor.execute(
                "INSERT INTO houses (user_id, username, first_name, x, y, house_type) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, username, first_name, x, y, house_type)
            )
            conn.commit()
            
            # Уведомляем владельца
            try:
                bot.send_message(
                    user_id,
                    f"🏠 Вам построили дом в городе!\nОткрой карту: /start"
                )
            except:
                pass
            
            bot.reply_to(message, json.dumps({'success': True, 'house': {
                'user_id': user_id,
                'username': username,
                'first_name': first_name,
                'x': x,
                'y': y,
                'type': house_type
            }}))
            
        except Exception as e:
            bot.reply_to(message, json.dumps({'error': str(e)}))
    
    # 3. ИЗМЕНИТЬ ОПИСАНИЕ
    elif action == 'update_description':
        user_id = message.from_user.id
        new_description = data.get('description', '')
        
        cursor.execute(
            "UPDATE houses SET description = ? WHERE user_id = ?",
            (new_description, user_id)
        )
        conn.commit()
        
        bot.reply_to(message, json.dumps({'success': True}))
    
    # 4. УДАЛИТЬ ОПИСАНИЕ
    elif action == 'delete_description':
        user_id = message.from_user.id
        
        cursor.execute(
            "UPDATE houses SET description = '' WHERE user_id = ?",
            (user_id,)
        )
        conn.commit()
        
        bot.reply_to(message, json.dumps({'success': True}))
    
    # 5. ПОЛУЧИТЬ ФОТО
    elif action == 'get_photo':
        user_id = data.get('user_id')
        try:
            photos = bot.get_user_profile_photos(user_id, limit=1)
            if photos.total_count > 0:
                file_id = photos.photos[0][-1].file_id
                file = bot.get_file(file_id)
                file_url = f"https://api.telegram.org/file/bot{TOKEN}/{file.file_path}"
                bot.reply_to(message, json.dumps({'photo_url': file_url}))
            else:
                bot.reply_to(message, json.dumps({'photo_url': None}))
        except:
            bot.reply_to(message, json.dumps({'photo_url': None}))

if __name__ == '__main__':
    print("✅ Бот запущен")
    bot.infinity_polling()
