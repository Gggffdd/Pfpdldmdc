const { Telegraf } = require('telegraf');
const axios = require('axios');

const BOT_TOKEN = '8579547514:AAFJQR6CL_Ui2Q8-Ac0g_y4vBtwrR4tXraU';
const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-app.vercel.app';

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN);

// Хранилище пользователей (в реальном приложении используйте базу данных)
const users = new Map();
const cryptoPrices = {
    bitcoin: { price: 45000, change: 2.5, symbol: 'BTC' },
    ethereum: { price: 2500, change: 1.8, symbol: 'ETH' },
    solana: { price: 120, change: 5.2, symbol: 'SOL' },
    cardano: { price: 0.6, change: -1.2, symbol: 'ADA' },
    dogecoin: { price: 0.15, change: 3.7, symbol: 'DOGE' }
};

// Инициализация пользователя
function initUser(userId) {
    if (!users.has(userId)) {
        users.set(userId, {
            balance: 10000,
            portfolio: {},
            transactionHistory: [],
            lastUpdate: Date.now()
        });
    }
    return users.get(userId);
}

// Команда старт
bot.start(async (ctx) => {
    const user = initUser(ctx.from.id);
    
    await ctx.reply(
        `🎯 Добро пожаловать в Crypto Simulator!\n\n` +
        `💰 Баланс: $${user.balance.toFixed(2)}\n` +
        `📊 Начните торговать криптовалютой в нашем симуляторе!\n\n` +
        `Используйте команду /trade для начала торговли`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🚀 Начать торговлю', web_app: { url: `${BASE_URL}/index.html` } }],
                    [{ text: '📊 Мой портфель', callback_data: 'portfolio' }]
                ]
            }
        }
    );
});

// Команда торговли
bot.command('trade', async (ctx) => {
    await ctx.reply(
        'Откройте торговый терминал:',
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📈 Торговый терминал', web_app: { url: `${BASE_URL}/index.html` } }]
                ]
            }
        }
    );
});

// Показать портфель
bot.action('portfolio', async (ctx) => {
    const user = initUser(ctx.from.id);
    let portfolioText = `💰 Ваш портфель:\n\nБаланс: $${user.balance.toFixed(2)}\n\n`;
    
    let totalValue = user.balance;
    let hasInvestments = false;
    
    for (const [crypto, amount] of Object.entries(user.portfolio)) {
        if (amount > 0) {
            const price = cryptoPrices[crypto].price;
            const value = price * amount;
            totalValue += value;
            portfolioText += `${cryptoPrices[crypto].symbol}: ${amount.toFixed(4)} ($${value.toFixed(2)})\n`;
            hasInvestments = true;
        }
    }
    
    if (!hasInvestments) {
        portfolioText += 'У вас пока нет активов\n';
    }
    
    portfolioText += `\n💰 Общая стоимость: $${totalValue.toFixed(2)}`;
    
    await ctx.editMessageText(portfolioText, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📈 Торговать', web_app: { url: `${BASE_URL}/index.html` } }],
                [{ text: '🔄 Обновить', callback_data: 'portfolio' }]
            ]
        }
    });
});

// API endpoint для получения данных пользователя
bot.on('web_app_data', async (ctx) => {
    const data = JSON.parse(ctx.webAppData.data);
    const user = initUser(ctx.from.id);
    
    if (data.action === 'get_user_data') {
        await ctx.reply(JSON.stringify({
            success: true,
            user: {
                balance: user.balance,
                portfolio: user.portfolio,
                prices: cryptoPrices
            }
        }));
    }
});

// Симуляция изменения цен
function updatePrices() {
    for (const crypto in cryptoPrices) {
        const change = (Math.random() - 0.5) * 10; // -5% to +5%
        cryptoPrices[crypto].price *= (1 + change / 100);
        cryptoPrices[crypto].change = change;
    }
}

// Обновляем цены каждые 30 секунд
setInterval(updatePrices, 30000);

// Обработчик для веб-хуков
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (error) {
            console.error('Error handling update:', error);
            res.status(500).send('Error');
        }
    } else {
        res.status(200).send('Crypto Bot is running!');
    }
};
