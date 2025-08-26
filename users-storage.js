import { loadUsers, saveUsers } from './users-storage.js';

// Получить пользователей
let users = loadUsers();

// Добавить нового пользователя
users.push({ nick: "Test", pass: "123", role: "Игрок" });

// Сохранить изменения
saveUsers(users);
