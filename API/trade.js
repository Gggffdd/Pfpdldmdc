// In-memory хранилище (в продакшене заменить на базу данных)
const users = new Map();
const transactionHistory = new Map();

// Реальные данные криптовалют с большим списком
const cryptoData = {
    bitcoin: { 
        price: 84608.49, 
        change: 0.27, 
        symbol: 'BTC', 
        name: 'Bitcoin',
        color: '#f7931a',
        marketCap: 1650000000000,
        volume: 28500000000
    },
    ethereum: { 
        price: 3250.42, 
        change: 1.85, 
        symbol: 'ETH', 
        name: 'Ethereum',
        color: '#627eea',
        marketCap: 390000000000,
        volume: 15200000000
    },
    tether: { 
        price: 0.999, 
        change: 0.03, 
        symbol: 'USDT', 
        name: 'Tether',
        color: '#26a17b',
        marketCap: 956000000000,
        volume: 48500000000
    },
    toncoin: { 
        price: 6.52, 
        change: 2.30, 
        symbol: 'TON', 
        name: 'Toncoin',
        color: '#0088cc',
        marketCap: 22500000000,
        volume: 125000000
    },
    solana: { 
        price: 126.27, 
        change: -1.01, 
        symbol: 'SOL', 
        name: 'Solana',
        color: '#00ffbd',
        marketCap: 55000000000,
        volume: 2850000000
    },
    ripple: { 
        price: 0.573, 
        change: -0.45, 
        symbol: 'XRP', 
        name: 'Ripple',
        color: '#23292f',
        marketCap: 31000000000,
        volume: 1250000000
    },
    cardano: { 
        price: 0.452, 
        change: 1.22, 
        symbol: 'ADA', 
        name: 'Cardano',
        color: '#0033ad',
        marketCap: 16000000000,
        volume: 450000000
    },
    dogecoin: {
        price: 0.128,
        change: 3.45,
        symbol: 'DOGE',
        name: 'Dogecoin',
        color: '#c2a633',
        marketCap: 18500000000,
        volume: 1250000000
    },
    polkadot: {
        price: 6.84,
        change: -0.89,
        symbol: 'DOT',
        name: 'Polkadot',
        color: '#e6007a',
        marketCap: 8700000000,
        volume: 285000000
    }
};

const USD_TO_RUB = 90;

// Инициализация пользователя
function initUser(userId) {
    if (!users.has(userId)) {
        const userData = {
            balance: 50000,
            portfolio: {
                bitcoin: 0.001,
                ethereum: 0.1,
                tether: 100,
                toncoin: 5,
                solana: 0.5,
                ripple: 50,
                cardano: 100,
                dogecoin: 1000,
                polkadot: 10
            },
            totalInvested: 25340,
            totalProfit: 2340,
            isPremium: false,
            joinedDate: new Date().toISOString()
        };
        users.set(userId, userData);
        transactionHistory.set(userId, []);
        
        // Добавляем начальные транзакции
        addTransaction(userId, {
            id: generateId(),
            type: 'initial',
            crypto: 'system',
            amount: 50000,
            price: 1,
            total: 50000,
            timestamp: new Date().toISOString(),
            status: 'completed'
        });
    }
    return users.get(userId);
}

// Генератор ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Добавление транзакции
function addTransaction(userId, transaction) {
    if (!transactionHistory.has(userId)) {
        transactionHistory.set(userId, []);
    }
    const history = transactionHistory.get(userId);
    history.unshift(transaction);
    // Храним только последние 100 транзакций
    if (history.length > 100) {
        transactionHistory.set(userId, history.slice(0, 100));
    }
}

// Функция обновления цен с реалистичной волатильностью
function updatePrices() {
    for (const crypto in cryptoData) {
        const data = cryptoData[crypto];
        
        // Разная волатильность для разных криптовалют
        const volatility = crypto === 'tether' ? 0.02 : 
                          crypto === 'bitcoin' ? 1.5 : 
                          crypto === 'ethereum' ? 2.0 : 3.0;
        
        const randomChange = (Math.random() - 0.5) * volatility;
        data.price *= (1 + randomChange / 100);
        data.change = randomChange;
        
        // Особые условия для стейблкоинов
        if (crypto === 'tether') {
            data.price = 0.998 + (Math.random() - 0.5) * 0.004;
            data.change = (Math.random() - 0.5) * 0.05;
        }
        
        // Обновляем объем и капитализацию
        data.volume *= (1 + (Math.random() - 0.3) / 100);
        data.marketCap = data.price * (data.marketCap / data.price) * (1 + randomChange / 100);
    }
}

// Обновляем цены каждые 30 секунд
setInterval(updatePrices, 30000);

