const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');  // Для PostgreSQL
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.postgresql://forumdb_4e45_user:cHuBLFyR29taGMpksKrAZ8rzd9hFN7Vj@dpg-cvh5s3pu0jms73bi8omg-a/forumdb_4e45,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Обработчик для корневого пути "/"
app.get("/", (req, res) => {
  res.send("Сервер работает!");
});

// Пример API: получаем все посты
app.get("/api/posts", (req, res) => {
  res.json({ message: "Все посты" });
});

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try 
    {
        await pool.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3)", [username, email, hashedPassword]);
        res.json({ message: "Пользователь зарегистрирован!" });
    } catch (err) 
    {
        res.status(500).json({ error: err.message });
    }
});

// Вход пользователя
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length > 0 && await bcrypt.compare(password, user.rows[0].password)) 
    {
        const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET);
        res.json({ token });
    } 
    else 
    {
        res.status(401).json({ error: "Неверный логин или пароль" });
    }
});

// Получение всех веток
app.get('/api/threads', async (req, res) => {
    const threads = await pool.query("SELECT threads.*, users.username FROM threads JOIN users ON threads.user_id = users.id ORDER BY created_at DESC");
    res.json(threads.rows);
});

// Создание ветки
app.post('/api/threads', async (req, res) => {
    const { title, content, user_id } = req.body;
    await pool.query("INSERT INTO threads (title, content, user_id) VALUES ($1, $2, $3)", [title, content, user_id]);
    res.json({ message: "Ветка создана" });
});

// Получение комментариев по ветке
app.get('/api/comments/:thread_id', async (req, res) => {
    const { thread_id } = req.params;
    const comments = await pool.query("SELECT comments.*, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE thread_id = $1 ORDER BY created_at", [thread_id]);
    res.json(comments.rows);
});

// Создание комментария
app.post('/api/comments', async (req, res) => {
    const { text, thread_id, user_id } = req.body;
    await pool.query("INSERT INTO comments (text, thread_id, user_id) VALUES ($1, $2, $3)", [text, thread_id, user_id]);
    res.json({ message: "Комментарий добавлен" });
});

// Запуск сервера
const PORT = process.env.PORT || 3000; // Используем порт, заданный в переменной окружения или 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
