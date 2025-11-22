const users = new Map();
const cryptoPrices = {
    bitcoin: { price: 45000, change: 2.5, symbol: 'BTC', name: 'Bitcoin' },
    ethereum: { price: 2500, change: 1.8, symbol: 'ETH', name: 'Ethereum' },
    solana: { price: 120, change: 5.2, symbol: 'SOL', name: 'Solana' },
    cardano: { price: 0.6, change: -1.2, symbol: 'ADA', name: 'Cardano' },
    dogecoin: { price: 0.15, change: 3.7, symbol: 'DOGE', name: 'Dogecoin' }
};

function initUser(userId) {
    if (!users.has(userId)) {
        users.set(userId, {
            balance: 10000,
            portfolio: {},
            transactionHistory: []
        });
    }
    return users.get(userId);
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, userId, crypto, amount, orderType } = req.body;

    try {
        const user = initUser(userId);
        
        if (action === 'get_data') {
            return res.json({
                success: true,
                user: {
                    balance: user.balance,
                    portfolio: user.portfolio
                },
                prices: cryptoPrices
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
                newBalance: user.balance,
                newPortfolio: user.portfolio
            });
        }

        if (action === 'get_prices') {
            return res.json({
                success: true,
                prices: cryptoPrices
            });
        }

        return res.json({ success: false, error: 'Неизвестное действие' });

    } catch (error) {
        console.error('Trade error:', error);
        return res.json({ success: false, error: 'Ошибка сервера' });
    }
};
