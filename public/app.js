class CryptoWallet {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.userData = null;
        this.marketData = null;
        this.hideZeroBalances = false;
        this.selectedCrypto = null;
        this.isBalanceVisible = true;
        this.currentTab = 'portfolio';
        
        this.cryptoColors = {
            bitcoin: '#f7931a',
            ethereum: '#627eea',
            tether: '#26a17b',
            toncoin: '#0088cc',
            solana: '#00ffbd',
            ripple: '#23292f',
            cardano: '#0033ad',
            dogecoin: '#c2a633',
            polkadot: '#e6007a'
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Crypto Wallet Pro...');
            
            // Инициализация Telegram Web App
            this.tg.expand();
            this.tg.BackButton.hide();
            this.tg.enableClosingConfirmation();
            
            // Настройка темы
            this.setupTheme();
            
            // Инициализация интерфейса
            this.setupEventListeners();
            this.updateUserInfo();
            this.initializeMarkets();
            
            // Загрузка данных
            await this.loadData();
            
            // Автообновление каждые 10 секунд
            this.startAutoRefresh();
            
            console.log('✅ Crypto Wallet Pro initialized successfully');
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showError('Ошибка инициализации приложения');
        }
    }

    setupTheme() {
        // Устанавливаем цвет фона Telegram
        this.tg.setHeaderColor('#1a1a1a');
        this.tg.setBackgroundColor('#0a0a0a');
        
        // Определяем тему
        if (this.tg.colorScheme === 'dark') {
            document.documentElement.style.setProperty('--primary-bg', '#0a0a0a');
            document.documentElement.style.setProperty('--secondary-bg', '#111111');
        }
    }

    setupEventListeners() {
        // Обработчики для навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.switchTab(tab);
            });
        });

        // Обработчики для модальных окон
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Обработчик для кнопки скрытия баланса
        document.querySelector('.eye-btn').addEventListener('click', () => {
            this.toggleBalanceVisibility();
        });
    }

    updateUserInfo() {
        const user = this.tg.initDataUnsafe?.user;
        const avatar = document.getElementById('userAvatar');
        const greeting = document.getElementById('userGreeting');
        const tier = document.getElementById('userTier');
        
        let displayName = 'Трейдер';
        let avatarText = 'T';
        
        if (user) {
            if (user.first_name) {
                displayName = user.first_name;
                avatarText = user.first_name.charAt(0).toUpperCase();
            }
            if (user.username) {
                displayName = `@${user.username}`;
                avatarText = user.username.charAt(0).toUpperCase();
            }
            
            // Показываем премиум статус для некоторых пользователей
            if (user.id % 3 === 0) {
                tier.textContent = 'PREMIUM';
                tier.style.color = '#ffd700';
                document.getElementById('premiumIndicator').classList.add('active');
            }
        }
        
        avatar.textContent = avatarText;
        greeting.textContent = displayName;
    }

    initializeMarkets() {
        const markets = [
            { id: 'bitcoin', name: 'BTC/USDT', price: '84,608.49', change: 0.27 },
            { id: 'ethereum', name: 'ETH/USDT', price: '3,250.42', change: 1.85 },
            { id: 'solana', name: 'SOL/USDT', price: '126.27', change: -1.01 },
            { id: 'toncoin', name: 'TON/USDT', price: '6.52', change: 2.30 }
        ];
        
        const marketsGrid = document.getElementById('marketsGrid');
        marketsGrid.innerHTML = '';
        
        markets.forEach(market => {
            const marketCard = this.createMarketCard(market);
            marketsGrid.appendChild(marketCard);
        });
    }

    createMarketCard(market) {
        const card = document.createElement('div');
        card.className = 'market-card';
        card.onclick = () => this.showMarketDetail(market.id);
        
        const color = this.cryptoColors[market.id] || '#666666';
        
        card.innerHTML = `
            <div class="market-header">
                <div class="market-icon" style="background: ${color};">
                    ${market.id.charAt(0).toUpperCase()}
                </div>
                <div class="market-name">${market.name}</div>
            </div>
            <div class="market-price">$${market.price}</div>
            <div class="market-change ${market.change >= 0 ? 'change-positive' : 'change-negative'}">
                ${market.change >= 0 ? '+' : ''}${market.change}%
            </div>
        `;
        
        return card;
    }

    async loadData() {
        this.showLoading();
        
        try {
            const response = await fetch('/api/trade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get_data',
                    userId: this.tg.initDataUnsafe?.user?.id || 'demo'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.userData = data.user;
                this.marketData = data.prices;
                this.updateUI();
            } else {
                throw new Error(data.error || 'Failed to load data');
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Ошибка загрузки данных');
            // Используем демо-данные в случае ошибки
            this.useDemoData();
        } finally {
            this.hideLoading();
        }
    }

    useDemoData() {
        this.userData = {
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
            portfolioValue: 27680,
            dailyProfit: 1150,
            isPremium: false
        };
        
        this.marketData = {
            bitcoin: { price: 84608.49, change: 0.27, symbol: 'BTC', name: 'Bitcoin' },
            ethereum: { price: 3250.42, change: 1.85, symbol: 'ETH', name: 'Ethereum' },
            tether: { price: 0.999, change: 0.03, symbol: 'USDT', name: 'Tether' },
            toncoin: { price: 6.52, change: 2.30, symbol: 'TON', name: 'Toncoin' },
            solana: { price: 126.27, change: -1.01, symbol: 'SOL', name: 'Solana' },
            ripple: { price: 0.573, change: -0.45, symbol: 'XRP', name: 'Ripple' },
            cardano: { price: 0.452, change: 1.22, symbol: 'ADA', name: 'Cardano' },
            dogecoin: { price: 0.128, change: 3.45, symbol: 'DOGE', name: 'Dogecoin' },
            polkadot: { price: 6.84, change: -0.89, symbol: 'DOT', name: 'Polkadot' }
        };
        
        this.updateUI();
    }

    updateUI() {
        this.updateBalanceStats();
        this.updateAssetList();
        this.updateMarketCards();
    }

    updateBalanceStats() {
        if (!this.userData || !this.marketData) return;
        
        const totalBalance = this.userData.balance || 0;
        const portfolioValue = this.userData.portfolioValue || 0;
        const availableBalance = totalBalance;
        const investedBalance = portfolioValue;
        const dailyProfit = this.userData.dailyProfit || 0;
        const dailyProfitPercent = portfolioValue > 0 ? (dailyProfit / portfolioValue) * 100 : 0;
        
        // Обновляем отображение баланса
        const balanceElement = document.getElementById('totalBalance');
        if (this.isBalanceVisible) {
            balanceElement.innerHTML = `
                <span class="amount">${this.formatCurrency(totalBalance + investedBalance)}</span>
                <span class="currency">RUB</span>
            `;
        } else {
            balanceElement.innerHTML = `
                <span class="amount">••••••</span>
                <span class="currency">RUB</span>
            `;
        }
        
        document.getElementById('availableBalance').textContent = 
            this.isBalanceVisible ? `${this.formatCurrency(availableBalance)} RUB` : '•••••• RUB';
        document.getElementById('investedBalance').textContent = 
            this.isBalanceVisible ? `${this.formatCurrency(investedBalance)} RUB` : '•••••• RUB';
        
        // Обновляем индикатор доходности
        const profitElement = document.getElementById('dailyProfit');
        profitElement.textContent = 
            `${dailyProfitPercent >= 0 ? '+' : ''}${dailyProfitPercent.toFixed(2)}% ` +
            `(${dailyProfit >= 0 ? '+' : ''}${this.formatCurrency(dailyProfit)} RUB)`;
        profitElement.className = `profit-value ${dailyProfit >= 0 ? 'positive' : 'negative'}`;
    }

    updateAssetList() {
        const assetList = document.getElementById('assetsList');
        if (!this.userData || !this.marketData) return;
        
        assetList.innerHTML = '';
        
        const assets = Object.keys(this.cryptoColors).map(id => ({
            id,
            name: this.marketData[id]?.name || id,
            symbol: this.marketData[id]?.symbol || id.toUpperCase(),
            color: this.cryptoColors[id]
        }));
        
        let hasVisibleAssets = false;
        
        assets.forEach(asset => {
            const cryptoData = this.marketData[asset.id];
            if (!cryptoData) return;
            
            const amount = this.userData.portfolio[asset.id] || 0;
            const value = cryptoData.price * amount;
            const change = cryptoData.change;
            
            if (this.hideZeroBalances && amount === 0) {
                return;
            }
            
            hasVisibleAssets = true;
            
            const assetItem = this.createAssetItem(asset, cryptoData, amount, value, change);
            assetList.appendChild(assetItem);
        });
        
        if (!hasVisibleAssets) {
            assetList.innerHTML = this.createEmptyState();
        }
    }

    createAssetItem(asset, cryptoData, amount, value, change) {
        const item = document.createElement('div');
        item.className = 'asset-item';
        item.onclick = () => this.showAssetDetail(asset.id);
        
        item.innerHTML = `
            <div class="asset-left">
                <div class="asset-icon" style="background: ${asset.color};">
                    ${asset.symbol.charAt(0)}
                </div>
                <div class="asset-info">
                    <div class="asset-name">${asset.name}</div>
                    <div class="asset-price">
                        $${cryptoData.price.toFixed(2)} 
                        <span class="${change >= 0 ? 'change-positive' : 'change-negative'}" style="font-size: 0.7em;">
                            ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
            <div class="asset-right">
                <div class="asset-amount">${amount.toFixed(4)} ${asset.symbol}</div>
                <div class="asset-value">${this.isBalanceVisible ? this.formatCurrency(value) + ' RUB' : '••••••'}</div>
            </div>
        `;
        
        return item;
    }

    createEmptyState() {
        return `
            <div class="text-center" style="padding: 40px 20px; color: var(--text-secondary);">
                <div style="font-size: 3em; margin-bottom: 16px;">💼</div>
                <div style="font-size: 16px; margin-bottom: 8px;">У вас пока нет активов</div>
                <div style="font-size: 14px;">Начните с пополнения счета или покупки криптовалюты</div>
                <button class="btn primary mt-3" onclick="wallet.showDepositModal()" style="margin-top: 16px;">
                    📥 Пополнить счет
                </button>
            </div>
        `;
    }

    updateMarketCards() {
        if (!this.marketData) return;
        
        const marketsGrid = document.getElementById('marketsGrid');
        const topMarkets = ['bitcoin', 'ethereum', 'solana', 'toncoin'];
        
        marketsGrid.innerHTML = '';
        
        topMarkets.forEach(marketId => {
            const marketData = this.marketData[marketId];
            if (marketData) {
                const marketCard = this.createMarketCard({
                    id: marketId,
                    name: `${marketData.symbol}/USDT`,
                    price: this.formatCurrency(marketData.priceUSD || marketData.price),
                    change: marketData.change
                });
                marketsGrid.appendChild(marketCard);
            }
        });
    }

    // Модальные окна
    showDepositModal() {
        this.createCryptoSelector('depositCryptoList');
        this.selectedCrypto = null;
        this.showModal('depositModal');
    }

    showWithdrawModal() {
        this.createCryptoSelector('withdrawCryptoList');
        this.selectedCrypto = null;
        this.showModal('withdrawModal');
    }

    createCryptoSelector(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        Object.entries(this.cryptoColors).forEach(([cryptoId, color]) => {
            const cryptoData = this.marketData?.[cryptoId];
            if (!cryptoData) return;
            
            const card = document.createElement('div');
            card.className = `crypto-card ${this.selectedCrypto === cryptoId ? 'selected' : ''}`;
            card.onclick = () => {
                this.selectedCrypto = cryptoId;
                this.updateCryptoSelection(containerId);
            };
            
            card.innerHTML = `
                <div class="crypto-icon" style="background: ${color};">
                    ${cryptoData.symbol}
                </div>
                <div class="crypto-name">${cryptoData.symbol}</div>
                <div class="crypto-price">${cryptoData.name}</div>
            `;
            
            container.appendChild(card);
        });
    }

    updateCryptoSelection(containerId) {
        document.querySelectorAll(`#${containerId} .crypto-card`).forEach(card => {
            card.classList.remove('selected');
        });
        
        if (this.selectedCrypto) {
            const selectedCard = document.querySelector(`#${containerId} .crypto-card:nth-child(${this.getCryptoIndex(this.selectedCrypto) + 1})`);
            if (selectedCard) {
                selectedCard.classList.add('selected');
            }
        }
    }

    getCryptoIndex(cryptoId) {
        return Object.keys(this.cryptoColors).indexOf(cryptoId);
    }

    // Действия с криптовалютой
    async confirmDeposit() {
        if (!this.selectedCrypto) {
            this.showPopup('Ошибка', 'Выберите криптовалюту для пополнения');
            return;
        }
        
        this.showPopup(
            'Пополнение', 
            `Функция пополнения ${this.selectedCrypto} будет доступна в следующем обновлении`
        );
        this.closeModal('depositModal');
    }

    async confirmWithdraw() {
        if (!this.selectedCrypto) {
            this.showPopup('Ошибка', 'Выберите криптовалюту для вывода');
            return;
        }
        
        this.showPopup(
            'Вывод', 
            `Функция вывода ${this.selectedCrypto} будет доступна в следующем обновлении`
        );
        this.closeModal('withdrawModal');
    }

    // Вспомогательные методы
    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU').format(amount.toFixed(0));
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        this.selectedCrypto = null;
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showPopup(title, message) {
        this.tg.showPopup({
            title: title,
            message: message,
            buttons: [{ type: 'ok' }]
        });
    }

    showError(message) {
        this.tg.showPopup({
            title: 'Ошибка',
            message: message,
            buttons: [{ type: 'ok' }]
        });
    }

    toggleBalanceVisibility() {
        this.isBalanceVisible = !this.isBalanceVisible;
        const eyeIcon = document.getElementById('eyeIcon');
        eyeIcon.textContent = this.isBalanceVisible ? '👁️' : '🙈';
        this.updateBalanceStats();
        this.updateAssetList();
    }

    toggleHiddenBalances() {
        this.hideZeroBalances = !this.hideZeroBalances;
        const button = document.getElementById('hideBalancesBtn');
        button.textContent = this.hideZeroBalances ? 'Показать все' : 'Скрыть нули';
        this.updateAssetList();
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Обновляем активную кнопку навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        // Здесь можно добавить логику переключения контента вкладок
        this.showPopup('Вкладка', `Раздел "${tab}" будет доступен в следующем обновлении`);
    }

    startAutoRefresh() {
        setInterval(() => {
            this.loadData();
        }, 10000); // Обновление каждые 10 секунд
    }

    // Методы для различных функций (заглушки)
    showExchangeModal() {
        this.showPopup('Обмен', 'Функция обмена будет доступна в следующем обновлении');
    }

    showTradeModal() {
        this.showPopup('Торговля', 'Расширенная торговля будет доступна в следующем обновлении');
    }

    showMarketDetail(marketId) {
        this.showPopup('Детали рынка', `Подробная информация о ${marketId} будет доступна в следующем обновлении`);
    }

    showAssetDetail(assetId) {
        this.showPopup('Детали актива', `Подробная информация об активе будет доступна в следующем обновлении`);
    }

    showQuickBuyModal() {
        this.showPopup('Быстрая покупка', 'Функция быстрой покупки будет доступна в следующем обновлении');
    }

    showQuickSellModal() {
        this.showPopup('Быстрая продажа', 'Функция быстрой продажи будет доступна в следующем обновлении');
    }

    showAllMarkets() {
        this.showPopup('Все рынки', 'Полный список рынков будет доступен в следующем обновлении');
    }

    showPortfolioHistory() {
        this.showPopup('История портфеля', 'История транзакций будет доступна в следующем обновлении');
    }

    showNotifications() {
        this.showPopup('Уведомления', 'Уведомления будут доступны в следующем обновлении');
    }

    showSettings() {
        this.showPopup('Настройки', 'Настройки будут доступны в следующем обновлении');
    }
}

// Инициализация приложения
let wallet;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting Crypto Wallet Pro...');
    wallet = new CryptoWallet();
});

// Глобальные функции для HTML onclick атрибутов
function showDepositModal() { wallet?.showDepositModal(); }
function showWithdrawModal() { wallet?.showWithdrawModal(); }
function showExchangeModal() { wallet?.showExchangeModal(); }
function showTradeModal() { wallet?.showTradeModal(); }
function showQuickBuyModal() { wallet?.showQuickBuyModal(); }
function showQuickSellModal() { wallet?.showQuickSellModal(); }
function showAllMarkets() { wallet?.showAllMarkets(); }
function showPortfolioHistory() { wallet?.showPortfolioHistory(); }
function showNotifications() { wallet?.showNotifications(); }
function showSettings() { wallet?.showSettings(); }
function confirmDeposit() { wallet?.confirmDeposit(); }
function confirmWithdraw() { wallet?.confirmWithdraw(); }
function closeModal(modalId) { wallet?.closeModal(modalId); }
function toggleHiddenBalances() { wallet?.toggleHiddenBalances(); }
function toggleBalanceVisibility() { wallet?.toggleBalanceVisibility(); }
function switchTab(tab) { wallet?.switchTab(tab); }
