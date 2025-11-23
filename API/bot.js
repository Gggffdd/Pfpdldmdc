const { Telegraf } = require('telegraf');

const BOT_TOKEN = '8579547514:AAFJQR6CL_Ui2Q8-Ac0g_y4vBtwrR4tXraU';
const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-app.vercel.app';

const bot = new Telegraf(BOT_TOKEN);

// Профессиональное приветственное сообщение
bot.start(async (ctx) => {
    await ctx.reply(
        `🏦 **Crypto Wallet Pro**\n\n` +
        `Профессиональный криптовалютный кошелек для безопасного управления вашими активами.\n\n` +
        `• Безопасное хранение\n` +
        `• Реальные курсы\n` +
        `• Профессиональная аналитика\n\n` +
        `Начните работу с приложением:`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📱 Открыть кошелек', web_app: { url: `${BASE_URL}/index.html` } }],
                    [
                        { text: '📊 Статистика', callback_data: 'stats' },
                        { text: '🛡️ Безопасность', callback_data: 'security' }
                    ]
                ]
            }
        }
    );
});

// Команда помощи
bot.action('help', async (ctx) => {
    await ctx.editMessageText(
        `🛠️ **Помощь по Crypto Wallet Pro**\n\n` +
        `**Основные функции:**\n` +
        `• Управление портфелем\n` +
        `• Торговля криптовалютой\n` +
        `• Отслеживание курсов\n` +
        `• Безопасные транзакции\n\n` +
        `**Начальный баланс:** 50,000 RUB\n` +
        `**Поддержка:** 7 основных криптовалют\n\n` +
        `Для начала работы откройте приложение.`,
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

bot.action('stats', async (ctx) => {
    await ctx.editMessageText(
        `📈 **Статистика платформы**\n\n` +
        `• Поддерживаемые активы: 7\n` +
        `• Обновление цен: каждые 30 сек\n` +
        `• Торговые пары: RUB\n` +
        `• Безопасность: SSL/TLS\n\n` +
        `Платформа работает в режиме реального времени.`,
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

bot.action('security', async (ctx) => {
    await ctx.editMessageText(
        `🛡️ **Безопасность**\n\n` +
        `• Шифрование данных\n` +
        `• Защищенные транзакции\n` +
        `• Регулярное резервное копирование\n` +
        `• Мониторинг активности\n\n` +
        `Ваши активы защищены профессиональной системой безопасности.`,
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
        res.status(200).send('Crypto Wallet Pro is running!');
    }
};
