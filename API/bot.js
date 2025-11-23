import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN || '8579547514:AAFJQR6CL_Ui2Q8-Ac0g_y4vBtwrR4tXraU';
const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-app.vercel.app';

const bot = new Telegraf(BOT_TOKEN);

// Команда старт с улучшенным дизайном
bot.start(async (ctx) => {
    const user = ctx.from;
    await ctx.reply(
        `🎯 *Добро пожаловать в Crypto Wallet Pro!*\n\n` +
        `👋 Привет, ${user.first_name || 'Трейдер'}!\n\n` +
        `💼 *Ваш надежный крипто-кошелек в Telegram*\\n` +
        `📊 Торгуйте 50+ криптовалютами\n` +
        `🔐 Безопасное хранение активов\n` +
        `💸 Мгновенные переводы\n` +
        `📈 Реальное время торговли\n\n` +
        `_Начните свой путь в мире криптовалют уже сегодня!_`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🚀 Открыть Кошелек', web_app: { url: `${BASE_URL}/index.html` } }],
                    [
                        { text: '📊 Мой Портфель', callback_data: 'portfolio' },
                        { text: '💎 Премиум', callback_data: 'premium' }
                    ],
                    [
                        { text: '📚 Обучение', callback_data: 'education' },
                        { text: '🛟 Поддержка', callback_data: 'support' }
                    ]
                ]
            }
        }
    );
});

// Команда помощи
bot.action('help', async (ctx) => {
    await ctx.editMessageText(
        `📖 *Crypto Wallet Pro - Помощь*\n\n` +
        `*Основные функции:*\n` +
        `• 💰 *Баланс:* Начальный депозит 50,000 RUB\n` +
        `• 📈 *Торговля:* Покупка/продажа криптовалют\n` +
        `• 💼 *Портфель:* Отслеживание инвестиций\n` +
        `• 🔔 *Уведомления:* Ценовые оповещения\n` +
        `• 📊 *Аналитика:* Графики и прогнозы\n\n` +
        `*Доступные криптовалюты:*\n` +
        `₿ Bitcoin, Ξ Ethereum, 💎 TON, 🔵 Solana и другие\n\n` +
        `_Для начала работы откройте кошелек_ 👇`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📱 Открыть Кошелек', web_app: { url: `${BASE_URL}/index.html` } }],
                    [{ text: '⬅️ Назад', callback_data: 'back_to_start' }]
                ]
            }
        }
    );
});

// Портфель пользователя
bot.action('portfolio', async (ctx) => {
    await ctx.editMessageText(
        `💼 *Ваш инвестиционный портфель*\n\n` +
        `*Общий баланс:* 50,000 RUB\n` +
        `*Доступно:* 25,340 RUB\n` +
        `*В инвестициях:* 24,660 RUB\n\n` +
        `*Ваши активы:*\n` +
        `• ₿ Bitcoin: 0.001 BTC (8,460 RUB)\n` +
        `• Ξ Ethereum: 0.1 ETH (3,250 RUB)\n` +
        `• 💎 TON: 5 TON (32 RUB)\n` +
        `• 💵 USDT: 100 USDT (9,990 RUB)\n\n` +
        `📈 *Доходность за сегодня:* +2.3% (+1,150 RUB)`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📱 Детали в Кошельке', web_app: { url: `${BASE_URL}/index.html` } }],
                    [{ text: '⬅️ Назад', callback_data: 'back_to_start' }]
                ]
            }
        }
    );
});

// Премиум функции
bot.action('premium', async (ctx) => {
    await ctx.editMessageText(
        `💎 *Crypto Wallet Pro Premium*\n\n` +
        `*Премиум функции:*\n` +
        `✅ Расширенная аналитика\n` +
        `✅ Приоритетная поддержка\n` +
        `✅ Эксклюзивные торговые сигналы\n` +
        `✅ Пониженные комиссии\n` +
        `✅ Неограниченные операции\n\n` +
        `*Стоимость:* 999 RUB/месяц\n\n` +
        `_Станьте профессиональным трейдером уже сегодня!_`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💳 Активировать Premium', callback_data: 'activate_premium' }],
                    [{ text: '⬅️ Назад', callback_data: 'back_to_start' }]
                ]
            }
        }
    );
});

