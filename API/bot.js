const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN || '8579547514:AAFJQR6CL_Ui2Q8-Ac0g_y4vBtwrR4tXraU';
const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-app.vercel.app';

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
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
});

bot.command('wallet', async (ctx) => {
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
});

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
        res.status(200).send('Crypto Wallet Bot is running!');
    }
};
