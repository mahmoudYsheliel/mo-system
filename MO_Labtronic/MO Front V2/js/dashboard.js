document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initDashboard();
});

async function initDashboard() {
    // Check authentication
    if (!requireAuth()) return;
    
    // Update user info
    updateUserInfo();
    
    // Load MO data
    await loadMOs();
    
    // Setup filter tabs
    setupFilterTabs();
    
    // Setup push notification test buttons
    setupPushNotificationTests();
}

async function loadMOs() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const moCardsContainer = document.getElementById('moCardsContainer');
    
    try {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        moCardsContainer.innerHTML = '';
        
        // Fetch MOs from PocketBase
        const records = await pb.collection('MO_Table').getList(1, 50, {
            sort: '-created'
        });
        
        const mos = records.items;
        
        // Fetch project details for each MO
        await fetchProjectDetails(mos);
        
        // Calculate completion for each MO based on parts processes
        await calculateMOCompletions(mos);
        
        // Update statistics
        updateStatistics(mos);
        
        // Render MO cards
        if (mos.length > 0) {
            renderMOCards(mos);
        } else {
            showEmptyState();
        }
        
    } catch (error) {
        console.error('Error loading MOs:', error);
        showError('Failed to load Manufacturing Orders');
    } finally {
        loadingState.style.display = 'none';
    }
}

async function fetchProjectDetails(mos) {
    try {
        // Get unique project codes
        const projectCodes = [...new Set(mos.map(mo => mo.Project_Name).filter(Boolean))];
        
        if (projectCodes.length === 0) return;
        
        // Fetch all projects in one query using correct field names
        const projectRecords = await pb.collection('Projects').getList(1, 200, {
            filter: projectCodes.map(code => `Project_Code = "${code}"`).join(' || '),
            fields: 'id,University,Lab,Project_Name,Project_Code,Project_Manager,Design_Engineer,Production_Engineer,created,updated'
        });
        
        // Create a map of project code to project details
        const projectMap = {};
        projectRecords.items.forEach(project => {
            projectMap[project.Project_Code] = project;
        });
        
        // Attach project details to each MO
        mos.forEach(mo => {
            if (mo.Project_Name && projectMap[mo.Project_Name]) {
                mo.projectDetails = projectMap[mo.Project_Name];
            }
        });
        
    } catch (error) {
        console.error('Error fetching project details:', error);
    }
}

async function calculateMOCompletions(mos) {
    try {
        // Get all MO names
        const moNames = mos.map(mo => mo.MO_Name);
        
        if (moNames.length === 0) return;
        
        // Fetch all parts for all MOs in one query
        const allPartsRecords = await pb.collection('Parts_Table').getList(1, 2000, {
            filter: moNames.map(name => `MO_Name = "${name}"`).join(' || ')
        });
        
        // Group parts by MO name
        const partsByMO = {};
        allPartsRecords.items.forEach(part => {
            if (!partsByMO[part.MO_Name]) {
                partsByMO[part.MO_Name] = [];
            }
            partsByMO[part.MO_Name].push(part);
        });
        
        // Calculate completion and assign parts count for each MO
        mos.forEach(mo => {
            const parts = partsByMO[mo.MO_Name] || [];
            mo.Completed = calculateCompletionPercentage(parts);
            mo.PartsCount = parts.length;
        });
        
    } catch (error) {
        console.error('Error calculating MO completions:', error);
        // Set default completion if calculation fails
        mos.forEach(mo => {
            mo.Completed = 0;
            mo.PartsCount = 0;
        });
    }
}

function calculateCompletionPercentage(parts) {
    if (!parts || parts.length === 0) {
        return 0;
    }
    
    let totalProcesses = 0;
    let completedProcesses = 0;
    
    parts.forEach(part => {
        // Check all 5 processes for each part
        for (let i = 1; i <= 5; i++) {
            const processField = `Process${i}`;
            const statusField = `Process${i}_Status`;
            
            if (part[processField] && part[processField].trim() !== '') {
                totalProcesses++;
                if (part[statusField] === 'Done') {
                    completedProcesses++;
                }
            }
        }
    });
    
    if (totalProcesses === 0) {
        return 0;
    }
    
    return Math.round((completedProcesses / totalProcesses) * 100);
}

function updateStatistics(mos) {
    const total = mos.length;
    const active = mos.filter(mo => mo.Completed > 0 && mo.Completed < 100).length;
    const notStarted = mos.filter(mo => mo.Completed === 0).length;
    const completed = mos.filter(mo => mo.Completed === 100).length;
    
    document.getElementById('totalMOs').textContent = total;
    document.getElementById('activeMOs').textContent = active;
    document.getElementById('notStartedMOs').textContent = notStarted;
    document.getElementById('completedMOs').textContent = completed;
}

