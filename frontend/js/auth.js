// Authentication utility functions
const Auth = {
  // Check if user is logged in
  isAuthenticated: () => {
    return localStorage.getItem('token') !== null;
  },

  // Get current user role
  getCurrentUserRole: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const decoded = jwt_decode(token);
      return decoded.role;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  // Redirect to login if not authenticated
  requireAuth: (role) => {
    if (!Auth.isAuthenticated()) {
      window.location.href = 'index.html';
      return false;
    }

    if (role && Auth.getCurrentUserRole() !== role) {
      window.location.href = 'index.html';
      return false;
    }

    return true;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  }
};

// Initialize jwt-decode library
const jwt_decode = (token) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};

// Add logout button event listener if exists
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', Auth.logout);
  }

  // Redirect authenticated users away from login page
  if (window.location.pathname.includes('index.html') && Auth.isAuthenticated()) {
    const role = Auth.getCurrentUserRole();
    if (role === 'teacher') {
      window.location.href = 'teacher-dashboard.html';
    } else {
      window.location.href = 'student-dashboard.html';
    }
  }
});