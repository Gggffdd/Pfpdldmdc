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

    init() {
        this.tg.expand();
        this.tg.BackButton.hide();
        this.updateUserInfo();
        this.loadUserData();
        this.initEventListeners();
    }

    initEventListeners() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.currency-dropdown')) {
                this.hideCurrencyDropdown();
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
                displayName = user.username;
                avatarText = user.username.charAt(0).toUpperCase();
            }
        }
        
        if (avatar) avatar.textContent = avatarText;
        if (name) name.textContent = displayName;
    }

    loadUserData() {
        setTimeout(() => {
            this.userData = {
                balance: 50000,
                portfolio: {
                    tether: 1500,
                    toncoin: 25.5,
                    bitcoin: 0.0012,
                    ethereum: 0.085
                }
            };
            this.updateUI();
        }, 500);
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
                    <div class="asset-amount">${amount.toFixed(4)} ${asset.symbol}</div>
                    <div class="asset-value">${this.formatCurrency(value)} ${currencySymbol}</div>
                </div>
            `;

            assetsList.appendChild(assetItem);
        });

        if (!hasVisibleAssets) {
            assetsList.innerHTML = `
                <div class="text-center" style="padding: 40px 20px; color: #666;">
                    <div style="margin-bottom: 16px;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                        </svg>
                    </div>
                    <div style="margin-bottom: 8px; font-weight: 600;">Активы отсутствуют</div>
                    <div style="font-size: 0.9em;">Начните с покупки криптовалюты</div>
                </div>
            `;
        }
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
            balanceElement.textContent = '******';
        }
    }

    showDepositModal() {
        document.getElementById('depositModal').style.display = 'flex';
    }

    showWithdrawModal() {
        document.getElementById('withdrawModal').style.display = 'flex';
    }

    showExchangeModal() {
        document.getElementById('exchangeModal').style.display = 'flex';
    }

    showTransactionHistory() {
        this.tg.showPopup({
            title: 'История Транзакций',
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
            title: asset.name,
            message: `Количество: ${amount.toFixed(4)} ${asset.symbol}\nТекущая стоимость: ${this.formatCurrency(displayValue)} ${currencySymbol}\nЦена за единицу: ${this.formatCurrency(price)} ₽`,
            buttons: [{ type: 'ok' }]
        });
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    toggleZeroBalances() {
        this.hideZeroBalances = !this.hideZeroBalances;
        const toggleBtn = document.getElementById('zeroBalanceToggle');
        
        if (toggleBtn) {
            toggleBtn.textContent = this.hideZeroBalances ? 'Показать все' : 'Скрыть мелкие балансы';
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
}

let walletApp;

document.addEventListener('DOMContentLoaded', function() {
    walletApp = new CryptoWallet();
});

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
