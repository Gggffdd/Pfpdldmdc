import telebot
import sqlite3
import json
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

# ========== НАСТРОЙКИ ==========
TOKEN = "8554211393:AAFvVaR-TaxdR3jBOoH7CMAPlSGwlGruZr0"
ADMIN_ID = 896706118  # ТВОЙ ID
bot = telebot.TeleBot(TOKEN)

# ========== БАЗА ДАННЫХ ==========
conn = sqlite3.connect('houses.db', check_same_thread=False)
cursor = conn.cursor()

# Создаём таблицу с домами
cursor.execute('''
CREATE TABLE IF NOT EXISTS houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,           -- ID пользователя в Telegram
    username TEXT,                     -- Юзернейм
    first_name TEXT,                   -- Имя
    description TEXT DEFAULT '',       -- Описание
    x INTEGER DEFAULT 50,              -- Координата X на карте
    y INTEGER DEFAULT 50,              -- Координата Y
    house_type INTEGER DEFAULT 1       -- Тип дома (1-5)
)
''')
conn.commit()

# ========== КОМАНДА START ==========
@bot.message_handler(commands=['start'])
def start(message):
    # Кнопка для открытия Mini App
    markup = InlineKeyboardMarkup()
    
    # URL твоего Mini App (ЗАМЕНИ НА СВОЙ ПОСЛЕ ДЕПЛОЯ)
    webapp_url = "https://твой-сайт.vercel.app"
    
    markup.add(InlineKeyboardButton(
        "🏡 Открыть карту города",
        web_app=WebAppInfo(url=webapp_url)
    ))
    
    bot.send_message(
        message.chat.id,
        "🏙️ Добро пожаловать в город!\n\n"
        "👑 Админ может добавлять дома командой:\n"
        "/addhouse @username\n\n"
        "🏠 Владельцы домов могут менять описание:\n"
        "/setdescription Твой текст\n"
        "/deletedescription",
        reply_markup=markup
    )

# ========== КОМАНДЫ АДМИНА ==========
@bot.message_handler(commands=['addhouse'])
def add_house(message):
    # Проверка на админа
    if message.from_user.id != ADMIN_ID:
        bot.reply_to(message, "❌ Только админ может добавлять дома")
        return
    
    try:
        # Формат: /addhouse @username
        parts = message.text.split()
        if len(parts) < 2:
            bot.reply_to(message, "❌ Формат: /addhouse @username")
            return
        
        username = parts[1].replace('@', '')
        
        # Получаем информацию о пользователе из Telegram
        try:
            # Пробуем получить пользователя по юзернейму
            user = bot.get_chat(username)
            user_id = user.id
            first_name = user.first_name or ""
            username = user.username or username
        except Exception as e:
            bot.reply_to(message, f"❌ Пользователь @{username} не найден в Telegram")
            return
        
        # Проверяем, есть ли уже дом у этого юзера
        cursor.execute("SELECT id FROM houses WHERE user_id = ?", (user_id,))
        if cursor.fetchone():
            bot.reply_to(message, f"❌ У @{username} уже есть дом")
            return
        
        # Генерируем случайные координаты
        import random
        x = random.randint(10, 90)
        y = random.randint(10, 90)
        house_type = random.randint(1, 5)
        
        # Добавляем дом в базу
        cursor.execute(
            "INSERT INTO houses (user_id, username, first_name, x, y, house_type) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, username, first_name, x, y, house_type)
        )
        conn.commit()
        
        # Отправляем уведомление владельцу дома
        try:
            bot.send_message(
                user_id,
                f"🏠 Вам построили дом в городе!\n"
                f"Открой карту: /start\n"
                f"Чтобы добавить описание: /setdescription Твой текст"
            )
        except:
            pass
        
        bot.reply_to(
            message, 
            f"✅ Дом для @{username} добавлен!\n"
            f"Координаты: {x}, {y}\n"
            f"Тип дома: {house_type}"
        )
        
    except Exception as e:
        bot.reply_to(message, f"❌ Ошибка: {e}")

# ========== КОМАНДЫ ВЛАДЕЛЬЦА ДОМА ==========
@bot.message_handler(commands=['setdescription'])
def set_description(message):
    user_id = message.from_user.id
    
    # Проверяем, есть ли у юзера дом
    cursor.execute("SELECT id FROM houses WHERE user_id = ?", (user_id,))
    house = cursor.fetchone()
    
    if not house:
        bot.reply_to(message, "❌ У тебя нет дома. Админ должен сначала добавить тебя командой /addhouse")
        return
    
    # Получаем описание
    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        bot.reply_to(message, "❌ Формат: /setdescription Твой текст")
        return
    
    new_description = parts[1]
    
    # Обновляем в базе
    cursor.execute(
        "UPDATE houses SET description = ? WHERE user_id = ?",
        (new_description, user_id)
    )
    conn.commit()
    
    bot.reply_to(message, "✅ Описание твоего дома обновлено!")

@bot.message_handler(commands=['deletedescription'])
def delete_description(message):
    user_id = message.from_user.id
    
    cursor.execute(
        "UPDATE houses SET description = '' WHERE user_id = ?",
        (user_id,)
    )
    conn.commit()
    
    bot.reply_to(message, "✅ Описание удалено!")

# ========== ОБРАБОТКА ДАННЫХ ИЗ MINI APP ==========
@bot.message_handler(content_types=['web_app_data'])
def handle_webapp_data(message):
    data = json.loads(message.web_app_data.data)
    
    if data.get('action') == 'get_houses':
        # Получаем все дома из базы
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
        
        # Отправляем данные обратно в Mini App
        bot.reply_to(
            message,
            json.dumps({'houses': result}),
            reply_to_message_id=message.message_id
        )
    
    elif data.get('action') == 'get_user_photo':
        # Запрос на получение фото пользователя
        user_id = data.get('user_id')
        try:
            # Получаем фото профиля
            photos = bot.get_user_profile_photos(user_id, limit=1)
            if photos.total_count > 0:
                file_id = photos.photos[0][-1].file_id
                file = bot.get_file(file_id)
                file_path = file.file_path
                file_url = f"https://api.telegram.org/file/bot{TOKEN}/{file_path}"
                bot.reply_to(
                    message,
                    json.dumps({'photo_url': file_url}),
                    reply_to_message_id=message.message_id
                )
            else:
                bot.reply_to(
                    message,
                    json.dumps({'photo_url': None}),
                    reply_to_message_id=message.message_id
                )
        except:
            bot.reply_to(
                message,
                json.dumps({'photo_url': None}),
                reply_to_message_id=message.message_id
            )

# ========== ЗАПУСК ==========
if __name__ == '__main__':
    print("✅ Бот запущен...")
    print(f"👑 Админ ID: {ADMIN_ID}")
    print("📝 Команды:")
    print("  /addhouse @username - добавить дом")
    print("  /setdescription - изменить описание")
    print("  /deletedescription - удалить описание")
    bot.infinity_polling()
