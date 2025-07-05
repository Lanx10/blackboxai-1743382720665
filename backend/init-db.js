const sqlite3 = require('sqlite3').verbose();

// Create database
const db = new sqlite3.Database('./database.db');

// Create tables
db.serialize(() => {
    // Users table with roles
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('researcher', 'research_director', 'inhouse')),
            department TEXT,
            position TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Research projects table
    db.run(`
        CREATE TABLE IF NOT EXISTS research_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            researcher_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed')),
            category TEXT NOT NULL CHECK (category IN ('proposal', 'inhouse', 'research_paper')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (researcher_id) REFERENCES users (id)
        )
    `);

    // Documents table for file uploads
    db.run(`
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            research_project_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            mime_type TEXT,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (research_project_id) REFERENCES research_projects (id)
        )
    `);

    // Comments/Reviews table
    db.run(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            research_project_id INTEGER NOT NULL,
            reviewer_id INTEGER NOT NULL,
            comment TEXT NOT NULL,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (research_project_id) REFERENCES research_projects (id),
            FOREIGN KEY (reviewer_id) REFERENCES users (id)
        )
    `);

    // Insert default admin user (Research Director)
    db.run(`
        INSERT OR IGNORE INTO users (username, password, email, first_name, last_name, role, department, position)
        VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@prmsu.edu.ph', 'Admin', 'User', 'research_director', 'Research Office', 'Research Director')
    `);

    // Insert sample researcher
    db.run(`
        INSERT OR IGNORE INTO users (username, password, email, first_name, last_name, role, department, position)
        VALUES ('researcher1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'researcher1@prmsu.edu.ph', 'John', 'Doe', 'researcher', 'Computer Science', 'Instructor')
    `);

    // Insert sample inhouse user
    db.run(`
        INSERT OR IGNORE INTO users (username, password, email, first_name, last_name, role, department, position)
        VALUES ('inhouse1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inhouse1@prmsu.edu.ph', 'Jane', 'Smith', 'inhouse', 'Research Office', 'Research Assistant')
    `);

    console.log('Database tables created successfully');
});

db.close();