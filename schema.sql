CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    role TEXT, -- Лидер, Заместитель, ПЗГС, ЗГС, Помощник
    description TEXT,
    avatar TEXT
);

CREATE TABLE banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image TEXT, -- путь или URL к баннеру
    title TEXT
);

CREATE TABLE site_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    info TEXT
);
