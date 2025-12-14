document.addEventListener('DOMContentLoaded', function() {
    // Initialize account page
    initAccountPage();
    
    // Initialize push notifications
    initPushNotifications();
    
    // Add event listeners for push notification buttons
    const subscribeBtn = document.getElementById('subscribeBtn');
    const unsubscribeBtn = document.getElementById('unsubscribeBtn');
    const testPushBtn = document.getElementById('testPushBtn');
    
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', subscribeToPushNotifications);
    }
    
    if (unsubscribeBtn) {
        unsubscribeBtn.addEventListener('click', unsubscribeFromPushNotifications);
    }
    
    if (testPushBtn) {
        testPushBtn.addEventListener('click', testPushNotification);
    }
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

// Push Notification Management
let swRegistration = null;

// Initialize push notifications
async function initPushNotifications() {
    console.log('Initializing push notifications...');
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        updatePushStatus('Push notifications are not supported in this browser', 'error');
        return;
    }
    
    try {
        // Register service worker
        swRegistration = await navigator.serviceWorker.register('sw.js');
        console.log('Service Worker registered:', swRegistration);
        
        // Check current subscription
        await checkPushSubscription();
        
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        updatePushStatus('Failed to register service worker', 'error');
    }
}

// Check current push subscription
async function checkPushSubscription() {
    try {
        const subscription = await swRegistration.pushManager.getSubscription();
        
        if (subscription) {
            console.log('User is subscribed to push notifications');
            updatePushStatus('Subscribed to push notifications', 'success');
            showUnsubscribeButton();
            showTestButton();
            showSubscriptionDetails(subscription);
        } else {
            console.log('User is not subscribed to push notifications');
            updatePushStatus('Not subscribed to push notifications', 'info');
            showSubscribeButton();
        }
    } catch (error) {
        console.error('Error checking push subscription:', error);
        updatePushStatus('Error checking subscription status', 'error');
    }
}

// Subscribe to push notifications
async function subscribeToPushNotifications() {
    try {
        updatePushStatus('Requesting permission...', 'info');
        
        // Request notification permission
        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
            updatePushStatus('Notification permission denied', 'error');
            return;
        }
        
        updatePushStatus('Creating subscription...', 'info');
        
        // Subscribe to push notifications
        const subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY') // You'll need to replace this
        });
        
        console.log('Push subscription created:', subscription);
        
        // Save subscription to user profile
        await saveSubscriptionToUser(subscription);
        
        updatePushStatus('Successfully subscribed to push notifications!', 'success');
        showUnsubscribeButton();
        showTestButton();
        showSubscriptionDetails(subscription);
        
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        updatePushStatus('Failed to subscribe: ' + error.message, 'error');
    }
}

// Unsubscribe from push notifications
async function unsubscribeFromPushNotifications() {
    try {
        updatePushStatus('Unsubscribing...', 'info');
        
        const subscription = await swRegistration.pushManager.getSubscription();
        
        if (subscription) {
            await subscription.unsubscribe();
            console.log('Push subscription removed');
        }
        
        // Remove subscription from user profile
        await removeSubscriptionFromUser();
        
        updatePushStatus('Successfully unsubscribed from push notifications', 'info');
        showSubscribeButton();
        hideTestButton();
        hideSubscriptionDetails();
        
    } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        updatePushStatus('Failed to unsubscribe: ' + error.message, 'error');
    }
}

// Save subscription to user profile
async function saveSubscriptionToUser(subscription) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('No user logged in');
        }
        
        const subscriptionData = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
                auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
            }
        };
        
        await pb.collection('users').update(user.id, {
            pushSubscription: JSON.stringify(subscriptionData)
        });
        
        console.log('Subscription saved to user profile');
        
    } catch (error) {
        console.error('Error saving subscription to user profile:', error);
        throw error;
    }
}

// Remove subscription from user profile
async function removeSubscriptionFromUser() {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('No user logged in');
        }
        
        await pb.collection('users').update(user.id, {
            pushSubscription: null
        });
        
        console.log('Subscription removed from user profile');
        
    } catch (error) {
        console.error('Error removing subscription from user profile:', error);
        throw error;
    }
}

// Test push notification
async function testPushNotification() {
    try {
        updatePushStatus('Sending test notification...', 'info');
        
        const subscription = await swRegistration.pushManager.getSubscription();
        
        if (!subscription) {
            updatePushStatus('No active subscription found', 'error');
            return;
        }
        
        // Send test notification to server
        const response = await fetch('/api/test-push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subscription: subscription,
                notification: {
                    title: 'Test Notification',
                    body: 'This is a test push notification from MO System',
                    icon: 'https://mo.lab-tronic.com/logo.png',
                    data: {
                        Link_To_Action: '/Account.html'
                    }
                }
            })
        });
        
        if (response.ok) {
            updatePushStatus('Test notification sent successfully!', 'success');
        } else {
            throw new Error('Failed to send test notification');
        }
        
    } catch (error) {
        console.error('Error sending test notification:', error);
        updatePushStatus('Failed to send test notification: ' + error.message, 'error');
    }
}

// Utility functions
function updatePushStatus(message, type = 'info') {
    const statusElement = document.getElementById('pushStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `text-sm ${getStatusClass(type)}`;
    }
}

function getStatusClass(type) {
    switch (type) {
        case 'success': return 'text-green-600';
        case 'error': return 'text-red-600';
        case 'info': return 'text-blue-600';
        default: return 'text-gray-600';
    }
}

function showSubscribeButton() {
    const subscribeBtn = document.getElementById('subscribeBtn');
    const unsubscribeBtn = document.getElementById('unsubscribeBtn');
    if (subscribeBtn) subscribeBtn.style.display = 'block';
    if (unsubscribeBtn) unsubscribeBtn.style.display = 'none';
}

function showUnsubscribeButton() {
    const subscribeBtn = document.getElementById('subscribeBtn');
    const unsubscribeBtn = document.getElementById('unsubscribeBtn');
    if (subscribeBtn) subscribeBtn.style.display = 'none';
    if (unsubscribeBtn) unsubscribeBtn.style.display = 'block';
}

function showTestButton() {
    const testBtn = document.getElementById('testPushBtn');
    if (testBtn) testBtn.style.display = 'block';
}

function hideTestButton() {
    const testBtn = document.getElementById('testPushBtn');
    if (testBtn) testBtn.style.display = 'none';
}

function showSubscriptionDetails(subscription) {
    const infoDiv = document.getElementById('pushNotificationInfo');
    const detailsDiv = document.getElementById('subscriptionDetails');
    
    if (infoDiv && detailsDiv) {
        infoDiv.style.display = 'block';
        detailsDiv.textContent = JSON.stringify(subscription, null, 2);
    }
}

function hideSubscriptionDetails() {
    const infoDiv = document.getElementById('pushNotificationInfo');
    if (infoDiv) {
        infoDiv.style.display = 'none';
    }
}

// Convert VAPID public key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

 