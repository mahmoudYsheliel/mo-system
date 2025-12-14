document.addEventListener('DOMContentLoaded', function() {
    // Initialize projects page
    initProjectsPage();
});

let allProjects = [];
let projectMOs = {};

async function initProjectsPage() {
    // Check authentication
    if (!requireAuth()) return;
    
    // Update user info
    updateUserInfo();
    
    // Load projects data
    await loadProjects();
}

function updateUserInfo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.Full_Name || user.Account_Name || 'User';
        document.getElementById('userRole').textContent = user.Role || 'Unknown Role';
    }
}

async function loadProjects() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    try {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        
        console.log('Loading projects...');
        
        // Fetch all projects
        const projectRecords = await pb.collection('Projects').getList(1, 200, {
            sort: '-created'
        });
        
        allProjects = projectRecords.items;
        console.log('Projects fetched:', allProjects.length);
        console.log('Sample project:', allProjects[0]);
        
        // Debug: Show all projects and their codes
        console.log('=== ALL PROJECTS AND THEIR CODES ===');
        allProjects.forEach(project => {
            console.log(`Project: "${project.Project_Name}" -> Code: "${project.Project_Code}"`);
        });
        
        console.log('Project codes from Projects collection:');
        allProjects.forEach(project => {
            console.log(`  Project: ${project.Project_Name} - Code: ${project.Project_Code}`);
        });
        
        // Apply role-based filtering
        applyRoleBasedFiltering();
        
        // Load MOs for projects
        await loadMOsForProjects();
        
        // Render project cards
        renderProjectCards();
        
    } catch (error) {
        console.error('Error loading projects:', error);
        showError('Failed to load projects');
        
        // Show empty state on error
        const grid = document.getElementById('projectsGrid');
        const emptyState = document.getElementById('emptyState');
        if (grid) grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
    } finally {
        loadingState.style.display = 'none';
    }
}

function applyRoleBasedFiltering() {
    const user = getCurrentUser();
    const userRole = user?.Role;
    
    console.log('Current user:', user);
    console.log('User role:', userRole);
    console.log('Projects before filtering:', allProjects.length);
    console.log('User Full_Name:', user?.Full_Name);
    console.log('User Account_Name:', user?.Account_Name);
    console.log('User Email:', user?.email);
    
    // TEMPORARY: Show all projects for debugging
    console.log('DEBUG MODE: Showing all projects without role filtering');
    return;
    
    if (userRole === 'Project Manager') {
        // Project Managers see only their own projects
        allProjects = allProjects.filter(project => {
            const isOwnProject = project.Project_Manager === user.Full_Name || 
                   project.Project_Manager === user.Account_Name ||
                   project.Project_Manager === user.email;
            console.log(`Project ${project.Project_Name}: Manager=${project.Project_Manager}, User=${user.Full_Name || user.Account_Name}, IsOwn=${isOwnProject}`);
            return isOwnProject;
        });
    } else if (userRole === 'Supervisor') {
        // Supervisors see all projects
        console.log('Supervisor role - showing all projects');
        // No filtering needed
    } else {
        // Other roles see projects they're involved in
        allProjects = allProjects.filter(project => {
            console.log(`Checking project: ${project.Project_Name}`);
            console.log(`  Project Design_Engineer: "${project.Design_Engineer}"`);
            console.log(`  Project Production_Engineer: "${project.Production_Engineer}"`);
            console.log(`  Project Project_Manager: "${project.Project_Manager}"`);
            console.log(`  User Full_Name: "${user.Full_Name}"`);
            console.log(`  User Account_Name: "${user.Account_Name}"`);
            console.log(`  User Email: "${user.email}"`);
            
            // More flexible matching - check multiple user fields
            const isInvolved = project.Design_Engineer === user.Full_Name ||
                   project.Design_Engineer === user.Account_Name ||
                   project.Design_Engineer === user.email ||
                   project.Production_Engineer === user.Full_Name ||
                   project.Production_Engineer === user.Account_Name ||
                   project.Production_Engineer === user.email ||
                   project.Project_Manager === user.Full_Name ||
                   project.Project_Manager === user.Account_Name ||
                   project.Project_Manager === user.email;
            console.log(`Project ${project.Project_Name}: IsInvolved=${isInvolved}`);
            return isInvolved;
        });
    }
    
    console.log('Projects after filtering:', allProjects.length);
}

