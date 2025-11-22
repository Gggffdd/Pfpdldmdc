const users = new Map();

// Расширенные данные криптовалют
const cryptoPrices = {
    bitcoin: { price: 84608.49, change: 0.27, symbol: 'BTC', name: 'Bitcoin', volume: '28.5B' },
    ethereum: { price: 3250.42, change: 1.85, symbol: 'ETH', name: 'Ethereum', volume: '14.2B' },
    tether: { price: 0.999, change: 0.03, symbol: 'USDT', name: 'Tether', volume: '45.1B' },
    toncoin: { price: 6.52, change: 2.30, symbol: 'TON', name: 'Toncoin', volume: '1.2B' },
    solana: { price: 126.27, change: -1.01, symbol: 'SOL', name: 'Solana', volume: '3.8B' },
    ripple: { price: 0.573, change: -0.45, symbol: 'XRP', name: 'Ripple', volume: '2.1B' },
    cardano: { price: 0.452, change: 1.22, symbol: 'ADA', name: 'Cardano', volume: '1.5B' },
    dogecoin: { price: 0.128, change: 3.71, symbol: 'DOGE', name: 'Dogecoin', volume: '2.3B' },
    polkadot: { price: 7.84, change: -0.89, symbol: 'DOT', name: 'Polkadot', volume: '0.9B' },
    tron: { price: 0.118, change: 0.65, symbol: 'TRX', name: 'TRON', volume: '1.7B' }
};

const USD_TO_RUB = 90;

function initUser(userId) {
    if (!users.has(userId)) {
        users.set(userId, {
            balance: 50000, // Увеличенный стартовый баланс
            portfolio: {
                bitcoin: 0.001,
                ethereum: 0.1,
                tether: 100,
                toncoin: 5
            },
            transactionHistory: [],
            tier: 'VIP 1',
            joinDate: new Date().toISOString()
        });
    }
    return users.get(userId);
}

// Улучшенная функция обновления цен
function updatePrices() {
    for (const crypto in cryptoPrices) {
        // Более реалистичные изменения цен
        const volatility = crypto === 'tether' ? 0.05 : 
                          crypto === 'bitcoin' ? 1.5 : 2.5;
        
        const randomChange = (Math.random() - 0.5) * volatility;
        cryptoPrices[crypto].price *= (1 + randomChange / 100);
        cryptoPrices[crypto].change = randomChange;
        
        // Ограничения для стабильных монет
        if (crypto === 'tether') {
            cryptoPrices[crypto].price = Math.max(0.995, Math.min(1.005, cryptoPrices[crypto].price));
            cryptoPrices[crypto].change = (Math.random() - 0.5) * 0.1;
        }
    }
}

// Обновляем цены каждые 20 секунд для большей динамики
setInterval(updatePrices, 20000);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, userId, crypto, amount, orderType } = req.body;

    try {
        const user = initUser(userId);
        
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
                    balance: user.balance * USD_TO_RUB,
                    portfolio: user.portfolio,
                    tier: user.tier,
                    joinDate: user.joinDate
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
