// script.js — работает и в index.html, и в dashboard.html
const API_PLAYERS = './players.json'; // относительный путь к файлу players.json

// ----------------- LOGIN -----------------
if (document.getElementById('loginForm')) {
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;
    // Простой демо: admin/admin123 -> роль admin. Для реала — серверная авторизация!
    if (u === 'admin' && p === 'admin123') {
      localStorage.setItem('ghetto_user', JSON.stringify({ username: 'admin', role: 'admin' }));
      location.href = 'dashboard.html';
    } else {
      const err = document.getElementById('loginError');
      err.innerText = 'Неверный логин/пароль (только демонстрация)';
      err.style.display = 'block';
    }
  });
}

// ----------------- DASHBOARD -----------------
if (document.querySelector('.app')) {
  const navButtons = document.querySelectorAll('.navbtn[data-view]');
  const content = document.getElementById('content');
  const topTitle = document.getElementById('topTitle');
  const refreshBtn = document.getElementById('refreshBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('ghetto_user');
    location.href = 'index.html';
  });

  // Check auth
  const currentUser = JSON.parse(localStorage.getItem('ghetto_user') || 'null');
  if (!currentUser) {
    location.href = 'index.html';
  }

  // Nav
  navButtons.forEach(b => b.addEventListener('click', () => {
    const view = b.dataset.view;
    topTitle.innerText = b.innerText;
    renderView(view);
  }));

  refreshBtn.addEventListener('click', () => {
    const current = topTitle.innerText.toLowerCase();
    renderView(current === 'профили' ? 'profiles' : current);
  });

  // initial
  renderView('profiles');

  async function loadPlayers() {
    try {
      const r = await fetch(API_PLAYERS + '?_=' + Date.now());
      if (!r.ok) throw new Error('Не удалось загрузить players.json');
      return await r.json();
    } catch (e) {
      console.error(e);
      return { users: [] };
    }
  }

  function renderProfileCard(u) {
    const div = document.createElement('div');
    div.className = 'card-profile';

    const img = document.createElement('img');
    img.className = 'avatar';
    img.src = u.avatar || 'https://via.placeholder.com/84x84?text=AV';
    img.alt = u.display_name;

    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = `
      <div class="display-name">${escapeHtml(u.display_name)}</div>
      <div class="username">@${escapeHtml(u.username)}</div>
      <div class="label">${escapeHtml(u.bio || '')}</div>
      <div class="controls">
        <button class="btn small" data-action="edit" data-id="${u.id}">Редактировать</button>
        <button class="btn small" data-action="delete" data-id="${u.id}">Удалить</button>
        <div class="badge">${escapeHtml(u.role||'user')}</div>
      </div>
    `;

    div.appendChild(img);
    div.appendChild(info);

    // Events
    info.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id, 10);
        if (action === 'edit') editPlayerPrompt(id);
        if (action === 'delete') deletePlayerConfirm(id);
      });
    });

    return div;
  }

  async function renderView(view) {
    content.innerHTML = '<div class="center">Загрузка...</div>';
    const data = await loadPlayers();
    const users = (data.users || []).slice().sort((a,b) => b.score - a.score);

    if (view === 'profiles' || view === 'профили') {
      content.innerHTML = '<h2>Профили</h2>';
      const wrap = document.createElement('div');
      users.forEach(u => wrap.appendChild(renderProfileCard(u)));
      // Add button to create
      const addBtn = document.createElement('button');
      addBtn.className = 'btn';
      addBtn.innerText = 'Добавить игрока';
      addBtn.addEventListener('click', createPlayerPrompt);
      content.appendChild(addBtn);
      content.appendChild(wrap);
    }

    if (view === 'leaders' || view === 'лидеры') {
      content.innerHTML = '<h2>Лидеры</h2>';
      const top = users.slice(0, 20);
      const wrap = document.createElement('div');
      top.forEach(u => {
        const el = document.createElement('div');
        el.className = 'card-small';
        el.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>${escapeHtml(u.display_name)}</strong><div class="username">@${escapeHtml(u.username)}</div></div><div style="text-align:right"><div class="label">Score</div><div style="font-weight:700">${u.score||0}</div></div></div>`;
        wrap.appendChild(el);
      });
      content.appendChild(wrap);
    }

    if (view === 'followers' || view === 'следящие') {
      content.innerHTML = '<h2>Следящие</h2><div class="card-small">Функция «Следящие» сейчас проста — статус хранится в players.json. Для фильтрации используйте search.</div>';
      const followWrap = document.createElement('div');
      const followers = users.filter(u => u.role === 'follower' || u.status === 'watching');
      if (followers.length === 0) followWrap.innerHTML = '<div class="label">Пока никого нет</div>';
      else followers.forEach(u => followWrap.appendChild(renderProfileCard(u)));
      content.appendChild(followWrap);
    }

    if (view === 'info' || view === 'инфо сайта') {
      content.innerHTML = `<h2>Инфо сайта</h2>
        <div class="card-small">
          <div><strong>${escapeHtml(data.meta?.site_name || 'Site')}</strong></div>
          <div class="label">Версия: ${escapeHtml(data.meta?.version || '1.0')}</div>
          <div class="label">Игроков: ${users.length}</div>
        </div>`;
    }
  }

  // ---- Edit / Create / Delete (локально) ----
  function createPlayerPrompt() {
    const username = prompt('Username (латиница, уникальный)');
    if (!username) return;
    const display = prompt('Display name', username) || username;
    const bio = prompt('Bio', '');
    const role = prompt('Role (user/leader/follower)', 'user') || 'user';
    // For real: отправлять на сервер. Тут — открываем JSON для скачивания и администрирования ботом.
    alert('Для простоты: добавление через бота (используйте команду /addplayer). Эта страница читает players.json.');
  }

  function editPlayerPrompt(id) {
    alert('Редактирование: используйте бота для изменений (команда /editplayer). Для локальных правок — вручную правьте players.json.');
  }

  function deletePlayerConfirm(id) {
    if (!confirm('Удалить игрока (требуется правка players.json или бот)?')) return;
    alert('Для удаления используйте бота /delplayer или вручную измените players.json на хостинге.');
  }

  // utils
  function escapeHtml(s) {
    if (!s && s !== 0) return '';
    return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
}
