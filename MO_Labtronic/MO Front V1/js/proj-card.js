document.addEventListener('DOMContentLoaded', function() {
    // Initialize project card page
    initProjectCardPage();
    
    // Add resize listener for responsive MO display
    window.addEventListener('resize', function() {
        if (currentProject && projectMOs.length > 0) {
            renderMOsTable(); // This will check screen size and render appropriately
        }
    });
});

let currentProject = null;
let projectMOs = [];

async function initProjectCardPage() {
    // Check authentication
    if (!requireAuth()) return;
    
    // Update user info
    updateUserInfo();
    
    // Get project code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) {
        showError('No project ID provided');
        return;
    }
    
    // Load project and MO data
    await loadProjectAndMOs(projectId);
}

function updateUserInfo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.Full_Name || user.Account_Name || 'User';
        document.getElementById('userRole').textContent = user.Role || 'Unknown Role';
    }
}

async function loadProjectAndMOs(projectId) {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    
    try {
        loadingState.style.display = 'block';
        errorState.style.display = 'none';
        
        // Fetch project data
        currentProject = await pb.collection('Projects').getOne(projectId);
        
        // Fetch all MOs (not just by Project_Code)
        const moRecords = await pb.collection('MO_Table').getList(1, 200, {
            sort: '-MO_Date'
        });
        
        // Normalize helper
        function normalize(str) {
            return (str || '').toString().trim().toUpperCase();
        }
        
        // Filter MOs for this project by Project_Name matching either code or name
        projectMOs = moRecords.items.filter(mo =>
            normalize(mo.Project_Name) === normalize(currentProject.Project_Code) ||
            normalize(mo.Project_Name) === normalize(currentProject.Project_Name)
        );
        
        // For each MO, fetch process data to calculate status and completion
        for (let mo of projectMOs) {
            try {
                const partsRecords = await pb.collection('Parts_Table').getList(1, 200, {
                    filter: `MO_Name = "${mo.MO_Name}"`
                });
                
                // Calculate MO status and completion percentage
                mo.status = calculateMOStatus(partsRecords.items);
                mo.completionPercentage = calculateCompletionPercentage(partsRecords.items);
            } catch (error) {
                console.error(`Error loading parts for MO ${mo.MO_Name}:`, error);
                mo.status = 'Unknown';
                mo.completionPercentage = 0;
            }
        }
        
        // Render project data
        renderProjectData();
        
        // Render MOs table
        renderMOsTable();
        
    } catch (error) {
        console.error('Error loading project data:', error);
        showError('Failed to load project details');
        errorState.style.display = 'block';
        document.getElementById('errorMessage').textContent = error.message;
    } finally {
        loadingState.style.display = 'none';
    }
}

function renderProjectData() {
    if (!currentProject) return;
    
    // Update page title and header
    document.title = `${currentProject.Project_Name} - LabTronic MO System`;
    document.getElementById('projectTitle').textContent = currentProject.Project_Name;
    
    // Update project data fields
    document.getElementById('projectName').textContent = currentProject.Project_Name || 'N/A';
    document.getElementById('projectCode').textContent = currentProject.Project_Code || 'N/A';
    document.getElementById('university').textContent = currentProject.University || 'N/A';
    document.getElementById('lab').textContent = currentProject.Lab || 'N/A';
    document.getElementById('projectManager').textContent = currentProject.Project_Manager || 'N/A';
    document.getElementById('designEngineer').textContent = currentProject.Design_Engineer || 'N/A';
    document.getElementById('productionEngineer').textContent = currentProject.Production_Engineer || 'N/A';
    document.getElementById('createdDate').textContent = formatDate(currentProject.created);
    
    // Update project status based on MOs
    updateProjectStatus();
}