function renderMOCards(mos) {
    const container = document.getElementById('moCardsContainer');
    container.innerHTML = '';
    
    mos.forEach(mo => {
        const card = createMOCard(mo);
        container.appendChild(card);
    });
}

function createMOCard(mo) {
    const card = document.createElement('div');
    card.className = 'card mo-card';
    card.onclick = () => window.location.href = `MO_Card.html?id=${mo.id}`;
    const status = getMOStatus(mo.Completed);
    const progressPercentage = mo.Completed || 0;
    const projectName = mo.projectDetails ? mo.projectDetails.Project_Name : mo.Project_Name;
    const university = mo.projectDetails ? mo.projectDetails.University : mo.University;
    const projectManager = mo.projectDetails ? mo.projectDetails.Project_Manager : mo.Project_Manager;
    const designEng = mo.projectDetails ? mo.projectDetails.Design_Engineer : mo.Design_Eng;
    const productionEng = mo.projectDetails ? mo.projectDetails.Production_Engineer : mo.Production_Eng;
    card.innerHTML = `
        <div class="card-header">
            <div class="flex items-center justify-between mb-1">
                <h3 class="card-title">${mo.MO_Name}</h3>
                <span class="badge badge-${status.badge}">${status.text}</span>
            </div>
            <div class="flex items-center justify-between mb-2" style="gap:1em;">
                <div class="card-subtitle" style="font-size:0.95em;color:#6B7280;">${projectName}</div>
                <div class="card-subtitle">${getMOTypeDisplay(mo.MO_Type)}</div>
            </div>
        </div>
        <div class="card-content">
            <div class="mb-3">
                <div class="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>${progressPercentage}%</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                </div>
            </div>
            <div class="mo-details">
                <div class="detail-row"><span class="detail-label">University:</span><span class="detail-value">${university || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Project Manager:</span><span class="detail-value">${projectManager || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Design Engineer:</span><span class="detail-value">${designEng || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Production Engineer:</span><span class="detail-value">${productionEng || 'N/A'}</span></div>
            </div>
            <div class="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                <span>🧩 ${mo.PartsCount !== undefined ? mo.PartsCount : 0} parts</span>
                <span>Created: ${formatDate(mo.created)}</span>
            </div>
        </div>
    `;
    return card;
}

function getMOStatus(completed) {
    if (completed === 0) {
        return { text: 'Not Started', badge: 'muted' };
    } else if (completed === 100) {
        return { text: 'Completed', badge: 'success' };
    } else {
        return { text: 'Active', badge: 'primary' };
    }
}

function getMOTypeDisplay(moType) {
    if (!moType) moType = 'Unknown';
    const normalized = moType.toLowerCase();
    const typeMap = {
       'sheetmetal': { icon: 'assets/icons/sheetmetal.svg', color: '#011a2e' },
        'lathe': { icon: 'assets/icons/lathe.svg', color: '#005599' },
        'milling': { icon: 'assets/icons/milling.svg', color: '#F59E42' },
        'printing': { icon: 'assets/icons/printing.svg', color: '#3998ff' },
    };
    const { icon, color } = typeMap[normalized] || { icon: '', color: '#6B7280' };
    const displayType = moType.charAt(0).toUpperCase() + moType.slice(1);
    return `<span class="mo-type-box" style="background:${color};">${icon ? `<img src='${icon}' alt='${displayType}' style='width:2em;height:2em;vertical-align:middle;margin-right:0.6em;'>` : ''}${displayType}</span>`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function setupFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab
            filterTabs.forEach(t => {
                t.classList.remove('active', 'btn-primary');
                t.classList.add('btn-secondary');
            });
            
            this.classList.add('active', 'btn-primary');
            this.classList.remove('btn-secondary');
            
            // Apply filter
            const filter = this.dataset.filter;
            applyFilter(filter);
        });
    });
}

function applyFilter(filter) {
    const moCards = document.querySelectorAll('.mo-card');
    
    moCards.forEach(card => {
        const badge = card.querySelector('.badge');
        const badgeText = badge.textContent.toLowerCase();
        
        let show = true;
        
        switch (filter) {
            case 'active':
                show = badgeText === 'active';
                break;
            case 'not-started':
                show = badgeText === 'not started';
                break;
            case 'all':
            default:
                show = true;
                break;
        }
        
        card.style.display = show ? 'block' : 'none';
    });
}

function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('moCardsContainer').innerHTML = '';
}

function showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'error-message';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '1rem';
    notification.style.right = '1rem';
    notification.style.zIndex = '1000';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Add utility classes for flexbox
document.head.insertAdjacentHTML('beforeend', `
<style>
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.text-2xl { font-size: 1.5rem; }
.text-3xl { font-size: 1.875rem; }
.text-4xl { font-size: 2.25rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.text-muted-foreground { color: var(--color-muted-foreground); }
.text-center { text-align: center; }
.mo-card { cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.mo-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

/* Mobile-responsive MO cards */
.mo-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--color-border);
}

.detail-row:last-child {
    border-bottom: none;
}

.detail-label {
    font-size: 0.75rem;
    color: var(--color-muted-foreground);
    font-weight: 500;
    min-width: 0;
    flex-shrink: 0;
}

.detail-value {
    font-size: 0.75rem;
    font-weight: 600;
    text-align: right;
    color: var(--color-foreground);
    word-break: break-word;
    max-width: 60%;
}

/* Progress bar styles */
.progress {
    width: 100%;
    height: 8px;
    background: var(--color-muted);
    border-radius: 4px;
    overflow: hidden;
    margin: 0.5rem 0;
}

.progress-bar {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.3s ease;
    border-radius: 4px;
}

/* Mobile-specific styles */
@media (max-width: 768px) {
    .mo-card {
        margin-bottom: 1rem;
    }
    
    .mo-details {
        gap: 0.25rem;
    }
    
    .detail-row {
        padding: 0.125rem 0;
    }
    
    .detail-label {
        font-size: 0.7rem;
    }
    
    .detail-value {
        font-size: 0.7rem;
        max-width: 50%;
    }
    
    .card-title {
        font-size: 1rem;
    }
    
    .card-subtitle {
        font-size: 0.8rem;
    }
    
    /* Adjust grid for mobile */
    .grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    /* Statistics cards mobile layout */
    .grid:first-child {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
    }
    
    /* Filter tabs mobile layout */
    #filterTabs {
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    #filterTabs .btn {
        flex: 1;
        min-width: 0;
        font-size: 0.8rem;
        padding: 0.5rem 0.75rem;
    }
}

@media (min-width: 769px) and (max-width: 1024px) {
    .grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
    
    /* Statistics cards tablet layout */
    .grid:first-child {
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
    }
}

@media (min-width: 1025px) {
    .grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
    }
    
    /* Statistics cards desktop layout */
    .grid:first-child {
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
    }
}
</style>
`); 

// Push Notification Test Functions
function setupPushNotificationTests() {
    const requestPermissionBtn = document.getElementById('requestPermission');
    const testBrowserBtn = document.getElementById('testBrowserNotification');
    const testPushBtn = document.getElementById('testPushNotification');
    const checkSWBtn = document.getElementById('checkServiceWorker');
    const checkPermissionBtn = document.getElementById('checkPermission');
    
    if (requestPermissionBtn) {
        requestPermissionBtn.addEventListener('click', requestNotificationPermission);
    }
    
    if (testBrowserBtn) {
        testBrowserBtn.addEventListener('click', testBrowserNotification);
    }
    
    if (testPushBtn) {
        testPushBtn.addEventListener('click', testPushNotification);
    }
    
    if (checkSWBtn) {
        checkSWBtn.addEventListener('click', checkServiceWorker);
    }
    
    if (checkPermissionBtn) {
        checkPermissionBtn.addEventListener('click', checkPermission);
    }
}

async function requestNotificationPermission() {
    showTestResult('Requesting notification permission...', 'info');
    
    try {
        if (!window.Notification) {
            showTestResult('❌ Notifications are not supported in this browser', 'error');
            return;
        }
        
        // Request permission
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            showTestResult('✅ Notification permission granted! You can now test notifications.', 'success');
            
            // Show a test notification immediately
            new Notification('Permission Granted!', {
                body: 'You can now receive notifications from MO System',
                icon: 'https://mo.lab-tronic.com/logo.png'
            });
        } else if (permission === 'denied') {
            showTestResult('❌ Permission denied. Please enable notifications in browser settings:', 'error');
            showTestResult('1. Click the lock icon in the address bar', 'info');
            showTestResult('2. Change "Notifications" from "Block" to "Allow"', 'info');
            showTestResult('3. Reload the page', 'info');
        } else {
            showTestResult('⚠️ Permission request was dismissed', 'info');
        }
        
    } catch (error) {
        showTestResult('❌ Error requesting permission: ' + error.message, 'error');
    }
}

