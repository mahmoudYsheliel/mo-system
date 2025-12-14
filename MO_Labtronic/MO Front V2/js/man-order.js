document.addEventListener('DOMContentLoaded', function() {
    // Initialize page
    initManOrderPage();
});

let allMOs = [];
let filteredMOs = [];
let searchTimeout;

async function initManOrderPage() {
    // Check authentication
    if (!requireAuth()) return;
    
    // Update user info
    updateUserInfo();
    
    // Load initial data
    await loadMOs();
    await loadFilterOptions();
    
    // Setup event listeners
    setupEventListeners();
    
    // Perform initial search
    performSearch();
}

function updateUserInfo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.Full_Name || user.Account_Name || 'User';
        document.getElementById('userRole').textContent = user.Role || 'Unknown Role';
    }
}

async function loadMOs() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    try {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        
        // Fetch MOs from PocketBase
        const records = await pb.collection('MO_Table').getList(1, 200, {
            sort: '-MO_Date'
        });
        
        allMOs = records.items;
        
        // Fetch project details for each MO
        await fetchProjectDetails(allMOs);
        
        // Calculate completion for each MO
        await calculateMOCompletions();
        
        // Load filter options
        await loadFilterOptions();
        
        // Initialize filtered results
        filteredMOs = [...allMOs];
        
        // Update results
        updateResults();
        
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

async function calculateMOCompletions() {
    try {
        // Get all MO names
        const moNames = allMOs.map(mo => mo.MO_Name);
        
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
        allMOs.forEach(mo => {
            const parts = partsByMO[mo.MO_Name] || [];
            mo.Completed = calculateCompletionPercentage(parts);
            mo.PartsCount = parts.length;
        });
        
    } catch (error) {
        console.error('Error calculating MO completions:', error);
        // Set default completion if calculation fails
        allMOs.forEach(mo => {
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

async function loadFilterOptions() {
    try {
        // Extract unique values for filter dropdowns using project details when available
        const projects = [...new Set(allMOs.map(mo => {
            return mo.projectDetails ? mo.projectDetails.Project_Name : mo.Project_Name;
        }).filter(Boolean))];
        
        const managers = [...new Set(allMOs.map(mo => {
            return mo.projectDetails ? mo.projectDetails.Project_Manager : mo.Project_Manager;
        }).filter(Boolean))];
        
        const universities = [...new Set(allMOs.map(mo => {
            return mo.projectDetails ? mo.projectDetails.University : mo.University;
        }).filter(Boolean))];
        
        // Populate project filter
        const projectFilter = document.getElementById('projectFilter');
        projectFilter.innerHTML = '<option value="">All Projects</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            option.textContent = project;
            projectFilter.appendChild(option);
        });
        
        // Populate manager filter
        const managerFilter = document.getElementById('managerFilter');
        managerFilter.innerHTML = '<option value="">All Managers</option>';
        managers.forEach(manager => {
            const option = document.createElement('option');
            option.value = manager;
            option.textContent = manager;
            managerFilter.appendChild(option);
        });
        
        // Populate university filter
        const universityFilter = document.getElementById('universityFilter');
        universityFilter.innerHTML = '<option value="">All Universities</option>';
        universities.forEach(university => {
            const option = document.createElement('option');
            option.value = university;
            option.textContent = university;
            universityFilter.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

function setupEventListeners() {
    // Search input with debouncing
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch();
        }, 300);
    });
    
    // Enter key support
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Filter change events
    const filters = [
        'moTypeFilter', 'projectFilter', 'managerFilter', 
        'universityFilter', 'dateFrom', 'dateTo', 'statusFilter'
    ];
    
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', performSearch);
        }
    });
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const moType = document.getElementById('moTypeFilter').value;
    const project = document.getElementById('projectFilter').value;
    const manager = document.getElementById('managerFilter').value;
    const university = document.getElementById('universityFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const status = document.getElementById('statusFilter').value;
    
    // Filter MOs
    filteredMOs = allMOs.filter(mo => {
        // Get project details for this MO
        const projectName = mo.projectDetails ? mo.projectDetails.Project_Name : mo.Project_Name;
        const projectManager = mo.projectDetails ? mo.projectDetails.Project_Manager : mo.Project_Manager;
        const projectUniversity = mo.projectDetails ? mo.projectDetails.University : mo.University;
        
        // Search term filter
        if (searchTerm) {
            const searchableText = [
                mo.MO_Name,
                mo.MO_Type,
                projectName,
                projectUniversity,
                projectManager
            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }
        
        // MO Type filter
        if (moType && mo.MO_Type !== moType) {
            return false;
        }
        
        // Project filter
        if (project && projectName !== project) {
            return false;
        }
        
        // Manager filter
        if (manager && projectManager !== manager) {
            return false;
        }
        
        // University filter
        if (university && projectUniversity !== university) {
            return false;
        }
        
        // Date range filter
        if (dateFrom || dateTo) {
            const moDate = new Date(mo.MO_Date || mo.created);
            
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                if (moDate < fromDate) return false;
            }
            
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59); // End of day
                if (moDate > toDate) return false;
            }
        }
        
        // Status filter
        if (status) {
            const moStatus = getMOStatus(mo.Completed).text.toLowerCase().replace(' ', '-');
            if (moStatus !== status) {
                return false;
            }
        }
        
        return true;
    });
    
    // Update results
    updateResults();
}