// Образовательный раздел
bot.action('education', async (ctx) => {
    await ctx.editMessageText(
        `📚 *Образовательный Центр*\n\n` +
        `*Бесплатные курсы:*\n` +
        `🎓 Основы криптовалют\n` +
        `📊 Технический анализ\n` +
        `💼 Управление портфелем\n` +
        `🔐 Безопасность в crypto\n\n` +
        `*Торговые стратегии:*\n` +
        `📈 Scalping для начинающих\n` +
        `🔄 Swing trading\n` +
        `🎯 Долгосрочные инвестиции\n\n` +
        `_Обучение доступно в приложении_ 👇`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📱 Учиться в Приложении', web_app: { url: `${BASE_URL}/index.html` } }],
                    [{ text: '⬅️ Назад', callback_data: 'back_to_start' }]
                ]
            }
        }
    );
});

// Поддержка
bot.action('support', async (ctx) => {
    await ctx.editMessageText(
        `🛟 *Служба поддержки*\n\n` +
        `*Мы всегда на связи!*\n\n` +
        `📞 *Техническая поддержка:*\n` +
        `• Чат в приложении\n` +
        `• Email: support@cryptowallet.ru\n` +
        `• Ответ в течение 5 минут\n\n` +
        `🔐 *Безопасность:*\n` +
        `• Все транзакции защищены\n` +
        `• Двухфакторная аутентификация\n` +
        `• Холодное хранение активов\n\n` +
        `_Ваши средства в безопасности_ 🔒`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💬 Написать в Поддержку', url: 'https://t.me/crypto_support' }],
                    [{ text: '⬅️ Назад', callback_data: 'back_to_start' }]
                ]
            }
        }
    );
});

// Назад к началу
bot.action('back_to_start', async (ctx) => {
    await ctx.deleteMessage();
    await ctx.telegram.sendMessage(
        ctx.chat.id,
        `🎯 *Crypto Wallet Pro*\n\nВыберите действие:`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🚀 Открыть Кошелек', web_app: { url: `${BASE_URL}/index.html` } }],
                    [
                        { text: '📊 Мой Портфель', callback_data: 'portfolio' },
                        { text: '💎 Премиум', callback_data: 'premium' }
                    ],
                    [
                        { text: '📚 Обучение', callback_data: 'education' },
                        { text: '🛟 Поддержка', callback_data: 'support' }
                    ]
                ]
            }
        }
    );
});

// Активация премиума
bot.action('activate_premium', async (ctx) => {
    await ctx.answerCbQuery('💎 Премиум активирован на 30 дней!');
    await ctx.editMessageText(
        `💎 *Premium активирован!*\n\n` +
        `✅ Теперь у вас есть доступ ко всем премиум функциям:\n\n` +
        `• 📊 Расширенная аналитика\n` +
        `• 🚀 Приоритетная поддержка\n` +
        `• 📈 Эксклюзивные сигналы\n` +
        `• 💰 Пониженные комиссии\n\n` +
        `_Срок действия: 30 дней_\n` +
        `_Следующее списание: через 30 дней_`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📱 Использовать Премиум', web_app: { url: `${BASE_URL}/index.html` } }],
                    [{ text: '⬅️ Назад', callback_data: 'premium' }]
                ]
            }
        }
    );
});

// Обработка ошибок
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
});

// Webhook для Vercel
export default async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).json({ status: 'success' });
        } catch (error) {
            console.error('Error handling update:', error);
            res.status(500).json({ status: 'error', error: error.message });
        }
    } else {
        res.status(200).json({ 
            status: 'running', 
            message: 'Crypto Wallet Pro Bot is online!',
            version: '2.0.0'
        });
    }
};
