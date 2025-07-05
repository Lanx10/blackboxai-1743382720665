# PRMSU Research Services Management System

A comprehensive web application for managing research services at President Ramon Magsaysay State University (PRMSU).

## Features

### Three User Types:
1. **Researchers (Instructors)** - Create and manage research projects, proposals, and papers
2. **Research Director** - Oversee all research activities, approve/reject proposals, manage users
3. **Inhouse Users** - Manage internal research projects and facilitate collaboration

### Core Functionality:
- **Beautiful Landing Page**: Modern, responsive homepage showcasing system features
- **Project Management**: Create, track, and manage research projects across three categories:
  - Research Proposals
  - Inhouse Research Projects  
  - Research Papers
- **Document Management**: Upload and organize research documents (PDF, DOC, DOCX, TXT)
- **User Authentication**: Role-based access control with JWT tokens
- **Dashboard Analytics**: Real-time statistics and progress tracking
- **Collaboration Tools**: Connect researchers and facilitate partnerships
- **Approval Workflow**: Submission and review process for research proposals

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome 6
- **File Upload**: Multer middleware
- **Authentication**: JWT (JSON Web Tokens)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Initialize the database:
```bash
node backend/init-db.js
```

3. Start the server:
```bash
npm start
```
Or for development:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Demo Accounts

The system comes with pre-configured demo accounts:

- **Research Director**: 
  - Username: `admin`
  - Password: `password123`

- **Researcher**: 
  - Username: `researcher1`
  - Password: `password123`

- **Inhouse User**: 
  - Username: `inhouse1`
  - Password: `password123`

## Project Structure

```
/
├── backend/
│   ├── server.js          # Main server file
│   └── init-db.js         # Database initialization
├── frontend/
│   ├── landing.html       # Beautiful homepage (/)
│   ├── index.html         # Login page (/login)
│   ├── researcher-dashboard.html
│   ├── director-dashboard.html
│   └── inhouse-dashboard.html
├── uploads/               # File upload directory
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/login` - User authentication
- `GET /api/profile` - Get current user profile

### Research Projects
- `GET /api/research-projects` - Get all projects (filtered by user role)
- `GET /api/research-projects/:id` - Get specific project
- `POST /api/research-projects` - Create new project
- `PUT /api/research-projects/:id` - Update project
- `POST /api/research-projects/:id/upload` - Upload document
- `GET /api/research-projects/:id/documents` - Get project documents

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### User Management (Research Director only)
- `GET /api/users` - Get all users

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `password` - Hashed password
- `email` - User email
- `first_name`, `last_name` - User names
- `role` - User role (researcher, research_director, inhouse)
- `department` - User department
- `position` - User position

### Research Projects Table
- `id` - Primary key
- `researcher_id` - Foreign key to users
- `title` - Project title
- `description` - Project description
- `status` - Project status (draft, submitted, under_review, approved, rejected, completed)
- `category` - Project category (proposal, inhouse, research_paper)
- `created_at`, `updated_at` - Timestamps

### Documents Table
- `id` - Primary key
- `research_project_id` - Foreign key to research_projects
- `filename` - Stored filename
- `original_name` - Original filename
- `file_path` - File path on server
- `file_size` - File size in bytes
- `mime_type` - File MIME type

## Security Features

- JWT-based authentication
- Role-based access control
- File type validation for uploads
- SQL injection prevention
- CORS protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is developed for PRMSU and is intended for educational and research purposes.