function updateProjectStatus() {
    const statusElement = document.getElementById('projectStatus');
    
    if (projectMOs.length === 0) {
        statusElement.textContent = 'No MOs';
        statusElement.className = 'badge badge-secondary';
        return;
    }
    
    // Calculate overall project status based on MO statuses
    const completedMOs = projectMOs.filter(mo => mo.status === 'Completed');
    const inProgressMOs = projectMOs.filter(mo => mo.status === 'In Progress');
    const pendingMOs = projectMOs.filter(mo => mo.status === 'Pending');
    
    if (completedMOs.length === projectMOs.length) {
        statusElement.textContent = 'Completed';
        statusElement.className = 'badge badge-success';
    } else if (inProgressMOs.length > 0) {
        statusElement.textContent = 'In Progress';
        statusElement.className = 'badge badge-primary';
    } else if (pendingMOs.length > 0) {
        statusElement.textContent = 'Pending';
        statusElement.className = 'badge badge-warning';
    } else {
        statusElement.textContent = 'Active';
        statusElement.className = 'badge badge-info';
    }
}

function renderMOsTable() {
    const tbody = document.getElementById('moTableBody');
    const noMOs = document.getElementById('noMOs');
    const moCount = document.getElementById('moCount');
    const tableContainer = document.querySelector('.table-container');
    
    // Update MO count
    moCount.textContent = projectMOs.length;
    
    if (projectMOs.length === 0) {
        tbody.innerHTML = '';
        noMOs.style.display = 'block';
        return;
    }
    
    noMOs.style.display = 'none';
    tbody.innerHTML = '';
    
    // Check if mobile view
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile: Show cards
        renderMOCards();
    } else {
        // Desktop: Show table
        renderMOTable();
    }
}

function renderMOTable() {
    const table = document.getElementById('moTable');
    const cardsContainer = document.getElementById('moCardsContainer');
    const tbody = document.getElementById('moTableBody');
    
    // Show table, hide cards
    table.style.display = 'table';
    if (cardsContainer) cardsContainer.style.display = 'none';
    
    tbody.innerHTML = '';
    
    projectMOs.forEach(mo => {
        const row = createMORow(mo);
        tbody.appendChild(row);
    });
}

function renderMOCards() {
    const table = document.getElementById('moTable');
    const tableContainer = document.querySelector('.table-container');
    
    // Show cards, hide table
    table.style.display = 'none';
    
    // Create or get cards container
    let cardsContainer = document.getElementById('moCardsContainer');
    if (!cardsContainer) {
        cardsContainer = document.createElement('div');
        cardsContainer.id = 'moCardsContainer';
        cardsContainer.className = 'grid grid-cols-1 gap-4';
        tableContainer.appendChild(cardsContainer);
    }
    
    cardsContainer.style.display = 'block';
    cardsContainer.innerHTML = '';
    
    projectMOs.forEach(mo => {
        const card = createMOCard(mo);
        cardsContainer.appendChild(card);
    });
}

function createMOCard(mo) {
    const card = document.createElement('div');
    card.className = 'card mo-card';
    card.style.cssText = `
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        border: 1px solid var(--color-border);
        background: white;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 0.5rem;
    `;
    
    // Add hover effects
    card.onmouseenter = () => {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    };
    
    card.onmouseleave = () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
    };
    
    // Click to view MO
    card.onclick = () => viewMO(mo.id);
    
    const statusBadgeClass = getStatusBadgeClass(mo.status);
    const moTypeIcon = formatMOTypeWithIcon(mo.MO_Type);
    
    card.innerHTML = `
        <div class="card-content">
            <div class="flex items-center justify-between mb-3">
                <h3 class="font-semibold text-lg" style="color: var(--color-foreground);">${mo.MO_Name}</h3>
                <span class="badge badge-${statusBadgeClass}">${mo.status}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="text-xs text-muted-foreground">Type</label>
                    <p class="font-medium">${moTypeIcon}</p>
                </div>
                <div>
                    <label class="text-xs text-muted-foreground">Date</label>
                    <p class="font-medium">${formatDate(mo.MO_Date || mo.created)}</p>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="text-xs text-muted-foreground">Progress</label>
                <div class="progress-bar" style="width: 100%; height: 8px; margin-top: 0.25rem;">
                    <div class="progress-fill" style="width: ${mo.completionPercentage}%; height: 100%;"></div>
                </div>
                <p class="text-sm font-medium mt-1">${mo.completionPercentage}% Complete</p>
            </div>
            
            <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Tap to view details</span>
                <span style="color: var(--color-primary);">→</span>
            </div>
        </div>
    `;
    
    return card;
}

