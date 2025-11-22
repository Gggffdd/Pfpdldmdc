const users = new Map();

// Обновленные цены криптовалют (в долларах)
const cryptoPrices = {
    bitcoin: { price: 84608.49, change: 0.27, symbol: 'BTC', name: 'Bitcoin' },
    ethereum: { price: 3250.42, change: 1.85, symbol: 'ETH', name: 'Ethereum' },
    tether: { price: 0.999, change: 0.03, symbol: 'USDT', name: 'Tether' },
    toncoin: { price: 6.52, change: 2.30, symbol: 'TON', name: 'Toncoin' },
    solana: { price: 126.27, change: -1.01, symbol: 'SOL', name: 'Solana' },
    ripple: { price: 0.573, change: -0.45, symbol: 'XRP', name: 'Ripple' },
    cardano: { price: 0.452, change: 1.22, symbol: 'ADA', name: 'Cardano' },
    dogecoin: { price: 0.128, change: 3.71, symbol: 'DOGE', name: 'Dogecoin' },
    polkadot: { price: 7.84, change: -0.89, symbol: 'DOT', name: 'Polkadot' },
    tron: { price: 0.118, change: 0.65, symbol: 'TRX', name: 'TRON' }
};

// Курс доллара к рублю (для конвертации)
const USD_TO_RUB = 90;

function initUser(userId) {
    if (!users.has(userId)) {
        users.set(userId, {
            balance: 10000, // Начальный баланс в долларах
            portfolio: {},
            transactionHistory: []
        });
    }
    return users.get(userId);
}

// Функция для обновления цен с случайными изменениями
function updatePrices() {
    for (const crypto in cryptoPrices) {
        const randomChange = (Math.random() - 0.5) * 4; // -2% to +2%
        cryptoPrices[crypto].price *= (1 + randomChange / 100);
        cryptoPrices[crypto].change = randomChange;
        
        // Ограничиваем минимальную цену
        if (cryptoPrices[crypto].price < 0.0001) {
            cryptoPrices[crypto].price = 0.0001;
        }
        
        // Ограничиваем изменения для стабильных монет
        if (crypto === 'tether') {
            cryptoPrices[crypto].price = 0.999 + (Math.random() - 0.5) * 0.002;
            cryptoPrices[crypto].change = (Math.random() - 0.5) * 0.1;
        }
    }
}

// Обновляем цены каждые 30 секунд
setInterval(updatePrices, 30000);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, userId, crypto, amount, orderType } = req.body;

    try {
        const user = initUser(userId);
        
        if (action === 'get_data') {
            // Конвертируем цены в рубли для отображения
            const pricesInRub = {};
            for (const [key, value] of Object.entries(cryptoPrices)) {
                pricesInRub[key] = {
                    ...value,
                    price: value.price * USD_TO_RUB
                };
            }
            
            return res.json({
                success: true,
                user: {
                    balance: user.balance * USD_TO_RUB, // Конвертируем в рубли
                    portfolio: user.portfolio
                },
                prices: pricesInRub
            });
        }

        if (action === 'buy') {
            const price = cryptoPrices[crypto].price;
            const cost = price * amount;
            
            if (cost > user.balance) {
                return res.json({ 
                    success: false, 
                    error: 'Недостаточно средств' 
                });
            }
            
            user.balance -= cost;
            user.portfolio[crypto] = (user.portfolio[crypto] || 0) + amount;
            
            user.transactionHistory.push({
                type: 'buy',
                crypto,
                amount,
                price,
                total: cost,
                timestamp: new Date().toISOString()
            });
            
            return res.json({ 
                success: true, 
                newBalance: user.balance * USD_TO_RUB,
                newPortfolio: user.portfolio
            });
        }

        if (action === 'sell') {
            const currentAmount = user.portfolio[crypto] || 0;
            
            if (currentAmount < amount) {
                return res.json({ 
                    success: false, 
                    error: 'Недостаточно активов' 
                });
            }
            
            const price = cryptoPrices[crypto].price;
            const revenue = price * amount;
            
            user.balance += revenue;
            user.portfolio[crypto] = currentAmount - amount;
            
            user.transactionHistory.push({
                type: 'sell',
                crypto,
                amount,
                price,
                total: revenue,
                timestamp: new Date().toISOString()
            });
            
            return res.json({ 
                success: true, 
                newBalance: user.balance * USD_TO_RUB,
                newPortfolio: user.portfolio
            });
        }

        return res.json({ success: false, error: 'Неизвестное действие' });

    } catch (error) {
        console.error('Trade error:', error);
        return res.json({ success: false, error: 'Ошибка сервера' });
    }
};
