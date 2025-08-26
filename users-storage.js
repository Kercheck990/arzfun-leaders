// Хранилище пользователей для GitHub Pages (localStorage)
const STORAGE_KEY = 'arzfun_users';

export function loadUsers() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

export function saveUsers(users) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
        // Ошибка сохранения
    }
}