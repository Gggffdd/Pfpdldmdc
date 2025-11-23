class CryptoWallet {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.userData = null;
        this.hideZeroBalances = false;
        this.selectedCrypto = null;
        this.currentPrices = {};
        
        this.cryptoAssets = [
            { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
            { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
            { id: 'tether', name: 'Tether', symbol: 'USDT', color: '#26A17B' },
            { id: 'toncoin', name: 'Toncoin', symbol: 'TON', color: '#0088CC' },
            { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#00FFBD' },
            { id: 'ripple', name: 'Ripple', symbol: 'XRP', color: '#23292F' },
            { id: 'cardano', name: 'Cardano', symbol: 'ADA', color: '#0033AD' }
        ];
        
        this.init();
    }

    init() {
        this.tg.expand();
        this.tg.BackButton.hide();
        this.updateUserInfo();
        this.loadData();
        setInterval(() => this.loadData(), 10000);
        
        // Инициализация обработчиков событий
        this.initEventListeners();
    }

    initEventListeners() {
        // Обработчики для input полей
        document.getElementById('buyAmount')?.addEventListener('input', (e) => this.calculateBuyTotal(e.target.value));
        document.getElementById('sellAmount')?.addEventListener('input', (e) => this.calculateSellTotal(e.target.value));
    }

    updateUserInfo() {
        const user = this.tg.initDataUnsafe.user;
        const avatar = document.getElementById('userAvatar');
        const name = document.getElementById('userName');
        
        let displayName = 'Трейдер';
        let avatarText = 'T';
        
        if (user) {
            if (user.first_name) {
                displayName = user.first_name;
                avatarText = user.first_name.charAt(0).toUpperCase();
            }
            if (user.username) {
                displayName = user.username;
                avatarText = user.username.charAt(0).toUpperCase();
            }
        }
        
        if (avatar) avatar.textContent = avatarText;
        if (name) name.textContent = displayName;
    }

    async loadData() {
        try {
            const response = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_data',
                    userId: this.tg.initDataUnsafe.user?.id || 'demo'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.userData = data.user;
                this.currentPrices = data.prices;
                this.updateUI(data.user, data.prices);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Ошибка загрузки данных');
        }
    }

    updateUI(user, prices) {
        this.updateBalanceStats(user, prices);
        this.updateMarkets(prices);
        this.updateAssets(user, prices);
    }

    updateBalanceStats(user, prices) {
        const totalElement = document.getElementById('totalBalance');
        const availableElement = document.getElementById('availableBalance');
        const investedElement = document.getElementById('investedBalance');

        if (!totalElement || !availableElement || !investedElement) return;

        const totalBalance = user.balance || 0;
        let investedBalance = 0;
        
        if (user.portfolio) {
            for (const [crypto, amount] of Object.entries(user.portfolio)) {
                if (amount > 0 && prices[crypto]) {
                    investedBalance += prices[crypto].price * amount;
                }
            }
        }
        
        const availableBalance = totalBalance - investedBalance;
        
        totalElement.textContent = `${this.formatCurrency(totalBalance)} ₽`;
        availableElement.textContent = `${this.formatCurrency(availableBalance)} ₽`;
        investedElement.textContent = `${this.formatCurrency(investedBalance)} ₽`;
    }

    updateMarkets(prices) {
        const marketsGrid = document.getElementById('marketsGrid');
        if (!marketsGrid) return;

        const topMarkets = ['bitcoin', 'ethereum', 'solana', 'toncoin'];
        marketsGrid.innerHTML = '';

        topMarkets.forEach(cryptoId => {
            const crypto = prices[cryptoId];
            if (!crypto) return;

            const marketCard = document.createElement('div');
            marketCard.className = 'market-card';
            marketCard.onclick = () => this.showMarketDetail(cryptoId);

            marketCard.innerHTML = `
                <div class="market-header">
                    <div class="market-icon" style="background: ${crypto.color};">
                        ${crypto.symbol.charAt(0)}
                    </div>
                    <div class="market-name">${crypto.symbol}/RUB</div>
                </div>
                <div class="market-price">${this.formatCurrency(crypto.price)} ₽</div>
                <div class="market-change ${crypto.change >= 0 ? 'change-positive' : 'change-negative'}">
                    ${crypto.change >= 0 ? '+' : ''}${crypto.change.toFixed(2)}%
                </div>
            `;

            marketsGrid.appendChild(marketCard);
        });
    }

    updateAssets(user, prices) {
        const assetsList = document.getElementById('assetsList');
        if (!assetsList) return;

        assetsList.innerHTML = '';
        let hasVisibleAssets = false;

        this.cryptoAssets.forEach(asset => {
            const cryptoData = prices[asset.id];
            if (!cryptoData) return;

            const amount = (user.portfolio && user.portfolio[asset.id]) || 0;
            const value = cryptoData.price * amount;

            if (this.hideZeroBalances && amount === 0) return;

            hasVisibleAssets = true;

            const assetItem = document.createElement('div');
            assetItem.className = 'asset-item';
            assetItem.onclick = () => this.showAssetDetail(asset.id);

            assetItem.innerHTML = `
                <div class="asset-left">
                    <div class="asset-icon" style="background: ${asset.color};">
                        ${asset.symbol}
                    </div>
                    <div class="asset-info">
                        <div class="asset-name">${asset.name}</div>
                        <div class="asset-symbol">${asset.symbol}</div>
                        <div class="asset-price">
                            ${this.formatCurrency(cryptoData.price)} ₽
                            <span class="${cryptoData.change >= 0 ? 'change-positive' : 'change-negative'}" style="font-size: 0.7em;">
                                ${cryptoData.change >= 0 ? '+' : ''}${cryptoData.change.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>
                <div class="asset-right">
                    <div class="asset-amount">${amount.toFixed(4)} ${asset.symbol}</div>
                    <div class="asset-value">${this.formatCurrency(value)} ₽</div>
                </div>
            `;

            assetsList.appendChild(assetItem);
        });

        if (!hasVisibleAssets) {
            assetsList.innerHTML = `
                <div class="text-center" style="padding: 40px 20px; color: #888;">
                    <div style="margin-bottom: 16px;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                        </svg>
                    </div>
                    <div style="margin-bottom: 8px;">Активы отсутствуют</div>
                    <div style="font-size: 0.9em;">Начните с покупки криптовалюты</div>
                </div>
            `;
        }
    }

    // Modal Functions
    showBuyModal() {
        this.selectedCrypto = 'bitcoin';
        this.createCryptoSelector('buyCryptoSelector', 'buy');
        this.updateBuyPrice();
        document.getElementById('buyModal').style.display = 'flex';
    }

    showSellModal() {
        this.selectedCrypto = this.getFirstAvailableCrypto();
        this.createCryptoSelector('sellCryptoSelector', 'sell');
        this.updateSellPrice();
        document.getElementById('sellModal').style.display = 'flex';
    }

    createCryptoSelector(containerId, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        const availableCryptos = type === 'sell' ? 
            this.cryptoAssets.filter(asset => (this.userData?.portfolio[asset.id] || 0) > 0) :
            this.cryptoAssets;

        availableCryptos.forEach(asset => {
            const cryptoData = this.currentPrices[asset.id];
            if (!cryptoData) return;

            const option = document.createElement('div');
            option.className = `crypto-option ${this.selectedCrypto === asset.id ? 'selected' : ''}`;
            option.onclick = () => this.selectCrypto(asset.id, type);

            option.innerHTML = `
                <div class="crypto-icon" style="background: ${asset.color};">
                    ${asset.symbol}
                </div>
                <div class="crypto-symbol">${asset.symbol}</div>
                <div class="crypto-name">${asset.name}</div>
            `;

            container.appendChild(option);
        });
    }

    selectCrypto(cryptoId, type) {
        this.selectedCrypto = cryptoId;
        this.createCryptoSelector(type === 'buy' ? 'buyCryptoSelector' : 'sellCryptoSelector', type);
        
        if (type === 'buy') {
            this.updateBuyPrice();
        } else {
            this.updateSellPrice();
        }
    }

    updateBuyPrice() {
        if (!this.selectedCrypto || !this.currentPrices[this.selectedCrypto]) return;
        
        const price = this.currentPrices[this.selectedCrypto].price;
        document.getElementById('buyPrice').textContent = `${this.formatCurrency(price)} ₽`;
        document.getElementById('buyCurrency').textContent = this.getSymbol(this.selectedCrypto);
        this.calculateBuyTotal(document.getElementById('buyAmount').value);
    }

    updateSellPrice() {
        if (!this.selectedCrypto || !this.currentPrices[this.selectedCrypto]) return;
        
        const price = this.currentPrices[this.selectedCrypto].price;
        document.getElementById('sellPrice').textContent = `${this.formatCurrency(price)} ₽`;
        document.getElementById('sellCurrency').textContent = this.getSymbol(this.selectedCrypto);
        this.calculateSellTotal(document.getElementById('sellAmount').value);
    }

    calculateBuyTotal(amount) {
        if (!this.selectedCrypto || !this.currentPrices[this.selectedCrypto]) return;
        
        const price = this.currentPrices[this.selectedCrypto].price;
        const total = price * (parseFloat(amount) || 0);
        const fee = total * 0.001; // 0.1% комиссия
        const finalTotal = total + fee;
        
        document.getElementById('buyTotal').textContent = `${this.formatCurrency(finalTotal)} ₽`;
    }

    calculateSellTotal(amount) {
        if (!this.selectedCrypto || !this.currentPrices[this.selectedCrypto]) return;
        
        const price = this.currentPrices[this.selectedCrypto].price;
        const total = price * (parseFloat(amount) || 0);
        const fee = total * 0.001; // 0.1% комиссия
        const finalTotal = total - fee;
        
        document.getElementById('sellTotal').textContent = `${this.formatCurrency(finalTotal)} ₽`;
    }

    async executeBuy() {
        const amount = parseFloat(document.getElementById('buyAmount').value);
        
        if (!this.selectedCrypto) {
            this.showError('Выберите криптовалюту');
            return;
        }
        
        if (!amount || amount <= 0) {
            this.showError('Введите корректную сумму');
            return;
        }

        try {
            const response = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'buy',
                    userId: this.tg.initDataUnsafe.user?.id || 'demo',
                    crypto: this.selectedCrypto,
                    amount: amount
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Покупка выполнена успешно');
                this.closeModal('buyModal');
                this.loadData();
            } else {
                this.showError(data.error || 'Ошибка при покупке');
            }
        } catch (error) {
            console.error('Buy error:', error);
            this.showError('Ошибка сети');
        }
    }

    async executeSell() {
        const amount = parseFloat(document.getElementById('sellAmount').value);
        
        if (!this.selectedCrypto) {
            this.showError('Выберите криптовалюту');
            return;
        }
        
        if (!amount || amount <= 0) {
            this.showError('Введите корректную сумму');
            return;
        }

        try {
            const response = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'sell',
                    userId: this.tg.initDataUnsafe.user?.id || 'demo',
                    crypto: this.selectedCrypto,
                    amount: amount
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Продажа выполнена успешно');
                this.closeModal('sellModal');
                this.loadData();
            } else {
                this.showError(data.error || 'Ошибка при продаже');
            }
        } catch (error) {
            console.error('Sell error:', error);
            this.showError('Ошибка сети');
        }
    }

    // Utility Functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU').format(amount.toFixed(2));
    }

    getSymbol(cryptoId) {
        const asset = this.cryptoAssets.find(a => a.id === cryptoId);
        return asset ? asset.symbol : '???';
    }

    getFirstAvailableCrypto() {
        if (!this.userData?.portfolio) return 'bitcoin';
        
        for (const [crypto, amount] of Object.entries(this.userData.portfolio)) {
            if (amount > 0) return crypto;
        }
        return 'bitcoin';
    }

    showError(message) {
        this.tg.showPopup({
            title: 'Ошибка',
            message: message,
            buttons: [{ type: 'ok' }]
        });
    }

    showSuccess(message) {
        this.tg.showPopup({
            title: 'Успех',
            message: message,
            buttons: [{ type: 'ok' }]
        });
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        this.selectedCrypto = null;
        
        // Сброс input полей
        const buyAmount = document.getElementById('buyAmount');
        const sellAmount = document.getElementById('sellAmount');
        if (buyAmount) buyAmount.value = '';
        if (sellAmount) sellAmount.value = '';
    }

    // Other Modal Functions
    showTransferModal() {
        this.tg.showPopup({
            title: 'Перевод средств',
            message: 'Функция перевода будет доступна в следующем обновлении',
            buttons: [{ type: 'ok' }]
        });
    }

    showExchangeModal() {
        this.tg.showPopup({
            title: 'Обмен валют',
            message: 'Функция обмена будет доступна в следующем обновлении',
            buttons: [{ type: 'ok' }]
        });
    }

    showMarketDetail(marketId) {
        const crypto = this.currentPrices[marketId];
        if (!crypto) return;
        
        this.tg.showPopup({
            title: `${crypto.name} (${crypto.symbol})`,
            message: `Текущая цена: ${this.formatCurrency(crypto.price)} ₽\nИзменение: ${crypto.change >= 0 ? '+' : ''}${crypto.change.toFixed(2)}%`,
            buttons: [{ type: 'ok' }]
        });
    }

    showAssetDetail(assetId) {
        const crypto = this.currentPrices[assetId];
        const amount = this.userData?.portfolio[assetId] || 0;
        const value = crypto ? crypto.price * amount : 0;
        
        this.tg.showPopup({
            title: 'Детали актива',
            message: `Количество: ${amount.toFixed(4)} ${crypto.symbol}\nТекущая стоимость: ${this.formatCurrency(value)} ₽\nЦена за единицу: ${this.formatCurrency(crypto.price)} ₽`,
            buttons: [{ type: 'ok' }]
        });
    }

    showAllMarkets() {
        this.tg.showPopup({
            title: 'Все рынки',
            message: 'Полный список торговых пар будет доступен в следующем обновлении',
            buttons: [{ type: 'ok' }]
        });
    }

    showPortfolioHistory() {
        this.tg.showPopup({
            title: 'История операций',
            message: 'История транзакций будет доступна в следующем обновлении',
            buttons: [{ type: 'ok' }]
        });
    }

    showNotifications() {
        this.tg.showPopup({
            title: 'Уведомления',
            message: 'Новых уведомлений нет',
            buttons: [{ type: 'ok' }]
        });
    }

    showSecurity() {
        this.tg.showPopup({
            title: 'Безопасность',
            message: 'Все системы безопасности активны. Ваши средства защищены.',
            buttons: [{ type: 'ok' }]
        });
    }

    toggleZeroBalances() {
        this.hideZeroBalances = !this.hideZeroBalances;
        const toggleBtn = document.getElementById('zeroBalanceToggle');
        
        if (toggleBtn) {
            toggleBtn.textContent = this.hideZeroBalances ? 'Показать все' : 'Скрыть нули';
        }
        
        if (this.userData) {
            this.updateAssets(this.userData, this.currentPrices);
        }
    }

    toggleBalanceVisibility() {
        const balanceElement = document.getElementById('totalBalance');
        if (balanceElement.textContent.includes('*')) {
            this.updateBalanceStats(this.userData, this.currentPrices);
        } else {
            balanceElement.textContent = '****** ₽';
        }
    }
}

// Инициализация приложения
let walletApp;

document.addEventListener('DOMContentLoaded', function() {
    walletApp = new CryptoWallet();
});

// Глобальные функции для onclick атрибутов
function showBuyModal() { walletApp?.showBuyModal(); }
function showSellModal() { walletApp?.showSellModal(); }
function showTransferModal() { walletApp?.showTransferModal(); }
function showExchangeModal() { walletApp?.showExchangeModal(); }
function showAllMarkets() { walletApp?.showAllMarkets(); }
function showPortfolioHistory() { walletApp?.showPortfolioHistory(); }
function showNotifications() { walletApp?.showNotifications(); }
function showSecurity() { walletApp?.showSecurity(); }
function toggleZeroBalances() { walletApp?.toggleZeroBalances(); }
function toggleBalanceVisibility() { walletApp?.toggleBalanceVisibility(); }
function closeModal(modalId) { walletApp?.closeModal(modalId); }
function executeBuy() { walletApp?.executeBuy(); }
function executeSell() { walletApp?.executeSell(); }