function createMORow(mo) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td class="font-semibold">${mo.MO_Name}</td>
        <td>${formatMOTypeWithIcon(mo.MO_Type)}</td>
        <td>${formatDate(mo.MO_Date || mo.created)}</td>
        <td>
            <span class="badge badge-${getStatusBadgeClass(mo.status)}">
                ${mo.status}
            </span>
        </td>
        <td>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${mo.completionPercentage}%"></div>
                <span class="progress-text">${mo.completionPercentage}%</span>
            </div>
        </td>
    `;
    
    row.onclick = () => viewMO(mo.id);
    row.style.cursor = 'pointer';
    
    return row;
}

function calculateMOStatus(parts) {
    if (!parts || parts.length === 0) {
        return 'Pending';
    }
    
    let totalProcesses = 0;
    let completedProcesses = 0;
    
    parts.forEach(part => {
        // Check all 5 processes for each part
        for (let i = 1; i <= 5; i++) {
            const processField = `Process${i}`;
            const statusField = `Process${i}_Status`;
            
            if (part[processField]) {
                totalProcesses++;
                if (part[statusField] === 'Done') {
                    completedProcesses++;
                }
            }
        }
    });
    
    if (totalProcesses === 0) {
        return 'Pending';
    }
    
    const completionRate = (completedProcesses / totalProcesses) * 100;
    
    if (completionRate === 100) {
        return 'Completed';
    } else if (completionRate > 0) {
        return 'In Progress';
    } else {
        return 'Pending';
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
            
            if (part[processField]) {
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

function formatMOTypeWithIcon(moType) {
    const iconMap = {
        'Laser Cutting': '⚡',
        'CNC Milling': '🔧',
        '3D Printing': '🖨️',
        'Assembly': '🔩',
        'Welding': '🔥',
        'Painting': '🎨',
        'Inspection': '🔍',
        'Packaging': '📦'
    };
    
    const icon = iconMap[moType] || '🏭';
    return `${icon} ${moType || 'Unknown'}`;
}

function getStatusBadgeClass(status) {
    const statusMap = {
        'Completed': 'success',
        'In Progress': 'primary',
        'Pending': 'warning',
        'Unknown': 'secondary'
    };
    
    return statusMap[status] || 'secondary';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function viewMO(moId) {
    window.location.href = `MO_Card.html?id=${moId}`;
}

function editMO(moId) {
    // For now, redirect to MO card page
    // In the future, this could open an edit modal or redirect to an edit page
    window.location.href = `MO_Card.html?id=${moId}`;
}

function addNewMO() {
    // Redirect to Add MO page with project pre-filled
    if (currentProject) {
        window.location.href = `Add_MO.html?project=${currentProject.Project_Code}`;
    } else {
        window.location.href = 'Add_MO.html';
    }
}

function showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'error-message';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
        background: var(--color-destructive);
        color: white;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        box-shadow: var(--shadow-lg);
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Add utility classes and progress bar styles
document.head.insertAdjacentHTML('beforeend', `
<style>
.flex { display: flex; }
.items-center { align-items: center; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.text-2xl { font-size: 1.5rem; }
.font-semibold { font-weight: 600; }
.text-muted-foreground { color: var(--color-muted-foreground); }
.text-center { text-align: center; }

.progress-bar {
    position: relative;
    width: 100%;
    height: 20px;
    background: var(--color-muted);
    border-radius: 10px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.3s ease;
}

.progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-primary-foreground);
}

.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
}
</style>
`); 