function updateResults() {
    const resultsCount = document.getElementById('resultsCount');
    const emptyState = document.getElementById('emptyState');
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Update count
    resultsCount.textContent = `${filteredMOs.length} Manufacturing Order${filteredMOs.length !== 1 ? 's' : ''} found`;
    
    if (filteredMOs.length === 0) {
        emptyState.style.display = 'block';
        resultsContainer.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    resultsContainer.style.display = 'block';
    
    // Group by status
    const notStarted = filteredMOs.filter(mo => mo.Completed === 0);
    const active = filteredMOs.filter(mo => mo.Completed > 0 && mo.Completed < 100);
    const completed = filteredMOs.filter(mo => mo.Completed === 100);
    
    // Render sections
    renderSection('notStartedSection', 'notStartedGrid', notStarted);
    renderSection('activeSection', 'activeGrid', active);
    renderSection('completedSection', 'completedGrid', completed);
}

function renderSection(sectionId, gridId, mos) {
    const section = document.getElementById(sectionId);
    const grid = document.getElementById(gridId);
    
    if (mos.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    grid.innerHTML = '';
    
    mos.forEach(mo => {
        const card = createMOCard(mo);
        grid.appendChild(card);
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

function clearFilters() {
    // Reset all filter inputs
    document.getElementById('searchInput').value = '';
    document.getElementById('moTypeFilter').value = '';
    document.getElementById('projectFilter').value = '';
    document.getElementById('managerFilter').value = '';
    document.getElementById('universityFilter').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('statusFilter').value = '';
    
    // Reset filtered results
    filteredMOs = [...allMOs];
    updateResults();
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

// Add utility classes and styles
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
.mr-2 { margin-right: 0.5rem; }

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
    
    /* Stack filters on mobile */
    .form-row {
        flex-direction: column;
        gap: 1rem;
    }
    
    .form-control {
        width: 100%;
    }
    
    /* Adjust grid for mobile */
    .grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    /* Search container mobile layout */
    .search-container {
        margin-bottom: 1rem;
    }
    
    .search-input {
        font-size: 1rem;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
    }
    
    /* Filter buttons mobile layout */
    .btn {
        width: 100%;
        margin-bottom: 0.5rem;
    }
}

@media (min-width: 769px) and (max-width: 1024px) {
    .grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
}

@media (min-width: 1025px) {
    .grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
    }
}
</style>
`); 