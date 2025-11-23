const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN || '8579547514:AAFJQR6CL_Ui2Q8-Ac0g_y4vBtwrR4tXraU';
const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-app.vercel.app';

const bot = new Telegraf(BOT_TOKEN);

// Обработка ошибок бота
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
});

bot.start(async (ctx) => {
    try {
        await ctx.reply(
            `🏦 **Crypto Wallet**\n\n` +
            `Профессиональный криптовалютный кошелек для управления вашими активами.\n\n` +
            `• Безопасное хранение\n` +
            `• Мультивалютность\n` +
            `• Быстрые транзакции\n\n` +
            `Начните работу с приложением:`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📱 Открыть кошелек', web_app: { url: `${BASE_URL}/index.html` } }]
                    ]
                }
            }
        );
    } catch (error) {
        console.error('Start command error:', error);
    }
});

bot.command('wallet', async (ctx) => {
    try {
        await ctx.reply(
            'Откройте ваш крипто-кошелек:',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🚀 Открыть кошелек', web_app: { url: `${BASE_URL}/index.html` } }]
                    ]
                }
            }
        );
    } catch (error) {
        console.error('Wallet command error:', error);
    }
});

// Обработчик для веб-хуков Vercel
module.exports = async (req, res) => {
    // Устанавливаем CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).json({ status: 'ok' });
        } catch (error) {
            console.error('Error handling update:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.status(200).json({ 
            status: 'Crypto Wallet Bot is running!',
            timestamp: new Date().toISOString()
        });
    }
};
