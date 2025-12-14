// PocketBase Configuration
const pb = new PocketBase('https://mo.lab-tronic.com/database');

// Authentication State
let currentUser = null;
let authToken = null;

// Initialize authentication
function initAuth() {
    // Check for existing session
    if (pb.authStore.isValid) {
        currentUser = pb.authStore.model;
        authToken = pb.authStore.token;
        return true;
    }
    
    // Check for remembered login
    const rememberedToken = localStorage.getItem('authToken');
    if (rememberedToken) {
        pb.authStore.save(rememberedToken, currentUser);
        return true;
    }
    
    return false;
}

// Login function
async function login(email, password, rememberMe = false) {
    try {
        const authData = await pb.collection('users').authWithPassword(email, password);
        
        if (authData.record) {
            currentUser = authData.record;
            authToken = authData.token;
            
            if (rememberMe) {
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('userData', JSON.stringify(currentUser));
            } else {
                sessionStorage.setItem('authToken', authToken);
                sessionStorage.setItem('userData', JSON.stringify(currentUser));
            }
            
            return { success: true, user: currentUser };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Logout function
function logout() {
    pb.authStore.clear();
    currentUser = null;
    authToken = null;
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userData');
    
    window.location.href = 'index.html';
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is authenticated
function isAuthenticated() {
    return pb.authStore.isValid && currentUser !== null;
}

// Check user role
function getUserRole() {
    return currentUser?.Role || null;
}

// Check permissions
function hasPermission(permission) {
    const role = getUserRole();
    const permissions = {
        'Design Engineer': ['add_mo', 'add_parts', 'view_all'],
        'Production Engineer': ['change_process_status', 'view_all'],
        'Project Manager': ['view_own_projects', 'view_related_mos'],
        'Supervisor': ['view_all_projects', 'view_all_mos', 'full_access']
    };
    
    return permissions[role]?.includes(permission) || false;
}

// Check if user can access feature
function canAccess(feature) {
    const role = getUserRole();
    
    switch (feature) {
        case 'add_mo':
            return role === 'Design Engineer';
        case 'change_status':
            return role === 'Production Engineer' || role === 'Supervisor';
        case 'view_all_projects':
            return role === 'Supervisor';
        case 'view_own_projects':
            return role === 'Project Manager';
        default:
            return true;
    }
}

// Redirect if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Redirect if no permission
function requirePermission(permission) {
    if (!hasPermission(permission)) {
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

// Update navigation based on user role
function updateNavigation() {
    const navItems = document.querySelectorAll('[data-access]');
    
    navItems.forEach(item => {
        const requiredAccess = item.dataset.access;
        if (!canAccess(requiredAccess)) {
            item.style.display = 'none';
        }
    });
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the login page
    const isLoginPage = window.location.pathname.endsWith('index.html') || 
                       window.location.pathname.endsWith('/') ||
                       window.location.pathname === '';
    
    if (!isLoginPage) {
        // We're on a protected page, check authentication
        if (!initAuth()) {
            window.location.href = 'index.html';
            return;
        }
        updateNavigation();
        
        // Initialize mobile sidebar functionality
        initMobileSidebar();
    } else {
        // We're on the login page, check if user is already logged in
        if (initAuth()) {
            // User is already logged in, redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    }
});

// Global mobile sidebar functionality
function initMobileSidebar() {
    // Global toggleSidebar function
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile && sidebar) {
            sidebar.classList.toggle('open');
        }
    };
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebar');
        const mobileToggle = document.querySelector('.mobile-toggle');
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile && sidebar && sidebar.classList.contains('open')) {
            // If clicking outside sidebar and toggle buttons
            if (!sidebar.contains(event.target) && 
                !mobileToggle?.contains(event.target) && 
                !sidebarToggle?.contains(event.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const sidebar = document.getElementById('sidebar');
        const isMobile = window.innerWidth <= 768;
        
        if (sidebar && !isMobile) {
            // On desktop: remove mobile-specific classes
            sidebar.classList.remove('open');
        }
    });
    
    // Close sidebar when pressing Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const sidebar = document.getElementById('sidebar');
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile && sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });
} 