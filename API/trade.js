const users = new Map();

// Реалистичные данные криптовалют
const cryptoData = {
    bitcoin: { 
        price: 84608.49, 
        change: 0.27, 
        symbol: 'BTC', 
        name: 'Bitcoin',
        volume: 28500000000,
        marketCap: 1650000000000
    },
    ethereum: { 
        price: 3250.42, 
        change: 1.85, 
        symbol: 'ETH', 
        name: 'Ethereum',
        volume: 15200000000,
        marketCap: 390000000000
    },
    tether: { 
        price: 0.999, 
        change: 0.03, 
        symbol: 'USDT', 
        name: 'Tether',
        volume: 48500000000,
        marketCap: 95000000000
    },
    toncoin: { 
        price: 6.52, 
        change: 2.30, 
        symbol: 'TON', 
        name: 'Toncoin',
        volume: 280000000,
        marketCap: 11200000000
    },
    solana: { 
        price: 126.27, 
        change: -1.01, 
        symbol: 'SOL', 
        name: 'Solana',
        volume: 3200000000,
        marketCap: 55000000000
    },
    ripple: { 
        price: 0.573, 
        change: -0.45, 
        symbol: 'XRP', 
        name: 'Ripple',
        volume: 1500000000,
        marketCap: 31000000000
    },
    cardano: { 
        price: 0.452, 
        change: 1.22, 
        symbol: 'ADA', 
        name: 'Cardano',
        volume: 450000000,
        marketCap: 16000000000
    }
};

const USD_TO_RUB = 90;

// Инициализация пользователя
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
            transactionHistory: [],
            createdAt: new Date().toISOString()
        });
    }
    return users.get(userId);
}

// Реалистичное обновление цен
function updatePrices() {
    for (const [crypto, data] of Object.entries(cryptoData)) {
        // Более реалистичная волатильность
        let volatility;
        switch(crypto) {
            case 'bitcoin':
                volatility = 0.8;
                break;
            case 'ethereum':
                volatility = 1.2;
                break;
            case 'tether':
                volatility = 0.05;
                break;
            default:
                volatility = 1.5;
        }
        
        const randomChange = (Math.random() - 0.5) * 2 * volatility;
        const newPrice = data.price * (1 + randomChange / 100);
        
        // Ограничения на минимальную цену
        if (newPrice > 0.001) {
            cryptoData[crypto].price = newPrice;
            cryptoData[crypto].change = randomChange;
        }
        
        // Особые правила для стейблкоинов
        if (crypto === 'tether') {
            cryptoData[crypto].price = 0.999 + (Math.random() - 0.5) * 0.002;
            cryptoData[crypto].change = (Math.random() - 0.5) * 0.1;
        }
    }
}

// Обновляем цены каждые 30 секунд
setInterval(updatePrices, 30000);

// Основной обработчик API
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Получение данных о рынке
            const pricesInRub = {};
            for (const [key, value] of Object.entries(cryptoData)) {
                pricesInRub[key] = {
                    ...value,
                    price: value.price * USD_TO_RUB,
                    priceUSD: value.price
                };
            }
            
            return res.json({
                success: true,
                marketData: pricesInRub,
                timestamp: new Date().toISOString()
            });
        }

        if (req.method === 'POST') {
            const { action, userId, crypto, amount } = req.body;
            
            if (!action) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Action is required' 
                });
            }

            const user = initUser(userId || 'demo');
            
            if (action === 'get_data') {
                const pricesInRub = {};
                for (const [key, value] of Object.entries(cryptoData)) {
                    pricesInRub[key] = {
                        ...value,
                        price: value.price * USD_TO_RUB,
                        priceUSD: value.price
                    };
                }
                
                return res.json({
                    success: true,
                    user: {
                        balance: user.balance,
                        portfolio: user.portfolio,
                        totalValue: calculateTotalValue(user, pricesInRub)
                    },
                    prices: pricesInRub,
                    timestamp: new Date().toISOString()
                });
            }

            if (action === 'buy') {
                if (!crypto || !amount) {
                    return res.json({ 
                        success: false, 
                        error: 'Crypto and amount are required' 
                    });
                }

                if (!cryptoData[crypto]) {
                    return res.json({ 
                        success: false, 
                        error: 'Invalid cryptocurrency' 
                    });
                }

                if (amount <= 0) {
                    return res.json({ 
                        success: false, 
                        error: 'Amount must be positive' 
                    });
                }

                const price = cryptoData[crypto].price * USD_TO_RUB;
                const cost = price * amount;
                
                if (cost > user.balance) {
                    return res.json({ 
                        success: false, 
                        error: 'Insufficient funds' 
                    });
                }
                
                // Выполнение покупки
                user.balance -= cost;
                user.portfolio[crypto] = (user.portfolio[crypto] || 0) + amount;
                
                // Добавление в историю
                user.transactionHistory.push({
                    type: 'buy',
                    crypto,
                    amount,
                    price: price,
                    total: cost,
                    timestamp: new Date().toISOString()
                });
                
                return res.json({ 
                    success: true, 
                    newBalance: user.balance,
                    newPortfolio: user.portfolio,
                    transaction: {
                        type: 'buy',
                        crypto,
                        amount,
                        price: price,
                        total: cost
                    }
                });
            }

            if (action === 'sell') {
                if (!crypto || !amount) {
                    return res.json({ 
                        success: false, 
                        error: 'Crypto and amount are required' 
                    });
                }

                if (amount <= 0) {
                    return res.json({ 
                        success: false, 
                        error: 'Amount must be positive' 
                    });
                }

                const currentAmount = user.portfolio[crypto] || 0;
                
                if (currentAmount < amount) {
                    return res.json({ 
                        success: false, 
                        error: 'Insufficient assets' 
                    });
                }
                
                const price = cryptoData[crypto].price * USD_TO_RUB;
                const revenue = price * amount;
                
                // Выполнение продажи
                user.balance += revenue;
                user.portfolio[crypto] = currentAmount - amount;
                
                // Добавление в историю
                user.transactionHistory.push({
                    type: 'sell',
                    crypto,
                    amount,
                    price: price,
                    total: revenue,
                    timestamp: new Date().toISOString()
                });
                
                return res.json({ 
                    success: true, 
                    newBalance: user.balance,
                    newPortfolio: user.portfolio,
                    transaction: {
                        type: 'sell',
                        crypto,
                        amount,
                        price: price,
                        total: revenue
                    }
                });
            }

            return res.status(400).json({ 
                success: false, 
                error: 'Unknown action' 
            });
        }

        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });

    } catch (error) {
        console.error('Trade API error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Вспомогательные функции
function calculateTotalValue(user, prices) {
    let total = user.balance;
    for (const [crypto, amount] of Object.entries(user.portfolio)) {
        if (amount > 0 && prices[crypto]) {
            total += prices[crypto].price * amount;
        }
    }
    return total;
        }
