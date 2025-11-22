const { Telegraf } = require('telegraf');

const BOT_TOKEN = '8579547514:AAFJQR6CL_Ui2Q8-Ac0g_y4vBtwrR4tXraU';
const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-app.vercel.app';

const bot = new Telegraf(BOT_TOKEN);

// Команда старт с улучшенным сообщением
bot.start(async (ctx) => {
    await ctx.reply(
        `🎯 Добро пожаловать в Crypto Bot Simulator!\n\n` +
        `💼 Торгуйте виртуальной криптовалютой в реальном времени\n` +
        `📈 Следите за изменением цен\n` +
        `💰 Управляйте своим портфелем\n\n` +
        `Нажмите кнопку ниже чтобы начать:`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🚀 Открыть приложение', web_app: { url: `${BASE_URL}/index.html` } }],
                    [
                        { text: '📊 Портфель', callback_data: 'portfolio' },
                        { text: '❓ Помощь', callback_data: 'help' }
                    ]
                ]
            }
        }
    );
});

// Команда помощи
bot.action('help', async (ctx) => {
    await ctx.editMessageText(
        `📖 **Помощь по Crypto Bot Simulator**\n\n` +
        `• **Торговля**: Покупайте и продавайте криптовалюту\n` +
        `• **Баланс**: Начальный баланс - 10,000 RUB\n` +
        `• **Цены**: Обновляются в реальном времени\n` +
        `• **Портфель**: Отслеживайте свои инвестиции\n\n` +
        `Используйте кнопки в приложении для управления.`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📱 Открыть приложение', web_app: { url: `${BASE_URL}/index.html` } }]
                ]
            }
        }
    );
});

// Остальной код бота остается таким же...
// [остальная часть кода из предыдущей версии]

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
