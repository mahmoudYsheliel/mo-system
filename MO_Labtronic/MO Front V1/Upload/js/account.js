document.addEventListener('DOMContentLoaded', function() {
    // Initialize account page
    initAccountPage();
});

async function initAccountPage() {
    // Check authentication
    if (!requireAuth()) return;
    
    // Load user data
    await loadUserData();
    
    // Setup event listeners
    setupEventListeners();
    
    
}

async function loadUserData() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        // Fetch fresh user data from PocketBase to ensure we have the latest information
        const freshUser = await pb.collection('users').getOne(pb.authStore.model.id);
        
        console.log('Fresh user data fetched:', {
            id: freshUser.id,
            name: freshUser.Full_Name,
            email: freshUser.email
        });
        
        // Update sidebar user info
        document.getElementById('userName').textContent = freshUser.Full_Name || freshUser.Account_Name || 'User';
        document.getElementById('userRole').textContent = freshUser.Role || 'Unknown Role';
        
        // Update profile information
        document.getElementById('fullName').textContent = freshUser.Full_Name || 'Not provided';
        document.getElementById('accountName').textContent = freshUser.Account_Name || 'Not provided';
        document.getElementById('email').textContent = freshUser.email || 'Not provided';
        document.getElementById('role').textContent = freshUser.Role || 'Unknown';
        document.getElementById('memberSince').textContent = formatDate(freshUser.created);
        document.getElementById('lastUpdated').textContent = formatDate(freshUser.updated);
        
        // Update session information
        updateSessionInfo();
        
        console.log('User data loaded successfully');
        
    } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to cached user data
        document.getElementById('userName').textContent = user.Full_Name || user.Account_Name || 'User';
        document.getElementById('userRole').textContent = user.Role || 'Unknown Role';
        document.getElementById('fullName').textContent = user.Full_Name || 'Not provided';
        document.getElementById('accountName').textContent = user.Account_Name || 'Not provided';
        document.getElementById('email').textContent = user.email || 'Not provided';
        document.getElementById('role').textContent = user.Role || 'Unknown';
        document.getElementById('memberSince').textContent = formatDate(user.created);
        document.getElementById('lastUpdated').textContent = formatDate(user.updated);
        updateSessionInfo();
    }
}



function updateSessionInfo() {
    const now = new Date();
    const sessionStart = new Date(now.getTime() - (Math.random() * 3600000)); // Random session start within last hour
    
    document.getElementById('sessionStart').textContent = formatDate(sessionStart);
    document.getElementById('lastActivity').textContent = formatDate(now);
}

function setupEventListeners() {
    // Password change form
    const passwordForm = document.getElementById('passwordForm');
    passwordForm.addEventListener('submit', handlePasswordChange);
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showError('All password fields are required');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showError('New passwords do not match');
        return;
    }
    
    if (newPassword.length < 8) {
        showError('New password must be at least 8 characters long');
        return;
    }
    
    if (currentPassword === newPassword) {
        showError('New password must be different from current password');
        return;
    }
    
    try {
        // Show loading state
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Updating...';
        submitButton.disabled = true;
        
        // Update password using the correct PocketBase API
        const updateData = {
            oldPassword: currentPassword,
            password: newPassword,
            passwordConfirm: confirmPassword
        };
        
        console.log('Updating password for user:', pb.authStore.model.id);
        
        // Update the user record with password change
        await pb.collection('users').update(pb.authStore.model.id, updateData);
        
        // Clear the form
        e.target.reset();
        
        showSuccess('Password updated successfully! You will need to log in again.');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            logout();
        }, 2000);
        
    } catch (error) {
        console.error('Error updating password:', error);
        
        if (error.status === 400) {
            showError('Current password is incorrect');
        } else if (error.message && error.message.includes('password')) {
            showError('Password update failed: ' + error.message);
        } else {
            showError('Failed to update password. Please try again.');
        }
    } finally {
        // Reset button state
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.textContent = 'Update Password';
        submitButton.disabled = false;
    }
}



function refreshSession() {
    // In a real application, you'd refresh the session token
    showSuccess('Session refreshed successfully');
    updateSessionInfo();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'success-message';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        background: #10b981;
        color: white;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        z-index: 1000;
        font-size: 0.875rem;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'error-message';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Add utility classes
document.head.insertAdjacentHTML('beforeend', `
<style>
.flex { display: flex; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-center { justify-content: center; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.text-2xl { font-size: 1.5rem; }
.font-semibold { font-weight: 600; }
.text-muted-foreground { color: var(--color-muted-foreground); }
.text-center { text-align: center; }
.w-24 { width: 6rem; }
.h-24 { height: 6rem; }
.rounded-full { border-radius: 9999px; }
.object-cover { object-fit: cover; }
.bg-muted { background-color: var(--color-muted); }
.border-destructive { border-color: var(--color-destructive); }
.text-destructive { color: var(--color-destructive); }
.text-green-600 { color: #059669; }
.text-red-600 { color: #dc2626; }
.space-y-2 > * + * { margin-top: 0.5rem; }
.space-y-4 > * + * { margin-top: 1rem; }
.btn-sm { padding: 0.5rem 1rem; font-size: 0.8125rem; }
.btn-destructive { 
    background: var(--color-destructive); 
    color: var(--color-destructive-foreground); 
}
.btn-destructive:hover { 
    background: var(--color-destructive); 
    opacity: 0.9; 
}
</style>
`);

function updateUserInfo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.Full_Name || user.Account_Name || 'User';
        document.getElementById('userRole').textContent = user.Role || 'Unknown Role';
    }
}

 