// Основной обработчик API
export default async (req, res) => {
    // Настройка CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { action, userId, crypto, amount, price, type } = req.body;
        const user = initUser(userId || 'demo');
        
        if (action === 'get_data') {
            const pricesInRub = {};
            let totalMarketCap = 0;
            
            for (const [key, value] of Object.entries(cryptoData)) {
                pricesInRub[key] = {
                    ...value,
                    price: value.price * USD_TO_RUB,
                    priceUSD: value.price
                };
                totalMarketCap += value.marketCap;
            }
            
            // Расчет общей статистики портфеля
            let portfolioValue = 0;
            let dailyProfit = 0;
            
            for (const [crypto, amount] of Object.entries(user.portfolio)) {
                if (amount > 0 && pricesInRub[crypto]) {
                    const value = pricesInRub[crypto].price * amount;
                    portfolioValue += value;
                    dailyProfit += value * (pricesInRub[crypto].change / 100);
                }
            }
            
            return res.json({
                success: true,
                user: {
                    balance: user.balance,
                    portfolio: user.portfolio,
                    totalInvested: user.totalInvested,
                    totalProfit: user.totalProfit,
                    portfolioValue: portfolioValue,
                    dailyProfit: dailyProfit,
                    isPremium: user.isPremium
                },
                prices: pricesInRub,
                marketStats: {
                    totalMarketCap: totalMarketCap,
                    totalVolume24h: 785000000000,
                    activeCryptos: Object.keys(cryptoData).length,
                    marketDominance: {
                        bitcoin: 52.8,
                        ethereum: 17.2,
                        tether: 6.1,
                        others: 23.9
                    }
                },
                transactions: transactionHistory.get(userId || 'demo') || []
            });
        }

        if (action === 'buy') {
            const cryptoData = cryptoData[crypto];
            if (!cryptoData) {
                return res.json({ 
                    success: false, 
                    error: 'Криптовалюта не найдена' 
                });
            }
            
            const priceInRub = cryptoData.price * USD_TO_RUB;
            const cost = priceInRub * amount;
            const fee = cost * 0.0025; // 0.25% комиссия
            
            if (cost + fee > user.balance) {
                return res.json({ 
                    success: false, 
                    error: `Недостаточно средств. Нужно: ${(cost + fee).toFixed(2)} RUB` 
                });
            }
            
            user.balance -= (cost + fee);
            user.portfolio[crypto] = (user.portfolio[crypto] || 0) + amount;
            user.totalInvested += cost;
            
            // Добавляем транзакцию
            addTransaction(userId, {
                id: generateId(),
                type: 'buy',
                crypto: crypto,
                amount: amount,
                price: priceInRub,
                total: cost,
                fee: fee,
                timestamp: new Date().toISOString(),
                status: 'completed'
            });
            
            return res.json({ 
                success: true, 
                newBalance: user.balance,
                newPortfolio: user.portfolio,
                transaction: {
                    cost: cost,
                    fee: fee,
                    total: cost + fee
                }
            });
        }

        if (action === 'sell') {
            const cryptoData = cryptoData[crypto];
            if (!cryptoData) {
                return res.json({ 
                    success: false, 
                    error: 'Криптовалюта не найдена' 
                });
            }
            
            const currentAmount = user.portfolio[crypto] || 0;
            
            if (currentAmount < amount) {
                return res.json({ 
                    success: false, 
                    error: `Недостаточно активов. Доступно: ${currentAmount} ${cryptoData.symbol}` 
                });
            }
            
            const priceInRub = cryptoData.price * USD_TO_RUB;
            const revenue = priceInRub * amount;
            const fee = revenue * 0.0025; // 0.25% комиссия
            
            user.balance += (revenue - fee);
            user.portfolio[crypto] = currentAmount - amount;
            user.totalProfit += (revenue - (user.totalInvested * (amount / currentAmount)));
            
            // Добавляем транзакцию
            addTransaction(userId, {
                id: generateId(),
                type: 'sell',
                crypto: crypto,
                amount: amount,
                price: priceInRub,
                total: revenue,
                fee: fee,
                profit: revenue - fee,
                timestamp: new Date().toISOString(),
                status: 'completed'
            });
            
            return res.json({ 
                success: true, 
                newBalance: user.balance,
                newPortfolio: user.portfolio,
                transaction: {
                    revenue: revenue,
                    fee: fee,
                    total: revenue - fee
                }
            });
        }

        if (action === 'get_transactions') {
            return res.json({
                success: true,
                transactions: transactionHistory.get(userId || 'demo') || []
            });
        }

        if (action === 'get_market_stats') {
            let totalMarketCap = 0;
            let totalVolume = 0;
            
            for (const crypto in cryptoData) {
                totalMarketCap += cryptoData[crypto].marketCap;
                totalVolume += cryptoData[crypto].volume;
            }
            
            return res.json({
                success: true,
                stats: {
                    totalMarketCap,
                    totalVolume,
                    activeCryptos: Object.keys(cryptoData).length,
                    marketFearIndex: Math.floor(Math.random() * 100) // Индекс страха/жадности
                }
            });
        }

        return res.json({ 
            success: false, 
            error: 'Неизвестное действие',
            availableActions: ['get_data', 'buy', 'sell', 'get_transactions', 'get_market_stats']
        });

    } catch (error) {
        console.error('Trade API error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Внутренняя ошибка сервера',
            details: error.message 
        });
    }
};
