let tg = window.Telegram.WebApp;
let userData = null;
let hideZeroBalances = false;
let selectedCrypto = null;

tg.expand();
tg.BackButton.hide();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadData();
    setInterval(loadData, 10000); // Обновление каждые 10 секунд
});

// Инициализация приложения
function initializeApp() {
    updateUserInfo();
    initializeMarkets();
}

// Обновление информации о пользователе
function updateUserInfo() {
    const user = tg.initDataUnsafe.user;
    const avatar = document.getElementById('userAvatar');
    const greeting = document.getElementById('userGreeting');
    
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
    }
    
    avatar.textContent = avatarText;
    greeting.textContent = displayName;
}

// Инициализация рынков
function initializeMarkets() {
    const markets = [
        { id: 'bitcoin', name: 'BTC/USDT', price: '84608.49', change: 0.27 },
        { id: 'ethereum', name: 'ETH/USDT', price: '3250.42', change: 1.85 },
        { id: 'solana', name: 'SOL/USDT', price: '126.27', change: -1.01 },
        { id: 'toncoin', name: 'TON/USDT', price: '6.52', change: 2.30 }
    ];
    
    const marketsGrid = document.getElementById('marketsGrid');
    marketsGrid.innerHTML = '';
    
    markets.forEach(market => {
        const marketCard = document.createElement('div');
        marketCard.className = 'market-card';
        marketCard.onclick = () => showMarketDetail(market.id);
        
        marketCard.innerHTML = `
            <div class="market-header">
                <div class="market-icon" style="background: linear-gradient(135deg, #f7931a, #f3ba2f); color: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.8em; font-weight: bold;">
                    ${market.id.charAt(0).toUpperCase()}
                </div>
                <div class="market-name">${market.name}</div>
            </div>
            <div class="market-price">$${market.price}</div>
            <div class="market-change ${market.change >= 0 ? 'change-positive' : 'change-negative'}">
                ${market.change >= 0 ? '+' : ''}${market.change}%
            </div>
        `;
        
        marketsGrid.appendChild(marketCard);
    });
}

