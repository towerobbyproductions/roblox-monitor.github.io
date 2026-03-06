// Конфигурация
const CONFIG = {
    ROPROXY_API: 'https://games.roblox.workerservicesproxy.com/',
    GAMES_JSON: '/data/games.json',
    COMMUNITIES_JSON: '/data/communities.json'
};

// Утилиты для форматирования чисел
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Определение текущей страницы
function getCurrentPage() {
    const path = window.location.pathname;
    
    if (path.includes('/games/')) {
        const match = path.match(/\/games\/(\d+)\//);
        return { type: 'game', id: match ? match[1] : null };
    }
    
    if (path.includes('/communities/')) {
        const match = path.match(/\/communities\/(\d+)\//);
        return { type: 'community', id: match ? match[1] : null };
    }
    
    return { type: 'home', id: null };
}

// Получение данных игры через RoProxy
async function fetchGameData(gameId) {
    try {
        const response = await fetch(`${CONFIG.ROPROXY_API}games?universeIds=${gameId}`);
        const data = await response.json();
        
        if (data.data && data.data[0]) {
            const game = data.data[0];
            return {
                name: game.name,
                playing: game.playing || 0,
                visits: game.visits || 0,
                rating: Math.round((game.favorites || 0) / 100) // Пример расчета рейтинга
            };
        }
        throw new Error('Игра не найдена');
    } catch (error) {
        console.error('Ошибка загрузки игры:', error);
        return null;
    }
}

// Получение данных сообщества через RoProxy
async function fetchCommunityData(communityId) {
    try {
        const response = await fetch(`${CONFIG.ROPROXY_API}groups/${communityId}`);
        const data = await response.json();
        
        return {
            name: data.name || 'Неизвестное сообщество',
            members: data.memberCount || 0,
            games: data.shout ? 1 : 0 // Пример, нужно уточнить API
        };
    } catch (error) {
        console.error('Ошибка загрузки сообщества:', error);
        return null;
    }
}

// Загрузка данных для страницы игры
async function loadGamePage(gameId) {
    const statsDiv = document.getElementById('game-stats');
    if (!statsDiv) return;
    
    statsDiv.innerHTML = '<div class="loading">Загрузка данных игры</div>';
    
    const gameData = await fetchGameData(gameId);
    
    if (gameData) {
        statsDiv.innerHTML = `
            <div class="game-detail">
                <div class="game-header">
                    <h2>${gameData.name}</h2>
                    <span class="game-id">ID: ${gameId}</span>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="label">Активных игроков</div>
                        <div class="value">${formatNumber(gameData.playing)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="label">Всего посещений</div>
                        <div class="value">${formatNumber(gameData.visits)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="label">Рейтинг</div>
                        <div class="value">${gameData.rating}%</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        statsDiv.innerHTML = `
            <div class="error-page">
                <h3>Ошибка загрузки игры</h3>
                <p>Не удалось получить данные для игры с ID: ${gameId}</p>
                <a href="/" class="btn">Вернуться на главную</a>
            </div>
        `;
    }
}

// Загрузка данных для страницы сообщества
async function loadCommunityPage(communityId) {
    const statsDiv = document.getElementById('community-stats');
    if (!statsDiv) return;
    
    statsDiv.innerHTML = '<div class="loading">Загрузка данных сообщества</div>';
    
    const communityData = await fetchCommunityData(communityId);
    
    if (communityData) {
        statsDiv.innerHTML = `
            <div class="community-detail">
                <div class="community-header">
                    <h2>${communityData.name}</h2>
                    <span class="community-id">ID: ${communityId}</span>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="label">Участников</div>
                        <div class="value">${formatNumber(communityData.members)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="label">Игр</div>
                        <div class="value">${communityData.games}</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        statsDiv.innerHTML = `
            <div class="error-page">
                <h3>Ошибка загрузки сообщества</h3>
                <p>Не удалось получить данные для сообщества с ID: ${communityId}</p>
                <a href="/" class="btn">Вернуться на главную</a>
            </div>
        `;
    }
}

// Загрузка списка игр для главной
async function loadGamesList() {
    const container = document.getElementById('games-container');
    if (!container) return;
    
    try {
        const response = await fetch(CONFIG.GAMES_JSON);
        const games = await response.json();
        
        container.innerHTML = '';
        
        for (const game of games) {
            const gameData = await fetchGameData(game.id);
            
            const card = document.createElement('a');
            card.href = `/games/${game.id}/`;
            card.className = 'card';
            card.innerHTML = `
                <div class="card-content">
                    <h3>${gameData?.name || game.name || 'Загрузка...'}</h3>
                    <div class="stats">
                        <div class="stat-item">
                            <span class="stat-label">Активных:</span>
                            <span class="stat-value">${gameData ? formatNumber(gameData.playing) : '...'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Посещений:</span>
                            <span class="stat-value">${gameData ? formatNumber(gameData.visits) : '...'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Рейтинг:</span>
                            <span class="stat-value">${gameData ? gameData.rating + '%' : '...'}</span>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        }
    } catch (error) {
        console.error('Ошибка загрузки игр:', error);
        container.innerHTML = '<p class="error">Ошибка загрузки списка игр</p>';
    }
}

// Загрузка списка сообществ для главной
async function loadCommunitiesList() {
    const container = document.getElementById('communities-container');
    if (!container) return;
    
    try {
        const response = await fetch(CONFIG.COMMUNITIES_JSON);
        const communities = await response.json();
        
        container.innerHTML = '';
        
        for (const community of communities) {
            const communityData = await fetchCommunityData(community.id);
            
            const card = document.createElement('a');
            card.href = `/communities/${community.id}/`;
            card.className = 'card';
            card.innerHTML = `
                <div class="card-content">
                    <h3>${communityData?.name || community.name || 'Загрузка...'}</h3>
                    <div class="stats">
                        <div class="stat-item">
                            <span class="stat-label">Участников:</span>
                            <span class="stat-value">${communityData ? formatNumber(communityData.members) : '...'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Игр:</span>
                            <span class="stat-value">${communityData ? communityData.games : '...'}</span>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        }
    } catch (error) {
        console.error('Ошибка загрузки сообществ:', error);
        container.innerHTML = '<p class="error">Ошибка загрузки списка сообществ</p>';
    }
}

// Инициализация в зависимости от страницы
document.addEventListener('DOMContentLoaded', async () => {
    const page = getCurrentPage();
    
    switch (page.type) {
        case 'game':
            if (page.id) {
                await loadGamePage(page.id);
            }
            break;
            
        case 'community':
            if (page.id) {
                await loadCommunityPage(page.id);
            }
            break;
            
        case 'home':
            await Promise.all([
                loadGamesList(),
                loadCommunitiesList()
            ]);
            break;
    }
});
