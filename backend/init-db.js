const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Progress table
  db.run(`CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module TEXT NOT NULL CHECK(module IN ('phonics', 'vocabulary', 'comprehension')),
    score INTEGER DEFAULT 0,
    badges_earned TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Content table
  db.run(`CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('story', 'worksheet')),
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(teacher_id) REFERENCES users(id)
  )`);

  // Insert sample data
  db.run(`INSERT INTO users (email, password, role) VALUES 
    ('student@example.com', 'password123', 'student'),
    ('teacher@example.com', 'password123', 'teacher')`);

  db.run(`INSERT INTO progress (user_id, module, score, badges_earned) VALUES
    (1, 'phonics', 45, '["beginner_phonics"]'),
    (1, 'vocabulary', 20, '[]'),
    (1, 'comprehension', 10, '[]')`);

  console.log('Database initialized with sample data');
});

db.close();