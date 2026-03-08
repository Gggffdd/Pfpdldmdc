import telebot
import sqlite3
import json
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

# ========== НАСТРОЙКИ ==========
TOKEN = "ТВОЙ_ТОКЕН_БОТА"  # ВСТАВЬ СЮДА ТОКЕН ОТ @BotFather
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
    description TEXT DEFAULT '',
    x INTEGER,
    y INTEGER,
    house_type INTEGER DEFAULT 1
)
''')
conn.commit()

# ========== КОМАНДЫ АДМИНА ==========
@bot.message_handler(commands=['addhouse'])
def add_house(message):
    if message.from_user.id != ADMIN_ID:
        bot.reply_to(message, "❌ Только админ может добавлять дома")
        return
    
    try:
        # Формат: /addhouse @username Описание
        parts = message.text.split(maxsplit=2)
        if len(parts) < 2:
            bot.reply_to(message, "❌ Формат: /addhouse @username Описание")
            return
        
        username = parts[1].replace('@', '')
        description = parts[2] if len(parts) > 2 else ""
        
        # Получаем информацию о пользователе
        try:
            user = bot.get_chat(username)
            user_id = user.id
        except:
            # Если юзер не найден в Telegram, создаём заглушку
            user_id = hash(username) % 1000000
        
        # Проверяем, есть ли уже дом у этого юзера
        cursor.execute("SELECT id FROM houses WHERE user_id = ?", (user_id,))
        if cursor.fetchone():
            bot.reply_to(message, f"❌ У @{username} уже есть дом")
            return
        
        # Случайные координаты на карте
        import random
        x = random.randint(5, 95)
        y = random.randint(5, 95)
        
        cursor.execute(
            "INSERT INTO houses (user_id, username, description, x, y) VALUES (?, ?, ?, ?, ?)",
            (user_id, username, description, x, y)
        )
        conn.commit()
        
        bot.reply_to(message, f"✅ Дом для @{username} добавлен!\nКоординаты: {x}, {y}")
        
    except Exception as e:
        bot.reply_to(message, f"❌ Ошибка: {e}")

# ========== КОМАНДЫ ВЛАДЕЛЬЦА ==========
@bot.message_handler(commands=['setdescription'])
def set_description(message):
    user_id = message.from_user.id
    
    # Проверяем, есть ли у юзера дом
    cursor.execute("SELECT id FROM houses WHERE user_id = ?", (user_id,))
    if not cursor.fetchone():
        bot.reply_to(message, "❌ У тебя нет дома")
        return
    
    # Получаем описание
    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        bot.reply_to(message, "❌ Формат: /setdescription Твой текст")
        return
    
    new_description = parts[1]
    
    cursor.execute(
        "UPDATE houses SET description = ? WHERE user_id = ?",
        (new_description, user_id)
    )
    conn.commit()
    
    bot.reply_to(message, "✅ Описание обновлено!")

@bot.message_handler(commands=['deletedescription'])
def delete_description(message):
    user_id = message.from_user.id
    
    cursor.execute(
        "UPDATE houses SET description = '' WHERE user_id = ?",
        (user_id,)
    )
    conn.commit()
    
    bot.reply_to(message, "✅ Описание удалено!")

# ========== ЗАПУСК MINI APP ==========
@bot.message_handler(commands=['start'])
def start(message):
    # Создаём клавиатуру с WebApp кнопкой
    markup = InlineKeyboardMarkup()
    
    # URL твоего Mini App (замени на свой после деплоя)
    webapp_url = "https://твой-сайт.vercel.app"
    
    markup.add(InlineKeyboardButton(
        "🏡 Открыть карту города",
        web_app=WebAppInfo(url=webapp_url)
    ))
    
    bot.send_message(
        message.chat.id,
        "🏙️ Добро пожаловать в город!\nНажми кнопку, чтобы открыть карту.",
        reply_markup=markup
    )

# ========== ПОЛУЧЕНИЕ ДАННЫХ ДЛЯ MINI APP ==========
@bot.message_handler(content_types=['web_app_data'])
def handle_webapp_data(message):
    # Mini App может отправлять данные сюда
    data = json.loads(message.web_app_data.data)
    
    if data.get('action') == 'get_houses':
        # Отправляем все дома
        cursor.execute("SELECT user_id, username, description, x, y, house_type FROM houses")
        houses = cursor.fetchall()
        
        result = []
        for h in houses:
            result.append({
                'user_id': h[0],
                'username': h[1],
                'description': h[2] or "",
                'x': h[3],
                'y': h[4],
                'type': h[5]
            })
        
        bot.send_message(
            message.chat.id,
            json.dumps({'houses': result}),
            reply_to_message_id=message.message_id
        )

# ========== ЗАПУСК ==========
if __name__ == '__main__':
    print("Бот запущен...")
    bot.infinity_polling()