async function testBrowserNotification() {
    showTestResult('Testing PushAlert notification...', 'info');
    try {
        if (typeof PushAlert !== 'undefined' && PushAlert.sendNotification) {
            PushAlert.sendNotification({
                title: 'Test Notification',
                message: 'This is a test notification from MO System (PushAlert)',
                url: '/dashboard.html',
                icon: 'https://mo.lab-tronic.com/logo.png'
            });
            showTestResult('✅ PushAlert notification sent! Check if you received it.', 'success');
        } else {
            showTestResult('❌ PushAlert is not loaded. Please check your integration.', 'error');
        }
    } catch (error) {
        showTestResult('❌ Error sending PushAlert notification: ' + error.message, 'error');
    }
}

async function testPushNotification() {
    showTestResult('Testing push notification...', 'info');
    try {
        // Check if service worker is registered
        if (!navigator.serviceWorker.controller) {
            showTestResult('❌ Service worker not in control. Please reload the page.', 'error');
            return;
        }
        // Check if push manager is available
        if (!('PushManager' in window)) {
            showTestResult('❌ Push notifications are not supported in this browser', 'error');
            return;
        }
        // Get current subscription
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            showTestResult('❌ No push subscription found. Please subscribe in Account page first.', 'error');
            return;
        }
        // Call backend endpoint to trigger push event
        const response = await fetch('/api/test-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: getCurrentUser()?.id })
        });
        if (response.ok) {
            showTestResult('✅ Push notification test triggered! Check if you received the notification.', 'success');
        } else {
            showTestResult('❌ Failed to trigger push notification.', 'error');
        }
    } catch (error) {
        showTestResult('❌ Error testing push notification: ' + error.message, 'error');
    }
}

async function checkServiceWorker() {
    showTestResult('Checking service worker status...', 'info');
    
    try {
        const results = [];
        
        // Check if service worker is supported
        if ('serviceWorker' in navigator) {
            results.push('✅ Service Worker API is supported');
        } else {
            results.push('❌ Service Worker API is not supported');
        }
        
        // Check if service worker is registered
        if (navigator.serviceWorker.controller) {
            results.push('✅ Service Worker is in control');
        } else {
            results.push('❌ Service Worker is not in control');
        }
        
        // Check service worker registration
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            results.push('✅ Service Worker is registered');
            results.push(`📋 Service Worker state: ${registration.active ? 'Active' : 'Inactive'}`);
        } else {
            results.push('❌ Service Worker is not registered');
        }
        
        // Check push manager
        if ('PushManager' in window) {
            results.push('✅ Push Manager is supported');
        } else {
            results.push('❌ Push Manager is not supported');
        }
        
        showTestResult(results.join('\n'), 'info');
        
    } catch (error) {
        showTestResult('❌ Error checking service worker: ' + error.message, 'error');
    }
}

async function checkPermission() {
    showTestResult('Checking notification permissions...', 'info');
    
    try {
        const results = [];
        
        // Check notification permission
        if (window.Notification) {
            const permission = Notification.permission;
            results.push(`📋 Notification permission: ${permission}`);
            
            if (permission === 'granted') {
                results.push('✅ Notifications are allowed');
            } else if (permission === 'default') {
                results.push('⚠️ Notifications permission not set (will ask when needed)');
            } else {
                results.push('❌ Notifications are blocked');
            }
        } else {
            results.push('❌ Notifications API not supported');
        }
        
        // Check service worker permission
        if ('serviceWorker' in navigator) {
            const permission = await navigator.permissions.query({ name: 'notifications' });
            results.push(`📋 Service Worker notification permission: ${permission.state}`);
        }
        
        showTestResult(results.join('\n'), 'info');
        
    } catch (error) {
        showTestResult('❌ Error checking permissions: ' + error.message, 'error');
    }
}

function showTestResult(message, type = 'info') {
    const resultsDiv = document.getElementById('testResults');
    const contentDiv = document.getElementById('testResultsContent');
    
    if (resultsDiv && contentDiv) {
        resultsDiv.style.display = 'block';
        
        const timestamp = new Date().toLocaleTimeString();
        const formattedMessage = message.replace(/\n/g, '<br>');
        
        contentDiv.innerHTML = `
            <div class="mb-2">
                <span class="text-xs text-gray-500">[${timestamp}]</span>
                <span class="${getResultClass(type)}">${formattedMessage}</span>
            </div>
        `;
        
        // Scroll to results
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

function getResultClass(type) {
    switch (type) {
        case 'success': return 'text-green-600 font-medium';
        case 'error': return 'text-red-600 font-medium';
        case 'info': return 'text-blue-600';
        default: return 'text-gray-600';
    }
} 