async function loadMOsForProjects() {
    try {
        console.log('Loading MOs for projects...');
        
        // Fetch only recent MOs to improve performance
        const moRecords = await pb.collection('MO_Table').getList(1, 500, {
            sort: '-MO_Date',
            fields: 'Project_Name,MO_Name,MO_Date'
        });
        
        console.log('MOs fetched:', moRecords.items.length);
        console.log('Sample MO:', moRecords.items[0]);
        
        // Build a map of project name to project code
        const projectNameToCode = {};
        allProjects.forEach(project => {
            projectNameToCode[project.Project_Name.trim().toUpperCase()] = project.Project_Code.trim().toUpperCase();
        });
        
        // Group MOs by project name (human-readable)
        projectMOs = {};
        allProjects.forEach(project => {
            const normalizedProjectName = project.Project_Name.trim().toUpperCase();
            projectMOs[normalizedProjectName] = [];
        });
        
        moRecords.items.forEach(mo => {
            if (mo.Project_Name) {
                const normalizedMOProject = mo.Project_Name.trim().toUpperCase();
                // Find the project name this MO belongs to
                let matchedProjectName = null;
                for (const [projectName, projectCode] of Object.entries(projectNameToCode)) {
                    if (normalizedMOProject === projectName || normalizedMOProject === projectCode) {
                        matchedProjectName = projectName;
                        break;
                    }
                }
                if (matchedProjectName) {
                    projectMOs[matchedProjectName].push(mo);
                    console.log(`Added MO ${mo.MO_Name} to project name ${matchedProjectName} (original: "${mo.Project_Name}")`);
                } else {
                    // MOs that don't match any project
                    if (!projectMOs['__UNMATCHED__']) projectMOs['__UNMATCHED__'] = [];
                    projectMOs['__UNMATCHED__'].push(mo);
                    console.log(`MO ${mo.MO_Name} (Project_Name: "${mo.Project_Name}") did not match any project`);
                }
            }
        });
        
        console.log('Project MOs grouped:', Object.keys(projectMOs).length);
        console.log('Sample project MOs:', Object.entries(projectMOs).slice(0, 3));
        
        // Debug: Show all project names and their MO counts
        Object.entries(projectMOs).forEach(([projectName, mos]) => {
            console.log(`Project Name: ${projectName} - MOs: ${mos.length}`);
            mos.forEach(mo => {
                console.log(`  - ${mo.MO_Name}`);
            });
        });
        
    } catch (error) {
        console.error('Error loading MOs:', error);
        projectMOs = {};
    }
}

