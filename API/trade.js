const users = new Map();

const cryptoData = {
    tether: { 
        price: 99.90, 
        change: 0.03, 
        symbol: 'USDT', 
        name: 'Tether',
        color: '#26A17B'
    },
    toncoin: { 
        price: 652.30, 
        change: 2.30, 
        symbol: 'TON', 
        name: 'Toncoin',
        color: '#0088CC'
    },
    solana: { 
        price: 12627.40, 
        change: -1.01, 
        symbol: 'SOL', 
        name: 'Solana',
        color: '#00FFBD'
    },
    tron: { 
        price: 11.25, 
        change: 0.45, 
        symbol: 'TRX', 
        name: 'TRON',
        color: '#FF060A'
    },
    gram: { 
        price: 3.45, 
        change: 1.22, 
        symbol: 'GRAM', 
        name: 'Gram',
        color: '#36B8F4'
    },
    bitcoin: { 
        price: 846084.90, 
        change: 0.27, 
        symbol: 'BTC', 
        name: 'Bitcoin',
        color: '#F7931A'
    },
    ethereum: { 
        price: 32504.20, 
        change: 1.85, 
        symbol: 'ETH', 
        name: 'Ethereum',
        color: '#627EEA'
    },
    notcoin: { 
        price: 0.85, 
        change: 5.50, 
        symbol: 'NOT', 
        name: 'Notcoin',
        color: '#FF6B00'
    }
};

function initUser(userId) {
    if (!users.has(userId)) {
        users.set(userId, {
            balance: 50000,
            portfolio: {
                tether: 1500,
                toncoin: 25.5,
                bitcoin: 0.0012,
                ethereum: 0.085
            },
            transactionHistory: [],
            createdAt: new Date().toISOString()
        });
    }
    return users.get(userId);
}

function updatePrices() {
    for (const crypto in cryptoData) {
        const volatility = crypto === 'tether' ? 0.1 : 
                          crypto === 'bitcoin' ? 2.0 : 3.5;
        
        const randomChange = (Math.random() - 0.5) * volatility;
        const newPrice = cryptoData[crypto].price * (1 + randomChange / 100);
        
        cryptoData[crypto].price = Math.max(newPrice, 0.01);
        cryptoData[crypto].change = randomChange;
        
        if (crypto === 'tether') {
            cryptoData[crypto].price = 99.90 + (Math.random() - 0.5) * 0.2;
            cryptoData[crypto].change = (Math.random() - 0.5) * 0.1;
        }
    }
}

setInterval(updatePrices, 30000);

module.exports = async (req, res) => {
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
            return res.json({
                success: true,
                user: {
                    balance: user.balance,
                    portfolio: user.portfolio,
                    totalValue: calculateTotalValue(user, cryptoData)
                },
                prices: cryptoData,
                timestamp: new Date().toISOString()
            });
        }

        if (action === 'buy') {
            const price = cryptoData[crypto].price;
            const cost = price * amount;
            
            if (cost > user.balance) {
                return res.json({ 
                    success: false, 
                    error: 'Недостаточно средств на балансе' 
                });
            }
            
            if (amount <= 0) {
                return res.json({ 
                    success: false, 
                    error: 'Некорректная сумма' 
                });
            }
            
            user.balance -= cost;
            user.portfolio[crypto] = (user.portfolio[crypto] || 0) + amount;
            
            user.transactionHistory.push({
                type: 'buy',
                crypto: crypto,
                amount: amount,
                price: price,
                total: cost,
                timestamp: new Date().toISOString()
            });
            
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
                    error: 'Недостаточно активов для продажи' 
                });
            }
            
            if (amount <= 0) {
                return res.json({ 
                    success: false, 
                    error: 'Некорректная сумма' 
                });
            }
            
            const price = cryptoData[crypto].price;
            const revenue = price * amount;
            
            user.balance += revenue;
            user.portfolio[crypto] = currentAmount - amount;
            
            user.transactionHistory.push({
                type: 'sell',
                crypto: crypto,
                amount: amount,
                price: price,
                total: revenue,
                timestamp: new Date().toISOString()
            });
            
            return res.json({ 
                success: true, 
                newBalance: user.balance,
                newPortfolio: user.portfolio
            });
        }

        return res.json({ success: false, error: 'Неизвестное действие' });

    } catch (error) {
        console.error('Trade error:', error);
        return res.json({ success: false, error: 'Внутренняя ошибка сервера' });
    }
};

function calculateTotalValue(user, prices) {
    let total = user.balance;
    for (const [crypto, amount] of Object.entries(user.portfolio)) {
        if (amount > 0 && prices[crypto]) {
            total += prices[crypto].price * amount;
        }
    }
    return total;
                            }