// Загрузка данных
async function loadData() {
    try {
        const response = await fetch('/api/trade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'get_data',
                userId: tg.initDataUnsafe.user?.id || 'demo'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            userData = data.user;
            updateUI(data.user, data.prices);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Обновление интерфейса
function updateUI(user, prices) {
    updateBalanceStats(user, prices);
    updateAssetList(user, prices);
}

// Обновление статистики баланса
function updateBalanceStats(user, prices) {
    const totalBalance = user.balance;
    let investedBalance = 0;
    
    for (const [crypto, amount] of Object.entries(user.portfolio)) {
        if (amount > 0 && prices[crypto]) {
            investedBalance += prices[crypto].price * amount;
        }
    }
    
    const availableBalance = totalBalance - investedBalance;
    
    document.getElementById('totalBalance').textContent = `${formatCurrency(totalBalance)} ₽`;
    document.getElementById('availableBalance').textContent = `${formatCurrency(availableBalance)} ₽`;
    document.getElementById('investedBalance').textContent = `${formatCurrency(investedBalance)} ₽`;
}

// Обновление списка активов
function updateAssetList(user, prices) {
    const assetList = document.getElementById('assetList');
    assetList.innerHTML = '';
    
    const assets = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#f7931a' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627eea' },
        { id: 'tether', name: 'Tether', symbol: 'USDT', color: '#26a17b' },
        { id: 'toncoin', name: 'Toncoin', symbol: 'TON', color: '#0088cc' },
        { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#00ffbd' },
        { id: 'ripple', name: 'Ripple', symbol: 'XRP', color: '#23292f' },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', color: '#0033ad' }
    ];
    
    let hasVisibleAssets = false;
    
    assets.forEach(asset => {
        const cryptoData = prices[asset.id];
        if (!cryptoData) return;
        
        const amount = user.portfolio[asset.id] || 0;
        const value = cryptoData.price * amount;
        const change = cryptoData.change;
        
        if (hideZeroBalances && amount === 0) {
            return;
        }
        
        hasVisibleAssets = true;
        
        const assetItem = document.createElement('div');
        assetItem.className = 'asset-item';
        assetItem.setAttribute('data-amount', amount);
        assetItem.onclick = () => showAssetDetail(asset.id);
        
        assetItem.innerHTML = `
            <div class="asset-left">
                <div class="asset-icon" style="background: ${asset.color}; color: white;">
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
                <div class="asset-value">${formatCurrency(value)} ₽</div>
            </div>
        `;
        
        assetList.appendChild(assetItem);
    });
    
    if (!hasVisibleAssets) {
        assetList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #888;">
                <div style="font-size: 2em; margin-bottom: 16px;">💼</div>
                <div>У вас пока нет активов</div>
                <div style="font-size: 0.9em; margin-top: 8px;">Начните с пополнения счета</div>
            </div>
        `;
    }
}

// Форматирование валюты
function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU').format(Math.floor(amount));
}

// Создание списка криптовалют для модальных окон
function createCryptoSelector(containerId, onSelect) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const cryptos = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#f7931a' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627eea' },
        { id: 'tether', name: 'Tether', symbol: 'USDT', color: '#26a17b' },
        { id: 'toncoin', name: 'Toncoin', symbol: 'TON', color: '#0088cc' },
        { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#00ffbd' },
        { id: 'ripple', name: 'Ripple', symbol: 'XRP', color: '#23292f' }
    ];
    
    cryptos.forEach(crypto => {
        const card = document.createElement('div');
        card.className = `crypto-card ${selectedCrypto === crypto.id ? 'selected' : ''}`;
        card.onclick = () => {
            selectedCrypto = crypto.id;
            onSelect(crypto.id);
            updateCryptoSelection(containerId);
        };
        
        card.innerHTML = `
            <div class="crypto-icon" style="background: ${crypto.color}; color: white;">
                ${crypto.symbol}
            </div>
            <div class="crypto-name">${crypto.symbol}</div>
            <div class="crypto-price">${crypto.name}</div>
        `;
        
        container.appendChild(card);
    });
}

// Обновление выбора криптовалюты
function updateCryptoSelection(containerId) {
    const cards = document.querySelectorAll(`#${containerId} .crypto-card`);
    cards.forEach(card => {
        card.classList.remove('selected');
    });
    
    if (selectedCrypto) {
        const selectedCard = document.querySelector(`#${containerId} .crypto-card:nth-child(${getCryptoIndex(selectedCrypto) + 1})`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
    }
}

function getCryptoIndex(cryptoId) {
    const cryptos = ['bitcoin', 'ethereum', 'tether', 'toncoin', 'solana', 'ripple'];
    return cryptos.indexOf(cryptoId);
}

// Функции модальных окон
function showDepositModal() {
    createCryptoSelector('depositCryptoList', () => updateCryptoSelection('depositCryptoList'));
    selectedCrypto = null;
    document.getElementById('depositModal').style.display = 'flex';
}

function showWithdrawModal() {
    createCryptoSelector('withdrawCryptoList', () => updateCryptoSelection('withdrawCryptoList'));
    selectedCrypto = null;
    document.getElementById('withdrawModal').style.display = 'flex';
}

function showExchangeModal() {
    tg.showPopup({
        title: 'Обмен',
        message: 'Функция обмена будет доступна в следующем обновлении',
        buttons: [{ type: 'ok' }]
    });
}

function showTradeModal() {
    tg.showPopup({
        title: 'Торговая биржа',
        message: 'Расширенная торговля будет доступна в следующем обновлении',
        buttons: [{ type: 'ok' }]
    });
}

function showMarketDetail(marketId) {
    tg.showPopup({
        title: 'Детали рынка',
        message: `Подробная информация о ${marketId} будет доступна в следующем обновлении`,
        buttons: [{ type: 'ok' }]
    });
}

function showAssetDetail(assetId) {
    tg.showPopup({
        title: 'Детали актива',
        message: `Подробная информация об активе будет доступна в следующем обновлении`,
        buttons: [{ type: 'ok' }]
    });
}

function showQuickBuy() {
    tg.showPopup({
        title: 'Быстрая покупка',
        message: 'Функция быстрой покупки будет доступна в следующем обновлении',
        buttons: [{ type: 'ok' }]
    });
}

function showQuickSell() {
    tg.showPopup({
        title: 'Быстрая продажа',
        message: 'Функция быстрой продажи будет доступна в следующем обновлении',
        buttons: [{ type: 'ok' }]
    });
}

function showAllMarkets() {
    tg.showPopup({
        title: 'Все рынки',
        message: 'Полный список рынков будет доступен в следующем обновлении',
        buttons: [{ type: 'ok' }]
    });
}

function showPortfolio() {
    tg.showPopup({
        title: 'История портфеля',
        message: 'История транзакций будет доступна в следующем обновлении',
        buttons: [{ type: 'ok' }]
    });
}

function openNewsChannel() {
    tg.showPopup({
        title: 'Новостной канал',
        message: 'Ссылка на канал будет доступна в следующем обновлении',
        buttons: [{ type: 'ok' }]
    });
}

// Подтверждение действий
function confirmDeposit() {
    if (!selectedCrypto) {
        tg.showPopup({
            title: 'Ошибка',
            message: 'Выберите криптовалюту для пополнения',
            buttons: [{ type: 'ok' }]
        });
        return;
    }
    
    tg.showPopup({
        title: 'Пополнение',
        message: `Функция пополнения ${selectedCrypto} будет доступна в следующем обновлении`,
        buttons: [{ type: 'ok' }]
    });
    closeModal('depositModal');
}

function confirmWithdraw() {
    if (!selectedCrypto) {
        tg.showPopup({
            title: 'Ошибка',
            message: 'Выберите криптовалюту для вывода',
            buttons: [{ type: 'ok' }]
        });
        return;
    }
    
    tg.showPopup({
        title: 'Вывод',
        message: `Функция вывода ${selectedCrypto} будет доступна в следующем обновлении`,
        buttons: [{ type: 'ok' }]
    });
    closeModal('withdrawModal');
}

// Закрытие модальных окон
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    selectedCrypto = null;
}

// Переключение скрытия нулевых балансов
function toggleHiddenBalances() {
    hideZeroBalances = !hideZeroBalances;
    const actionElement = document.querySelector('.assets-action');
    
    if (hideZeroBalances) {
        actionElement.textContent = 'Показать все';
    } else {
        actionElement.textContent = 'Скрыть нули';
    }
    
    if (userData) {
        loadData();
    }
  }
