const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-here'; // Change this in production

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const db = new sqlite3.Database('./database.db');

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, TXT, JPG, JPEG, and PNG files are allowed!'));
        }
    }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Role-based access control
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

// Authentication routes
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // For demo purposes, we'll use simple password comparison
            // In production, use bcrypt.compare for hashed passwords
            const isValid = password === 'password123' || await bcrypt.compare(password, user.password);

            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    department: user.department,
                    position: user.position
                }
            });
        }
    );
});

// Get current user profile
app.get('/api/profile', authenticateToken, (req, res) => {
    db.get(
        'SELECT id, username, email, first_name, last_name, role, department, position FROM users WHERE id = ?',
        [req.user.id],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(user);
        }
    );
});

// Research project routes
app.get('/api/research-projects', authenticateToken, (req, res) => {
    let query = `
        SELECT rp.*, u.first_name, u.last_name, u.department
        FROM research_projects rp
        JOIN users u ON rp.researcher_id = u.id
    `;
    let params = [];

    // Filter by researcher for researchers role
    if (req.user.role === 'researcher') {
        query += ' WHERE rp.researcher_id = ?';
        params.push(req.user.id);
    }

    query += ' ORDER BY rp.created_at DESC';

    db.all(query, params, (err, projects) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(projects);
    });
});

// Get specific research project
app.get('/api/research-projects/:id', authenticateToken, (req, res) => {
    const projectId = req.params.id;
    
    db.get(
        `SELECT rp.*, u.first_name, u.last_name, u.department, u.position
         FROM research_projects rp
         JOIN users u ON rp.researcher_id = u.id
         WHERE rp.id = ?`,
        [projectId],
        (err, project) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            
            // Check if user has permission to view this project
            if (req.user.role === 'researcher' && project.researcher_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            res.json(project);
        }
    );
});

// Create research project
app.post('/api/research-projects', authenticateToken, requireRole(['researcher']), (req, res) => {
    const { title, description, category } = req.body;

    if (!title || !category) {
        return res.status(400).json({ error: 'Title and category are required' });
    }

    db.run(
        'INSERT INTO research_projects (researcher_id, title, description, category) VALUES (?, ?, ?, ?)',
        [req.user.id, title, description, category],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ id: this.lastID, message: 'Research project created successfully' });
        }
    );
});

// Update research project
app.put('/api/research-projects/:id', authenticateToken, (req, res) => {
    const projectId = req.params.id;
    const { title, description, status, category } = req.body;

    // Check if user owns this project (for researchers) or has director privileges
    let query = 'SELECT researcher_id FROM research_projects WHERE id = ?';
    
    db.get(query, [projectId], (err, project) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check permissions
        if (req.user.role === 'researcher' && project.researcher_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Update project
        db.run(
            'UPDATE research_projects SET title = ?, description = ?, status = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [title, description, status, category, projectId],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ message: 'Research project updated successfully' });
            }
        );
    });
});

// File upload for research projects
app.post('/api/research-projects/:id/upload', authenticateToken, upload.single('document'), (req, res) => {
    const projectId = req.params.id;
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check if user owns this project or has appropriate permissions
    db.get(
        'SELECT researcher_id FROM research_projects WHERE id = ?',
        [projectId],
        (err, project) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            
            if (req.user.role === 'researcher' && project.researcher_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            // Save document information
            db.run(
                'INSERT INTO documents (research_project_id, filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
                [projectId, req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    res.json({ 
                        id: this.lastID, 
                        message: 'Document uploaded successfully',
                        filename: req.file.filename,
                        original_name: req.file.originalname
                    });
                }
            );
        }
    );
});

// Get documents for a research project
app.get('/api/research-projects/:id/documents', authenticateToken, (req, res) => {
    const projectId = req.params.id;
    
    db.all(
        'SELECT * FROM documents WHERE research_project_id = ? ORDER BY uploaded_at DESC',
        [projectId],
        (err, documents) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(documents);
        }
    );
});

// Dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const stats = {};
    
    // Get project counts by status
    let query = 'SELECT status, COUNT(*) as count FROM research_projects';
    let params = [];
    
    if (req.user.role === 'researcher') {
        query += ' WHERE researcher_id = ?';
        params.push(req.user.id);
    }
    
    query += ' GROUP BY status';
    
    db.all(query, params, (err, statusCounts) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        stats.projectsByStatus = statusCounts;
        
        // Get total project count
        let totalQuery = 'SELECT COUNT(*) as total FROM research_projects';
        let totalParams = [];
        
        if (req.user.role === 'researcher') {
            totalQuery += ' WHERE researcher_id = ?';
            totalParams.push(req.user.id);
        }
        
        db.get(totalQuery, totalParams, (err, totalCount) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            stats.totalProjects = totalCount.total;
            
            // Get category counts
            let categoryQuery = 'SELECT category, COUNT(*) as count FROM research_projects';
            let categoryParams = [];
            
            if (req.user.role === 'researcher') {
                categoryQuery += ' WHERE researcher_id = ?';
                categoryParams.push(req.user.id);
            }
            
            categoryQuery += ' GROUP BY category';
            
            db.all(categoryQuery, categoryParams, (err, categoryCounts) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                
                stats.projectsByCategory = categoryCounts;
                res.json(stats);
            });
        });
    });
});

// Users management (for research director)
app.get('/api/users', authenticateToken, requireRole(['research_director']), (req, res) => {
    db.all(
        'SELECT id, username, email, first_name, last_name, role, department, position, created_at FROM users ORDER BY created_at DESC',
        [],
        (err, users) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(users);
        }
    );
});

// Serve the landing page as homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Serve static files (after custom routes)
app.use(express.static('frontend'));

// Start server
app.listen(PORT, () => {
    console.log(`PRMSU Research Services server running on http://localhost:${PORT}`);
});

module.exports = app;