function renderProjectCards() {
    const grid = document.getElementById('projectsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (allProjects.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    grid.innerHTML = '';
    
    allProjects.forEach(project => {
        const card = createProjectCard(project);
        grid.appendChild(card);
    });
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'card project-card';
    card.onclick = () => window.location.href = `Proj_Card.html?id=${project.id}`;
    
    // Get MOs for this project using normalized project name
    const normalizedProjectName = project.Project_Name.trim().toUpperCase();
    const projectMOsList = projectMOs[normalizedProjectName] || [];
    let moNames = '';
    let moCount = 0;
    
    console.log(`Creating card for project: ${project.Project_Name}`);
    console.log(`  Project Code: ${project.Project_Code} (normalized: ${normalizedProjectName})`);
    console.log(`  Available project names in projectMOs:`, Object.keys(projectMOs));
    console.log(`  MOs found: ${projectMOsList.length}`);
    console.log(`  MOs:`, projectMOsList);
    
    if (projectMOsList.length > 0) {
        moCount = projectMOsList.length;
        // Show only first 2 MO names to keep cards compact
        const displayMOs = projectMOsList.slice(0, 2);
        moNames = displayMOs.map(mo => mo.MO_Name).join(', ');
        if (projectMOsList.length > 2) {
            moNames += ` (+${projectMOsList.length - 2} more)`;
        }
    } else {
        moNames = 'No MOs';
    }
    
    card.innerHTML = `
        <div class="card-header">
            <div class="flex items-center justify-between mb-2">
                <h3 class="card-title text-lg">${project.Project_Name || 'Unnamed Project'}</h3>
                <span class="badge badge-primary">${moCount} MOs</span>
            </div>
        </div>
        
        <div class="card-content">
            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="text-xs text-muted-foreground">University:</label>
                    <p class="text-sm font-medium">${project.University || 'N/A'}</p>
                </div>
                <div>
                    <label class="text-xs text-muted-foreground">Project Manager:</label>
                    <p class="text-sm font-medium">${project.Project_Manager || 'N/A'}</p>
                </div>
                <div>
                    <label class="text-xs text-muted-foreground">Design Engineer:</label>
                    <p class="text-sm font-medium">${project.Design_Engineer || 'N/A'}</p>
                </div>
                <div>
                    <label class="text-xs text-muted-foreground">Production Engineer:</label>
                    <p class="text-sm font-medium">${project.Production_Engineer || 'N/A'}</p>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="text-xs text-muted-foreground">Manufacturing Orders:</label>
                <p class="text-sm">${moNames}</p>
            </div>
            
            <div class="text-xs text-muted-foreground">
                Created: ${formatDate(project.created)}
            </div>
        </div>
    `;
    
    return card;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
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

// Add utility classes
document.head.insertAdjacentHTML('beforeend', `
<style>
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.text-2xl { font-size: 1.5rem; }
.text-4xl { font-size: 2.25rem; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.text-muted-foreground { color: var(--color-muted-foreground); }
.text-center { text-align: center; }
.project-card { cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.project-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.btn { padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 500; cursor: pointer; border: none; }
.btn-secondary { background: var(--color-secondary); color: var(--color-secondary-foreground); }
.btn-secondary:hover { background: var(--color-secondary-hover); }

/* Compact project card styles */
.project-card .card-header {
    padding: 1rem;
    border-bottom: 1px solid var(--color-border);
}

.project-card .card-content {
    padding: 1rem;
}

.project-card .card-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
}

.project-card .card-subtitle {
    font-size: 0.875rem;
    color: var(--color-muted-foreground);
    margin: 0;
}

.project-card .badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
}

/* Grid layout for project info */
.project-card .grid {
    display: grid;
    gap: 0.75rem;
}

.project-card .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
}

/* Responsive grid adjustments */
@media (max-width: 768px) {
    .project-card .grid-cols-2 {
        grid-template-columns: 1fr;
    }
}
</style>
`);

// === CSV Download Logic ===
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('downloadProjectsCsvBtn');
    if (btn) {
        btn.addEventListener('click', function() {
            if (!allProjects || allProjects.length === 0) {
                showError('No project data available to download.');
                return;
            }
            const headers = [
                'University',
                'Lab',
                'Project_Name',
                'Project_Code',
                'Project_Manager',
                'Design_Engineer',
                'Production_Engineer'
            ];
            const csvRows = [headers.join(',')];
            allProjects.forEach(project => {
                const row = [
                    project.University || '',
                    project.Lab || '',
                    project.Project_Name || '',
                    project.Project_Code || '',
                    project.Project_Manager || '',
                    project.Design_Engineer || '',
                    project.Production_Engineer || ''
                ].map(val => '"' + String(val).replace(/"/g, '""') + '"');
                csvRows.push(row.join(','));
            });
            const csvContent = csvRows.join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ProjectData.csv';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
        });
    }
}); 