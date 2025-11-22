import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const app = express();
const PORT = process.env.PORT || 3000;

// Бот
const bot = new TelegramBot('8579547514:AAFJQR6CL_Ui2Q8-Ac0g_y4vBtwrR4tXraU', { polling: true });

// Команда для запуска Mini App
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🚀 Добро пожаловать в Crypto Trade!', {
    reply_markup: {
      inline_keyboard: [[
        { 
          text: '📱 Открыть приложение', 
          web_app: { url: `https://${process.env.VERCEL_URL || 'your-app.vercel.app'}` } 
        }
      ]]
    }
  });
});

// Статичные файлы
app.use(express.static('public'));

// Главная страница Mini App
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Crypto Trade</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0d0d0d; color: white; }
            .container { max-width: 400px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .balance-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px; margin-bottom: 20px; }
            .balance-amount { font-size: 32px; font-weight: bold; margin: 10px 0; }
            .section { background: #1a1a1a; padding: 15px; border-radius: 10px; margin-bottom: 15px; }
            .crypto-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #333; }
            .crypto-item:last-child { border-bottom: none; }
            .crypto-name { display: flex; align-items: center; gap: 10px; }
            .crypto-price { font-weight: bold; }
            .price-up { color: #00ff88; }
            .price-down { color: #ff4444; }
            .btn { width: 100%; padding: 15px; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; margin: 5px 0; }
            .btn-buy { background: #00ff88; color: #000; }
            .btn-sell { background: #ff4444; color: white; }
            .nav { display: flex; justify-content: space-around; margin-top: 20px; padding: 15px; background: #1a1a1a; border-radius: 10px; }
            .nav-item { text-align: center; cursor: pointer; }
            .nav-item.active { color: #667eea; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 Crypto Trade</h1>
                <p>Торгуйте криптовалютой в реальном времени</p>
            </div>

            <div class="balance-card">
                <div>Общий баланс</div>
                <div class="balance-amount">$10,245.50</div>
                <div>+$245.50 (2.45%) сегодня</div>
            </div>

            <div class="section">
                <h3>📊 Быстрая торговля</h3>
                <div style="display: flex; gap: 10px; margin: 15px 0;">
                    <button class="btn btn-buy" onclick="trade('buy')">КУПИТЬ</button>
                    <button class="btn btn-sell" onclick="trade('sell')">ПРОДАТЬ</button>
                </div>
            </div>

            <div class="section">
                <h3>🏆 Топ криптовалюты</h3>
                <div id="crypto-list">
                    <!-- Crypto list will be populated by JavaScript -->
                </div>
            </div>

            <div class="nav">
                <div class="nav-item active" onclick="showSection('wallet')">💰 Кошелек</div>
                <div class="nav-item" onclick="showSection('trade')">📈 Торговля</div>
                <div class="nav-item" onclick="showSection('market')">📊 Рынок</div>
            </div>
        </div>

        <script>
            // Инициализация Telegram Web App
            let tg = window.Telegram.WebApp;
            tg.expand();
            tg.MainButton.setText('ПОДТВЕРДИТЬ').show();

            // Данные криптовалют
            const cryptoData = [
                { symbol: 'BTC', name: 'Bitcoin', price: 42350.75, change: 2.34, icon: '₿' },
                { symbol: 'ETH', name: 'Ethereum', price: 2543.20, change: 1.56, icon: 'Ξ' },
                { symbol: 'BNB', name: 'Binance Coin', price: 312.45, change: -0.45, icon: 'ⓑ' },
                { symbol: 'SOL', name: 'Solana', price: 102.30, change: 5.67, icon: '◎' },
                { symbol: 'XRP', name: 'Ripple', price: 0.6234, change: 0.89, icon: '✕' }
            ];

            // Заполнение списка криптовалют
            function loadCryptoList() {
                const list = document.getElementById('crypto-list');
                list.innerHTML = cryptoData.map(crypto => `
                    <div class="crypto-item">
                        <div class="crypto-name">
                            <span style="font-size: 20px;">${crypto.icon}</span>
                            <div>
                                <div><strong>${crypto.symbol}</strong></div>
                                <div style="font-size: 12px; color: #888;">${crypto.name}</div>
                            </div>
                        </div>
                        <div class="crypto-price ${crypto.change >= 0 ? 'price-up' : 'price-down'}">
                            $${crypto.price.toLocaleString()}
                            <div style="font-size: 12px;">${crypto.change >= 0 ? '+' : ''}${crypto.change}%</div>
                        </div>
                    </div>
                `).join('');
            }

            // Функции торговли
            function trade(action) {
                const amount = prompt(`Введите сумму для ${action === 'buy' ? 'покупки' : 'продажи'}:`);
                if (amount && !isNaN(amount)) {
                    alert(`${action === 'buy' ? 'Покупка' : 'Продажа'} на $${amount} выполнена!`);
                    tg.showPopup({
                        title: '✅ Успешно!',
                        message: `Операция на $${amount} завершена`,
                        buttons: [{ type: 'ok' }]
                    });
                }
            }

            // Навигация
            function showSection(section) {
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                event.target.classList.add('active');
                
                // Здесь можно добавить логику переключения секций
                tg.showAlert(`Переход в раздел: ${section}`);
            }

            // Обновление цен каждые 5 секунд
            function updatePrices() {
                cryptoData.forEach(crypto => {
                    // Симуляция изменения цен
                    const change = (Math.random() - 0.5) * 2;
                    crypto.price *= (1 + change / 100);
                    crypto.change = parseFloat((crypto.change + change).toFixed(2));
                });
                loadCryptoList();
            }

            // Инициализация
            loadCryptoList();
            setInterval(updatePrices, 5000);

            // Обработчик кнопки Telegram
            tg.MainButton.onClick(() => {
                tg.showPopup({
                    title: 'Подтверждение',
                    message: 'Вы уверены в операции?',
                    buttons: [
                        { id: 'confirm', type: 'default', text: 'Подтвердить' },
                        { type: 'cancel' }
                    ]
                });
            });
        </script>
    </body>
    </html>
  `);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Bot is live!`);
});
