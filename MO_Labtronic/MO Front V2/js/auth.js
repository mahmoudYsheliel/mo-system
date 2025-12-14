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
    
    // Check for remembered login in localStorage
    const rememberedToken = localStorage.getItem('authToken');
    const rememberedUser = localStorage.getItem('userData');
    if (rememberedToken && rememberedUser) {
        currentUser = JSON.parse(rememberedUser);
        pb.authStore.save(rememberedToken, currentUser);
        authToken = rememberedToken;
        return true;
    }
    // Check for session login in sessionStorage
    const sessionToken = sessionStorage.getItem('authToken');
    const sessionUser = sessionStorage.getItem('userData');
    if (sessionToken && sessionUser) {
        currentUser = JSON.parse(sessionUser);
        pb.authStore.save(sessionToken, currentUser);
        authToken = sessionToken;
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
            
            // Debug logging
            console.log('Login successful:', {
                email: email,
                role: currentUser.Role,
                user: currentUser
            });
            
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

function updateUserInfo() {
    const user = getCurrentUser();
    if (user) {
        const userNameElement = document.getElementById('userName');
        const userRoleElement = document.getElementById('userRole');
        if (userNameElement) {
            userNameElement.textContent = user.Full_Name || user.Account_Name || 'User';
        }
        if (userRoleElement) {
            userRoleElement.textContent = user.Role || 'Unknown Role';
        }
    }
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
const permissions = {
    'Design Engineer': ['add_mo', 'add_project', 'add_parts', 'view_all'],
    'Production Engineer': ['change_process_status', 'change_status', 'view_all'],
    'Project Manager': ['view_own_projects', 'view_related_mos'],
    'Supervisor': ['view_all_projects', 'view_all_mos', 'full_access', 'change_status']
};

function canAccess(feature) {
    const role = getUserRole();
    return permissions[role]?.includes(feature) || false;
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

async function loadAndDisplayNotificationCount() {
    const user = getCurrentUser();
    if (!user) return;

    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    try {
        const result = await pb.collection('Notifications').getList(1, 1, {
            filter: `Recipient = "${user.id}" && Action_Taken = false`
        });

        const count = result.totalItems;

        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to load notification count:', error);
        badge.style.display = 'none';
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the login page
    const isLoginPage = window.location.pathname.endsWith('index.html') || 
                       window.location.pathname.endsWith('/') ||
                       window.location.pathname === '';
    
    const onAuthSuccess = () => {
        updateNavigation();
        updateUserInfo();
        loadAndDisplayNotificationCount();
        initMobileSidebar();
        document.dispatchEvent(new CustomEvent('auth-ready'));
    };
    
    if (!isLoginPage) {
        // We're on a protected page, check authentication
        if (!initAuth()) {
            window.location.href = 'index.html';
            return;
        }

        if (pb.authStore.isValid) {
            pb.collection('users').authRefresh().then((authData) => {
                currentUser = authData.record;
                authToken = authData.token;
                
                if (localStorage.getItem('authToken')) {
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('userData', JSON.stringify(currentUser));
                } else if (sessionStorage.getItem('authToken')) {
                    sessionStorage.setItem('authToken', authToken);
                    sessionStorage.setItem('userData', JSON.stringify(currentUser));
                }
                onAuthSuccess();
            }).catch((error) => {
                console.error("Token refresh failed, logging out.", error);
                logout();
            });
        } else {
             onAuthSuccess();
        }
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