class CryptoWallet {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.userData = null;
        this.hideZeroBalances = false;
        this.selectedCurrency = 'RUB';
        this.exchangeRates = {
            USD: 79,
            TON: 119
        };
        
        this.cryptoAssets = [
            { id: 'tether', name: 'Tether', symbol: 'USDT', color: '#26A17B', balance: 1500 },
            { id: 'toncoin', name: 'Toncoin', symbol: 'TON', color: '#0088CC', balance: 25.5 },
            { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#00FFBD', balance: 0 },
            { id: 'tron', name: 'TRON', symbol: 'TRX', color: '#FF060A', balance: 0 },
            { id: 'gram', name: 'Gram', symbol: 'GRAM', color: '#36B8F4', balance: 0 },
            { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A', balance: 0.0012 },
            { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', balance: 0.085 },
            { id: 'notcoin', name: 'Notcoin', symbol: 'NOT', color: '#FF6B00', balance: 0 }
        ];
        
        this.cryptoPrices = {
            tether: 99.90,
            toncoin: 652.30,
            solana: 12627.40,
            tron: 11.25,
            gram: 3.45,
            bitcoin: 846084.90,
            ethereum: 32504.20,
            notcoin: 0.85
        };
        
        this.init();
    }

    async init() {
        this.tg.expand();
        this.tg.BackButton.hide();
        this.tg.enableClosingConfirmation();
        
        this.updateUserInfo();
        await this.loadUserData();
        this.initEventListeners();
        this.startPriceUpdates();
    }

    initEventListeners() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.currency-dropdown')) {
                this.hideCurrencyDropdown();
            }
        });

        // Close modals on background click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    updateUserInfo() {
        const user = this.tg.initDataUnsafe.user;
        const avatar = document.getElementById('userAvatar');
        const name = document.getElementById('userName');
        
        let displayName = 'Пользователь';
        let avatarText = 'П';
        
        if (user) {
            if (user.first_name) {
                displayName = user.first_name;
                avatarText = user.first_name.charAt(0).toUpperCase();
            }
            if (user.username) {
                displayName = `@${user.username}`;
                avatarText = user.username.charAt(0).toUpperCase();
            }
        }
        
        if (avatar) avatar.textContent = avatarText;
        if (name) name.textContent = displayName;
    }

    async loadUserData() {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                this.userData = {
                    balance: 50000,
                    portfolio: {
                        tether: 1500,
                        toncoin: 25.5,
                        bitcoin: 0.0012,
                        ethereum: 0.085
                    },
                    transactionHistory: []
                };
                this.updateUI();
                resolve();
            }, 800);
        });
    }

    startPriceUpdates() {
        // Simulate real-time price updates
        setInterval(() => {
            this.simulatePriceChange();
            this.updateUI();
        }, 30000);
    }

    simulatePriceChange() {
        Object.keys(this.cryptoPrices).forEach(crypto => {
            if (crypto !== 'tether') {
                const change = (Math.random() - 0.5) * 4; // -2% to +2%
                this.cryptoPrices[crypto] *= (1 + change / 100);
                this.cryptoPrices[crypto] = Math.max(this.cryptoPrices[crypto], 0.0001);
            }
        });
    }

    updateUI() {
        this.updateBalance();
        this.updateAssets();
    }

    updateBalance() {
        const balanceElement = document.getElementById('totalBalance');
        if (!balanceElement) return;

        let balance = this.userData?.balance || 0;
        
        if (this.selectedCurrency === 'USD') {
            balance = balance / this.exchangeRates.USD;
            balanceElement.textContent = `${this.formatCurrency(balance)} $`;
        } else if (this.selectedCurrency === 'TON') {
            balance = balance / this.exchangeRates.TON;
            balanceElement.textContent = `${this.formatCurrency(balance)} TON`;
        } else {
            balanceElement.textContent = `${this.formatCurrency(balance)} ₽`;
        }
    }

    updateAssets() {
        const assetsList = document.getElementById('assetsList');
        if (!assetsList) return;

        assetsList.innerHTML = '';
        let hasVisibleAssets = false;

        this.cryptoAssets.forEach(asset => {
            const amount = (this.userData?.portfolio && this.userData.portfolio[asset.id]) || 0;
            const price = this.cryptoPrices[asset.id] || 0;
            let value = price * amount;

            if (this.selectedCurrency === 'USD') {
                value = value / this.exchangeRates.USD;
            } else if (this.selectedCurrency === 'TON') {
                value = value / this.exchangeRates.TON;
            }

            if (this.hideZeroBalances && amount === 0) return;

            hasVisibleAssets = true;

            const assetItem = document.createElement('div');
            assetItem.className = 'asset-item';
            assetItem.onclick = () => this.showAssetDetail(asset.id);

            const currencySymbol = this.selectedCurrency === 'USD' ? '$' : 
                                this.selectedCurrency === 'TON' ? 'TON' : '₽';

            const change = this.calculate24hChange(asset.id);

            assetItem.innerHTML = `
                <div class="asset-left">
                    <div class="asset-icon" style="background: ${asset.color};">
                        ${asset.symbol}
                    </div>
                    <div class="asset-info">
                        <div class="asset-name">${asset.name}</div>
                        <div class="asset-symbol">${asset.symbol}</div>
                    </div>
                </div>
                <div class="asset-right">
                    <div class="asset-amount">${this.formatCrypto(amount)} ${asset.symbol}</div>
                    <div class="asset-value">${this.formatCurrency(value)} ${currencySymbol}</div>
                    ${change !== null ? `<div class="asset-change ${change >= 0 ? 'positive' : 'negative'}" style="font-size: 10px; margin-top: 2px;">
                        ${change >= 0 ? '↗' : '↘'} ${Math.abs(change).toFixed(2)}%
                    </div>` : ''}
                </div>
            `;

            assetsList.appendChild(assetItem);
        });

        if (!hasVisibleAssets) {
            assetsList.innerHTML = `
                <div class="text-center" style="padding: 40px 20px; color: var(--secondary-text);">
                    <div style="margin-bottom: 16px; opacity: 0.5;">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18v12H3V6zm16 10V8H5v8h14zM7 10h10v4H7v-4z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div style="margin-bottom: 8px; font-weight: 600; font-size: 16px;">Активы отсутствуют</div>
                    <div style="font-size: 0.9em; opacity: 0.7;">Начните с покупки криптовалюты</div>
                </div>
            `;
        }
    }

    calculate24hChange(assetId) {
        // Simulate 24h price change
        const basePrice = this.cryptoPrices[assetId];
        if (!basePrice) return null;
        
        const volatility = assetId === 'tether' ? 0.1 : 
                          assetId === 'bitcoin' ? 2.0 : 3.5;
        return (Math.random() - 0.5) * volatility;
    }

    toggleCurrencyDropdown() {
        const options = document.getElementById('currencyOptions');
        options.classList.toggle('show');
    }

    hideCurrencyDropdown() {
        const options = document.getElementById('currencyOptions');
        options.classList.remove('show');
    }

    selectCurrency(currency) {
        this.selectedCurrency = currency;
        document.getElementById('currentCurrency').textContent = currency;
        this.hideCurrencyDropdown();
        this.updateUI();
    }

    toggleBalanceVisibility() {
        const balanceElement = document.getElementById('totalBalance');
        if (balanceElement.textContent.includes('*')) {
            this.updateBalance();
        } else {
            balanceElement.textContent = '••••••';
        }
    }

    showDepositModal() {
        this.showModal('depositModal');
    }

    showWithdrawModal() {
        this.showModal('withdrawModal');
    }

    showExchangeModal() {
        this.showModal('exchangeModal');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    showTransactionHistory() {
        this.tg.showPopup({
            title: '📊 История транзакций',
            message: 'Функция истории транзакций будет доступна в следующем обновлении',
            buttons: [{ type: 'default', text: 'Понятно' }]
        });
    }

    showNotifications() {
        this.tg.showPopup({
            title: '🔔 Уведомления',
            message: 'У вас нет новых уведомлений',
            buttons: [{ type: 'default', text: 'ОК' }]
        });
    }

    showAssetDetail(assetId) {
        const asset = this.cryptoAssets.find(a => a.id === assetId);
        const amount = this.userData?.portfolio[assetId] || 0;
        const price = this.cryptoPrices[assetId] || 0;
        const value = price * amount;
        
        let displayValue = value;
        let currencySymbol = '₽';
        
        if (this.selectedCurrency === 'USD') {
            displayValue = value / this.exchangeRates.USD;
            currencySymbol = '$';
        } else if (this.selectedCurrency === 'TON') {
            displayValue = value / this.exchangeRates.TON;
            currencySymbol = 'TON';
        }
        
        this.tg.showPopup({
            title: `${asset.symbol} - ${asset.name}`,
            message: `💰 Количество: ${this.formatCrypto(amount)} ${asset.symbol}\n💸 Текущая стоимость: ${this.formatCurrency(displayValue)} ${currencySymbol}\n📈 Цена за единицу: ${this.formatCurrency(price)} ₽`,
            buttons: [{ type: 'default', text: 'Закрыть' }]
        });
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    toggleZeroBalances() {
        this.hideZeroBalances = !this.hideZeroBalances;
        const toggleBtn = document.getElementById('zeroBalanceToggle');
        
        if (toggleBtn) {
            toggleBtn.textContent = this.hideZeroBalances ? 'Показать все' : 'Скрыть нулевые';
            toggleBtn.classList.toggle('active', this.hideZeroBalances);
        }
        
        this.updateAssets();
    }

    formatCurrency(amount) {
        if (typeof amount !== 'number') return '0.00';
        return new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatCrypto(amount) {
        if (typeof amount !== 'number') return '0.0000';
        return new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 8
        }).format(amount);
    }
}

// Initialize app
let walletApp;

document.addEventListener('DOMContentLoaded', function() {
    walletApp = new CryptoWallet();
});

// Global functions for HTML onclick handlers
function showDepositModal() { walletApp?.showDepositModal(); }
function showWithdrawModal() { walletApp?.showWithdrawModal(); }
function showExchangeModal() { walletApp?.showExchangeModal(); }
function showTransactionHistory() { walletApp?.showTransactionHistory(); }
function showNotifications() { walletApp?.showNotifications(); }
function toggleZeroBalances() { walletApp?.toggleZeroBalances(); }
function toggleBalanceVisibility() { walletApp?.toggleBalanceVisibility(); }
function closeModal(modalId) { walletApp?.closeModal(modalId); }
function toggleCurrencyDropdown() { walletApp?.toggleCurrencyDropdown(); }
function selectCurrency(currency) { walletApp?.selectCurrency(currency); }

// Handle Escape key to close modals
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'flex') {
                walletApp.closeModal(modal.id);
            }
        });
    }
});
