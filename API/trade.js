const users = new Map();

// Данные криптовалют
const cryptoPrices = {
    bitcoin: { price: 84608.49, change: 0.27, symbol: 'BTC', name: 'Bitcoin' },
    ethereum: { price: 3250.42, change: 1.85, symbol: 'ETH', name: 'Ethereum' },
    tether: { price: 0.999, change: 0.03, symbol: 'USDT', name: 'Tether' },
    toncoin: { price: 6.52, change: 2.30, symbol: 'TON', name: 'Toncoin' },
    solana: { price: 126.27, change: -1.01, symbol: 'SOL', name: 'Solana' },
    ripple: { price: 0.573, change: -0.45, symbol: 'XRP', name: 'Ripple' },
    cardano: { price: 0.452, change: 1.22, symbol: 'ADA', name: 'Cardano' }
};

const USD_TO_RUB = 90;

function initUser(userId) {
    if (!users.has(userId)) {
        users.set(userId, {
            balance: 50000,
            portfolio: {
                bitcoin: 0.001,
                ethereum: 0.1,
                tether: 100,
                toncoin: 5
            },
            transactionHistory: []
        });
    }
    return users.get(userId);
}

// Функция обновления цен
function updatePrices() {
    for (const crypto in cryptoPrices) {
        const randomChange = (Math.random() - 0.5) * 2;
        cryptoPrices[crypto].price *= (1 + randomChange / 100);
        cryptoPrices[crypto].change = randomChange;
        
        if (crypto === 'tether') {
            cryptoPrices[crypto].price = 0.999 + (Math.random() - 0.5) * 0.002;
            cryptoPrices[crypto].change = (Math.random() - 0.5) * 0.1;
        }
    }
}

// Обновляем цены каждые 30 секунд
setInterval(updatePrices, 30000);

module.exports = async (req, res) => {
    // Добавляем CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action, userId, crypto, amount } = req.body;
        const user = initUser(userId || 'demo');
        
        if (action === 'get_data') {
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
                    balance: user.balance,
                    portfolio: user.portfolio
                },
                prices: pricesInRub
            });
        }

        if (action === 'buy') {
            const price = cryptoPrices[crypto].price * USD_TO_RUB;
            const cost = price * amount;
            
            if (cost > user.balance) {
                return res.json({ 
                    success: false, 
                    error: 'Недостаточно средств' 
                });
            }
            
            user.balance -= cost;
            user.portfolio[crypto] = (user.portfolio[crypto] || 0) + amount;
            
            return res.json({ 
                success: true, 
                newBalance: user.balance,
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
            
            const price = cryptoPrices[crypto].price * USD_TO_RUB;
            const revenue = price * amount;
            
            user.balance += revenue;
            user.portfolio[crypto] = currentAmount - amount;
            
            return res.json({ 
                success: true, 
                newBalance: user.balance,
                newPortfolio: user.portfolio
            });
        }

        return res.json({ success: false, error: 'Неизвестное действие' });

    } catch (error) {
        console.error('Trade error:', error);
        return res.json({ success: false, error: 'Ошибка сервера' });
    }
};
