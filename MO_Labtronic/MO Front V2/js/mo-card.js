// Fixed role checking function
function checkUserRole(user, requiredRole) {
    if (!user) return false;
    const roles = Array.isArray(user.Role) ? user.Role : (user.Role ? [user.Role] : []);
    const req = String(requiredRole).trim().toLowerCase();
    return roles.some(r => String(r).trim().toLowerCase() === req);
  }
  

document.addEventListener('DOMContentLoaded', function() {
    // Initialize MO card page
    initMOCardPage();
});

let currentMO = null;
let currentParts = [];
let allMOs = [];
let statusChanges = new Map();
let hasUnsavedChanges = false;
let notes = [];
let editingNoteIndex = -1;

// Ensure PocketBase is available
function getPocketBaseUrl() {
    if (typeof pb !== 'undefined' && pb.baseUrl) {
        return pb.baseUrl;
    }
    // Fallback to a default URL or throw an error
    console.error('PocketBase not properly initialized');
    return 'https://mo.lab-tronic.com/database'; // Default fallback URL
}

// Check authentication and role
function requireAuth() {
    if (!isAuthenticated()) {
        showError('Please log in to access this page');
        return false;
    }
    
    const user = getCurrentUser();
    if (!user) {
        showError('User data not found');
        return false;
    }
    
    // Debug logging
    console.log('User data:', {
        role: user.Role,
        email: user.email,
        user: user
    });
    
    // Get the first role if it's an array
    const role = Array.isArray(user.Role) ? user.Role[0] : user.Role;
    
    // For MO_Card, only Production Engineers can access
    if (role !== 'Production Engineer') {
        // Show error but allow access - we'll handle role-based restrictions elsewhere
        console.warn('User is not Production Engineer:', role);
        return true;
    }
    
    return true;
}

async function initMOCardPage() {
    // Check authentication
    if (!requireAuth()) return;
    
    // Update user info
    updateUserInfo();
    
    // Check Web Share API support and log to console
    checkWebShareSupport();
    
    // Get MO ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const moId = urlParams.get('id');
    
    if (moId) {
        // Load specific MO
        await loadMOData(moId);
    }
}

async function loadMOData(moId) {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    
    try {
        loadingState.style.display = 'block';
        errorState.style.display = 'none';
        
        // Load MO data with expanded relations using real column names
        currentMO = await pb.collection('MO_Table').getOne(moId, { expand: 'Project_Name,Project_Manager,Design_Eng,Production_Eng' });
        
        // Parse Files_Status if it's a string (PocketBase JSON field format)
        if (currentMO.Files_Status && typeof currentMO.Files_Status === 'string') {
            try {
                if (currentMO.Files_Status.trim().startsWith('[') || currentMO.Files_Status.trim().startsWith('{')) {
                    currentMO.Files_Status = JSON.parse(currentMO.Files_Status);
                    console.log('Parsed Files_Status from JSON string:', currentMO.Files_Status);
                } else {
                    // Not JSON, treat as legacy or invalid value
                    console.warn('Files_Status is not valid JSON, resetting to empty array. Value:', currentMO.Files_Status);
                    currentMO.Files_Status = [];
                }
            } catch (error) {
                console.error('Error parsing Files_Status JSON string:', error);
                console.error('Raw Files_Status value:', currentMO.Files_Status);
                currentMO.Files_Status = [];
            }
        }
        
        // Ensure Files_Status is always an array
        if (!Array.isArray(currentMO.Files_Status)) {
            console.log('Files_Status is not an array, initializing as empty array. Type:', typeof currentMO.Files_Status, 'Value:', currentMO.Files_Status);
            currentMO.Files_Status = [];
        }
        
        console.log('Loaded MO Files_Status:', currentMO.Files_Status);
        
        // Validate and clean Files_Status data
        if (Array.isArray(currentMO.Files_Status)) {
            currentMO.Files_Status = currentMO.Files_Status.filter(item => 
                item && typeof item === 'object' && item.file && typeof item.file === 'string'
            ).map(item => ({
                file: item.file,
                sent: !!item.sent,
                sentBy: item.sentBy || '',
                sentDate: item.sentDate || ''
            }));
            console.log('Validated and cleaned Files_Status:', currentMO.Files_Status);
        }
        
        // Test Files_Status field configuration
        console.log('Testing Files_Status field configuration...');
        console.log('Current MO fields:', Object.keys(currentMO));
        console.log('Files_Status field type:', typeof currentMO.Files_Status);
        console.log('Files_Status field value:', currentMO.Files_Status);
        
        // Load project details from Projects collection using project code
        let projectDetails = null;
        if (currentMO.Project_Name) {
            try {
                const projectRecord = await pb.collection('Projects').getFirstListItem(`Project_Code = "${currentMO.Project_Name}"`, {
                    fields: 'id,University,Lab,Project_Name,Project_Code,Project_Manager,Design_Engineer,Production_Engineer,created,updated'
                });
                projectDetails = projectRecord;
            } catch (error) {
                console.warn('Project not found for code:', currentMO.Project_Name);
            }
        }
        
        // Load parts data
        const partsRecords = await pb.collection('Parts_Table').getList(1, 1000, {
            filter: `MO_Name = "${currentMO.MO_Name}"`
        });
        currentParts = partsRecords.items;
        
        // Render data
        renderMOData(projectDetails);
        renderFiles();
        renderPartsTable();
        loadNotes();
        
        // Update process names list
        updateProcessNamesList();
        
        // Initialize completion status
        updateOverallProgress();
        
        // Show/hide "Mark all processes as Done" section based on user role
        updateMarkAllProcessesVisibility();
        
        // Show/hide "Mark All as Sent" button based on user role
        updateMarkAllAsSentVisibility();
        
    } catch (error) {
        console.error('Error loading MO data:', error);
        showError('Failed to load MO details');
        errorState.style.display = 'block';
        document.getElementById('errorMessage').textContent = error.message;
    } finally {
        loadingState.style.display = 'none';
    }
}

function updateMarkAllProcessesVisibility() {
    const user = getCurrentUser();
    const markAllSection = document.getElementById('markAllProcessesSection');
    
    if (markAllSection) {
        if (checkUserRole(user, 'Production Engineer')) {
            markAllSection.style.display = 'block';
        } else {
            markAllSection.style.display = 'none';
    }
}}

function updateMarkAllAsSentVisibility() {
    const user = getCurrentUser();
    const markAllAsSentBtn = document.querySelector('button[onclick="markAllFilesAsSent()"]');
    
    if (markAllAsSentBtn) {
        if (checkUserRole(user, 'Production Engineer')) {
            markAllAsSentBtn.style.display = 'inline-block';
        } else {
            markAllAsSentBtn.style.display = 'none';
    }
}}

// Function to render MO data
// Function to render MO data
    // Check if currentMO is defined
function renderMOData(projectDetails) {
    if (!currentMO) return;
    // Update page title and header
    document.title = `${currentMO.MO_Name} - LabTronic MO System`;
    document.getElementById('moTitle').textContent = currentMO.MO_Name;
    // Update MO data fields
    document.getElementById('moName').textContent = currentMO.MO_Name || 'N/A';
    document.getElementById('moType').innerHTML = getMOTypeDisplay(currentMO.MO_Type || 'N/A');
    // Project Name
    // Check if currentMO.expand is defined and if it contains Project_Name
    let projectName = '';
    if (projectDetails && projectDetails.Project_Name) {
        projectName = projectDetails.Project_Name;
    } else {
        projectName = currentMO.Project_Name; // fallback
    }
    document.getElementById('projectName').textContent = projectName || 'N/A';
    // University
    // Check if currentMO.expand is defined and if it contains Project_Name
    let university = '';
        // Check if University is defined
    if (currentMO.expand && currentMO.expand.Project_Name) {
        university = currentMO.expand.Project_Name.University || currentMO.University;
        // If not, set university to currentMO.University
    } else {
        university = currentMO.University;
    // Set the text content of the university element
    }
    document.getElementById('university').textContent = university || 'N/A';
    // Project Manager
    // Check if currentMO.expand is defined and if it contains Project_Manager
    let projectManager = '';
        // Check if Full_Name is defined
    if (currentMO.expand && currentMO.expand.Project_Manager) {
        projectManager = currentMO.expand.Project_Manager.Full_Name || currentMO.expand.Project_Manager.Account_Name || currentMO.expand.Project_Manager.username || currentMO.expand.Project_Manager.email;
        // If not, set projectManager to currentMO.Project_Manager
    } else {
        projectManager = currentMO.Project_Manager;
    }
    document.getElementById('projectManager').textContent = projectManager || 'N/A';
    // Design Engineer
    let designEng = '';
    if (currentMO.expand && currentMO.expand.Design_Eng) {
        designEng = currentMO.expand.Design_Eng.Full_Name || currentMO.expand.Design_Eng.Account_Name || currentMO.expand.Design_Eng.username || currentMO.expand.Design_Eng.email;
    } else {
        designEng = currentMO.Design_Eng;
    }
    document.getElementById('designEng').textContent = designEng || 'N/A';
    // Production Engineer
    let prodEngName = '';
    if (currentMO.expand && currentMO.expand.Production_Eng) {
        prodEngName = currentMO.expand.Production_Eng.Full_Name || currentMO.expand.Production_Eng.Account_Name || currentMO.expand.Production_Eng.username || currentMO.expand.Production_Eng.email;
    } else {
        prodEngName = currentMO.Production_Eng;
    }
    document.getElementById('productionEng').textContent = prodEngName || 'N/A';
    // MO Date
    document.getElementById('moDate').textContent = formatDate(currentMO.MO_Date || currentMO.created);
}

function renderFiles() {
    const filesList = document.getElementById('filesList');
    const noFiles = document.getElementById('noFiles');
    
    if (!currentMO.Files || currentMO.Files.length === 0) {
        filesList.style.display = 'none';
        noFiles.style.display = 'block';
        return;
    }
    
    filesList.style.display = 'grid';
    noFiles.style.display = 'none';
    filesList.innerHTML = '';
    
    currentMO.Files.forEach((file, idx) => {
        const fileCard = createFileCard(file, idx);
        filesList.appendChild(fileCard);
    });
    
    // Update "Mark All as Sent" button visibility after rendering files
    updateMarkAllAsSentVisibility();
}

function createFileCard(file, fileIndex) {
    const card = document.createElement('div');
    card.className = 'card file-card';
    // Show actual file name
    let fileName = '';
    if (typeof file === 'string') {
        fileName = file;
    } else if (file && file.name) {
        fileName = file.name;
    } else {
        fileName = 'Unknown File';
    }
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const fileIcon = getFileIcon(fileExtension);
    // File details (mocked for now, replace with real data if available)
    let fileType = 'Other';
    if (['dxf', 'dwg', 'step', 'stp', 'iges', 'igs', 'sldprt', 'sldasm'].includes(fileExtension)) fileType = 'CAD';
    let sentBy = 'Unknown';
    let sentDate = '';
    let isSent = false;
    if (Array.isArray(currentMO.Files_Status)) {
        const statusObj = currentMO.Files_Status.find(f => f.file === fileName);
        if (statusObj) {
            isSent = !!statusObj.sent;
            sentBy = statusObj.sentBy || 'Unknown';
            sentDate = statusObj.sentDate ? formatDate(statusObj.sentDate) : '';
        }
    }
    const user = getCurrentUser();
    const role = Array.isArray(user.Role) ? user.Role[0] : user.Role;
    const isProductionEngineer = user && role === 'Production Engineer';
    // WhatsApp share link for this file
    const fileUrl = `${getPocketBaseUrl()}/api/files/MO_Table/${currentMO.id}/${fileName}`;
    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent('File for MO: ' + currentMO.MO_Name + '\n' + fileUrl)}`;
    card.innerHTML = `
        <div class="card-content text-center">
            <div class="text-3xl mb-2">${fileIcon}</div>
            <h3 class="font-semibold text-sm mb-2">${fileName}</h3>
            <div class="file-details text-xs text-left mb-2" style="margin: 0 auto; max-width: 90%;">
                <div><b>Type:</b> ${fileType}</div>
                <div><b>Sent by:</b> ${isSent ? sentBy : ''}</div>
                <div><b>Date:</b> ${sentDate}</div>
            </div>
            <div class="flex gap-2 justify-center mb-2">
                <label style="display: flex; align-items: center; gap: 0.5em; cursor: pointer;">
                    <input type="checkbox" ${isSent ? 'checked' : ''} ${isProductionEngineer ? '' : 'disabled'} onchange="toggleFileSentStatus('${fileName}', this.checked)">
                    <span>Sent</span>
                </label>
            </div>
            <div class="flex gap-2 justify-center">
                <button class="btn btn-secondary btn-sm" onclick="downloadFile('${fileName}')">
                    📥 Download
                </button>
                <button class="btn btn-secondary btn-sm" onclick="shareFile('${fileName}')">
                    📤 Share
                </button>
               
            </div>
        </div>
    `;
    return card;
}

function getFileIcon(extension) {
    const iconMap = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'xls': '📊',
        'xlsx': '📊',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🖼️',
        'bmp': '🖼️',
        'dxf': '📐',
        'dwg': '📐',
        'zip': '📦',
        'rar': '📦'
    };
    
    return iconMap[extension] || '📄';
}

function renderPartsTable() {
    const tbody = document.getElementById('partsTableBody');
    tbody.innerHTML = '';

    if (currentParts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-muted-foreground">
                    No parts found for this MO.
                </td>
            </tr>
        `;
        return;
    }

    currentParts.forEach(part => {
        const row = createPartRow(part);
        tbody.appendChild(row);
    });
}

// Remove Send column from partTableHeaders and createPartRow
const partTableHeaders = [
  'Part Code', 'Part Name', 'Quantity', 'Material', 'Thickness', 'Color', 'Processes', 'Part Image'
];

function createPartRow(part) {
    const row = document.createElement('tr');
    let processesHtml = '';
    const user = getCurrentUser();
    const isProductionEngineer = user && (Array.isArray(user.Role) ? user.Role[0] : user.Role) === 'Production Engineer';
    
    for (let i = 1; i <= 5; i++) {
        const processField = `Process${i}`;
        const statusField = `Process${i}_Status`;
        if (part[processField] && part[processField].trim() !== '') {
            const status = part[statusField] || 'None';
            const badgeId = `badge_${part.id}_${statusField}`;
            processesHtml += `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                    <span>${part[processField]}</span>
                    <span id="${badgeId}" class="badge badge-${getStatusBadgeClass(status)}${isProductionEngineer ? ' clickable-status' : ''}" style="font-size: 0.85em;${isProductionEngineer ? ' cursor:pointer;' : ''}" ${isProductionEngineer ? `onclick=\"showStatusDropdown('${part.id}','${statusField}','${status}')\"` : ''}>${status}</span>
                </div>
            `;
        }
    }
    if (!processesHtml) processesHtml = '-';
    const cells = [
        `<td data-label="${partTableHeaders[0]}">${part.Part_Code}</td>`,
        `<td data-label="${partTableHeaders[1]}">${part.Part_Name}</td>`,
        `<td data-label="${partTableHeaders[2]}">${part.Quantity}</td>`,
        `<td data-label="${partTableHeaders[3]}">${part.Part_Material || '-'}</td>`,
        `<td data-label="${partTableHeaders[4]}">${part.Part_Thickness || '-'}</td>`,
        `<td data-label="${partTableHeaders[5]}">${formatColorDisplay(part.Part_Color)}</td>`,
        `<td data-label="${partTableHeaders[6]}">${processesHtml}</td>`,
        `<td data-label="${partTableHeaders[7]}">${createPartImage(part.Part_Pic, part.id)}</td>`
    ];
    row.innerHTML = cells.join('');
    return row;
}

function getStatusBadgeClass(status) {
    const statusMap = {
        'Done': 'success',
        'In Progress': 'warning',
        'Rejected': 'destructive',
        'Cancelled': 'dark',
        'None': 'secondary'
    };
    return statusMap[status] || 'secondary';
}

function formatColorDisplay(color) {
    if (!color) return '-';
    
    const colorCode = getColorCode(color);
    
    return `
        <div class="flex items-center gap-2">
            <span>${color}</span>
            <div class="color-square" style="background-color: ${colorCode}; width: 20px; height: 20px; border: 1px solid #ddd; border-radius: 3px; flex-shrink: 0;"></div>
        </div>
    `;
}

function getColorCode(color) {
    const colorMap = {
        'light grey': '#D3D3D3',
        'light gray': '#D3D3D3',
        'dark grey': '#A9A9A9',
        'dark gray': '#A9A9A9',
        'grey': '#808080',
        'gray': '#808080'
    };
    
    return colorMap[color.toLowerCase()] || color;
}

function createPartImage(imageFile, recordId) {
    if (!imageFile) return '-';
    
    // Use the helper function to get the base URL
    const imageUrl = `${getPocketBaseUrl()}/api/files/Parts_Table/${recordId}/${imageFile}`;
    
    return `
        <img src="${imageUrl}" 
             alt="Part Image" 
             class="thumbnail" 
             style="width: 50px; height: 50px; object-fit: cover; cursor: pointer; border-radius: 4px;"
             onclick="showImagePreview('${imageUrl}')"
             onerror="console.error('Failed to load image:', this.src); this.style.display='none';">
    `;
}

function updateProcessStatus(selectOrEvent, partId, statusField) {
    const user = getCurrentUser();
    const role = Array.isArray(user.Role) ? user.Role[0] : user.Role;
    if (!user || (Array.isArray(user.Role) ? user.Role[0] : user.Role) !== 'Production Engineer') {
        showError('Only Production Engineers can change process statuses');
        return;
    }

    const newStatus = selectOrEvent.value;
    const key = `${partId}-${statusField}`;
    statusChanges.set(key, newStatus);
    hasUnsavedChanges = true;
    // Update local currentParts immediately for UI sync
    const idx = currentParts.findIndex(p => p.id === partId);
    if (idx !== -1) {
        currentParts[idx][statusField] = newStatus;
    }
    // Show save button
    const saveChangesSection = document.getElementById('saveChangesSection');
    if (saveChangesSection) {
        saveChangesSection.style.display = 'block';
    }
    // Update progress
    updateOverallProgress();
    // Re-render table to reflect new status instantly
    renderPartsTable();
}

function updateOverallProgress() {
    let totalProcesses = 0;
    let completedProcesses = 0;
    let inProgressProcesses = 0;
    let pendingProcesses = 0;
    
    // Calculate progress from all parts and their processes
    currentParts.forEach(part => {
        for (let i = 1; i <= 5; i++) {
            const processField = `Process${i}`;
            const statusField = `Process${i}_Status`;
            
            if (part[processField] && part[processField].trim() !== '') {
                totalProcesses++;
                const status = statusChanges.get(`${part.id}-${statusField}`) || part[statusField] || 'None';
                
                switch (status) {
                    case 'Done':
                        completedProcesses++;
                        break;
                    case 'In Progress':
                        inProgressProcesses++;
                        break;
                    case 'Rejected':
                    case 'Cancelled':
                        // These count as completed (processed)
                        completedProcesses++;
                        break;
                    default:
                        pendingProcesses++;
                        break;
                }
            }
        }
    });
    
    // Calculate percentage (completed + rejected + cancelled count as done)
    const percentage = totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 0;
    
    // Check if the MO has just been completed
    const justCompleted = percentage === 100 && (!currentMO.completionPercentage || currentMO.completionPercentage < 100);
    currentMO.completionPercentage = percentage;

    // Trigger notification if just completed
    if (justCompleted) {
        handleMOCompletion(currentMO);
    }
    
    // Update Parts section progress
    const overallProgressElement = document.getElementById('overallProgress');
    if (overallProgressElement) {
        overallProgressElement.textContent = `${percentage}%`;
    }
    
    // Update MO Information section completion bar
    const completionBarElement = document.getElementById('completionBar');
    const completionTextElement = document.getElementById('completionText');
    
    if (completionBarElement) {
        completionBarElement.style.width = `${percentage}%`;
    }
    
    if (completionTextElement) {
        completionTextElement.textContent = `${percentage}%`;
    }
    
    // Update completion bar color based on percentage and status
    if (completionBarElement) {
        // Remove any inline background color to use CSS classes
        completionBarElement.style.removeProperty('background-color');
        
        // Add CSS classes for different progress states
        completionBarElement.className = 'progress-fill';
        
        if (percentage === 100) {
            completionBarElement.classList.add('progress-complete');
        } else if (percentage >= 75) {
            completionBarElement.classList.add('progress-near-complete');
        } else if (percentage >= 50) {
            completionBarElement.classList.add('progress-in-progress');
        } else if (percentage >= 25) {
            completionBarElement.classList.add('progress-moderate');
        } else {
            completionBarElement.classList.add('progress-low');
        }
    }
    
    // Log detailed progress information
    console.log(`Progress updated: ${completedProcesses}/${totalProcesses} processes completed (${percentage}%)`);
    console.log(`- Completed: ${completedProcesses}`);
    console.log(`- In Progress: ${inProgressProcesses}`);
    console.log(`- Pending: ${pendingProcesses}`);
    console.log(`- Total: ${totalProcesses}`);
    
    // Update MO status in the header if available
    updateMOStatusInHeader(percentage);
}

async function handleMOCompletion(mo) {
    console.log(`MO ${mo.MO_Name} has reached 100% completion. Triggering notifications.`);
    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.error('No current user found. Cannot send notifications.');
        return;
    }
    
    try {
        // 1. Fetch project details to get the Project Manager (expand relation)
        const project = await pb.collection('Projects').getFirstListItem(`Project_Code="${mo.Project_Name}"`, { expand: 'Project_Manager' });
        let projectManagerId = null;
        if (project && project.expand && project.expand.Project_Manager) {
            projectManagerId = project.expand.Project_Manager.id;
        } else if (project && project.Project_Manager) {
            projectManagerId = project.Project_Manager;
        }
        // 2. Fetch all supervisors
        const supervisors = await pb.collection('users').getFullList({ filter: 'Role="Supervisor"' });
        // 3. Prepare list of recipients
        const recipients = [];
        if (projectManagerId) {
            recipients.push({ id: projectManagerId, role: 'Project Manager' });
        }
        supervisors.forEach(sup => {
            recipients.push({ id: sup.id, role: 'Supervisor' });
        });
        // Deduplicate recipients by id
        const uniqueRecipients = Array.from(new Set(recipients.map(r => r.id)))
            .map(id => recipients.find(r => r.id === id));
        // 4. Create a notification for each unique recipient
        for (const recipient of uniqueRecipients) {
            const notificationData = {
              "Title": "MO Completed",
              "Message": `MO-Card #${mo.MO_Name} has been marked as Completed by ${currentUser.Full_Name || currentUser.Account_Name}.`,
              "Type": "MO_Status_Completed",
              "Entity_Type": "MO-Card",
              "Entity_ID": mo.id,
              "Project_ID": mo.Project_Name,
              "Created_By": currentUser.id,
              "Created_At": new Date().toISOString(),
              "Recipient": recipient.id,
              "Priority": "warning",
              "Action_Required": true,
              "Action_Taken": false,
              "Link_To_Action": `/MO_Card.html?id=${mo.id}`,
            };
            console.log('Creating notification for recipient:', recipient.id, notificationData);
            try {
                await pb.collection('Notifications').create(notificationData);
                console.log('Notification created for:', recipient.id);
                // Show browser notification if this user is the recipient
                if (recipient.id === currentUser.id && window.Notification) {
                    if (Notification.permission === 'granted') {
                        new Notification(notificationData.Title, {
                            body: notificationData.Message,
                            icon: 'https://mo.lab-tronic.com/logo.png',
                            badge: 'https://mo.lab-tronic.com/logo.png',
                            data: notificationData
                        });
                    } else if (Notification.permission !== 'denied') {
                        Notification.requestPermission().then(permission => {
                            if (permission === 'granted') {
                                new Notification(notificationData.Title, {
                                    body: notificationData.Message,
                                    icon: 'https://mo.lab-tronic.com/logo.png',
                                    badge: 'https://mo.lab-tronic.com/logo.png',
                                    data: notificationData
                                });
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to create notification for', recipient.id, err);
            }
        }

    } catch (error) {
        console.error('Failed to send completion notifications:', error);
    }
}

async function handleNoteAdded(mo, noteContent) {
    console.log(`Note added to MO ${mo.MO_Name}. Triggering notifications.`);
    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.error('No current user found. Cannot send notifications.');
        return;
    }
    try {
        // Fetch all three roles (expanded)
        const moRecord = await pb.collection('MO_Table').getOne(mo.id, { expand: 'Project_Manager,Design_Eng,Production_Eng' });
        const recipients = [];
        // Project Manager
        if (moRecord.expand && moRecord.expand.Project_Manager) {
            recipients.push({ id: moRecord.expand.Project_Manager.id, role: 'Project Manager' });
        } else if (moRecord.Project_Manager) {
            recipients.push({ id: moRecord.Project_Manager, role: 'Project Manager' });
        }
        // Design Engineer
        if (moRecord.expand && moRecord.expand.Design_Eng) {
            recipients.push({ id: moRecord.expand.Design_Eng.id, role: 'Design Engineer' });
        } else if (moRecord.Design_Eng) {
            recipients.push({ id: moRecord.Design_Eng, role: 'Design Engineer' });
        }
        // Production Engineer
        if (moRecord.expand && moRecord.expand.Production_Eng) {
            recipients.push({ id: moRecord.expand.Production_Eng.id, role: 'Production Engineer' });
        } else if (moRecord.Production_Eng) {
            recipients.push({ id: moRecord.Production_Eng, role: 'Production Engineer' });
        }
        // Remove the sender from recipients
        const filteredRecipients = recipients.filter(r => r.id && r.id !== currentUser.id);
        // Deduplicate recipients by id
        const uniqueRecipients = Array.from(new Set(filteredRecipients.map(r => r.id)))
            .map(id => filteredRecipients.find(r => r.id === id));
        // Create a notification for each unique recipient
        for (const recipient of uniqueRecipients) {
            const notificationData = {
              "Title": "Note Added to MO",
              "Message": `A note was added to MO-Card #${mo.MO_Name} by ${currentUser.Full_Name || currentUser.Account_Name}.`,
              "Type": "Note_Added",
              "Entity_Type": "MO-Card",
              "Entity_ID": mo.id,
              "Project_ID": mo.Project_Name,
              "Created_By": currentUser.id,
              "Created_At": new Date().toISOString(),
              "Recipient": recipient.id,
              "Priority": "info",
              "Action_Required": false,
              "Action_Taken": false,
              "Link_To_Action": `/MO_Card.html?id=${mo.id}#notes`,
            };
            console.log('Creating note notification for recipient:', recipient.id, notificationData);
            try {
                await pb.collection('Notifications').create(notificationData);
                console.log('Note notification created for:', recipient.id);
                // Show browser notification if this user is the recipient
                if (recipient.id === currentUser.id && window.Notification) {
                    if (Notification.permission === 'granted') {
                        new Notification(notificationData.Title, {
                            body: notificationData.Message,
                            icon: 'https://mo.lab-tronic.com/logo.png',
                            badge: 'https://mo.lab-tronic.com/logo.png',
                            data: notificationData
                        });
                    } else if (Notification.permission !== 'denied') {
                        Notification.requestPermission().then(permission => {
                            if (permission === 'granted') {
                                new Notification(notificationData.Title, {
                                    body: notificationData.Message,
                                    icon: 'https://mo.lab-tronic.com/logo.png',
                                    badge: 'https://mo.lab-tronic.com/logo.png',
                                    data: notificationData
                                });
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to create note notification for', recipient.id, err);
            }
        }
    } catch (error) {
        console.error('Failed to send note notifications:', error);
    }
}

function updateMOStatusInHeader(percentage) {
    // Update the MO status badge in the header if it exists
    const statusElement = document.getElementById('moStatus');
    if (statusElement) {
        if (percentage === 100) {
            statusElement.textContent = 'Completed';
            statusElement.className = 'badge badge-success';
        } else if (percentage >= 50) {
            statusElement.textContent = 'In Progress';
            statusElement.className = 'badge badge-primary';
        } else if (percentage > 0) {
            statusElement.textContent = 'Started';
            statusElement.className = 'badge badge-warning';
        } else {
            statusElement.textContent = 'Pending';
            statusElement.className = 'badge badge-secondary';
        }
    }
}

function updateProcessNamesList() {
    const processNamesList = document.getElementById('processNamesList');
    // Gather unique process names from currentParts
    const processNamesSet = new Set();
    currentParts.forEach(part => {
        for (let i = 1; i <= 5; i++) {
            const processField = `Process${i}`;
            if (part[processField] && part[processField].trim() !== '') {
                processNamesSet.add(part[processField]);
            }
        }
    });
    const processNames = Array.from(processNamesSet).sort();

    processNamesList.innerHTML = '';
    processNames.forEach(processName => {
        const button = document.createElement('button');
        button.className = 'btn btn-secondary';
        button.innerHTML = `<span style="color: #2563eb;">✅ Mark all ${processName} as Done</span>`;
        button.onclick = function() {
            markAllProcessAsDone(processName, this);
        };
        processNamesList.appendChild(button);
    });
    
}

async function markAllAsDone() {
    const button = document.getElementById('markAllDoneBtn');
    const originalText = button.innerHTML;
    
    try {
        button.innerHTML = '⏳ Updating...';
        button.disabled = true;
        
        currentParts.forEach(part => {
            for (let i = 1; i <= 5; i++) {
                const processField = `Process${i}`;
                const statusField = `Process${i}_Status`;
                
                if (part[processField] && part[processField].trim() !== '') {
                    const key = `${part.id}-${statusField}`;
                    statusChanges.set(key, 'Done');
                    // Update local currentParts immediately for UI sync
                    part[statusField] = 'Done';
                }
            }
        });
        
        hasUnsavedChanges = true;
        const saveChangesSection = document.getElementById('saveChangesSection');
        if (saveChangesSection) {
            saveChangesSection.style.display = 'block';
        }
        
        // Update UI
        updateOverallProgress();
        renderPartsTable();
        
    } catch (error) {
        console.error('Error marking all as done:', error);
        showError('Failed to update statuses');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

async function markAllProcessAsDone(processName, button) {
    if (!button) return;
    const originalText = button.innerHTML;
  
    try {
        button.innerHTML = '⏳ Updating...';
        button.disabled = true;
        
        currentParts.forEach(part => {
            for (let i = 1; i <= 5; i++) {
                const processField = `Process${i}`;
                const statusField = `Process${i}_Status`;
                
                if (part[processField] === processName) {
                    const key = `${part.id}-${statusField}`;
                    statusChanges.set(key, 'Done');
                    // Update local currentParts immediately for UI sync
                    part[statusField] = 'Done';
                }
            }
        });
        
        hasUnsavedChanges = true;
        const saveChangesSection = document.getElementById('saveChangesSection');
        if (saveChangesSection) {
            saveChangesSection.style.display = 'block';
        }
        
        // Update UI
        updateOverallProgress();
        renderPartsTable();
        
    } catch (error) {
        console.error('Error marking process as done:', error);
        showError('Failed to update statuses');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

async function saveAllChanges() {
    if (statusChanges.size === 0) return;
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    const user = getCurrentUser();
    const role = Array.isArray(user.Role) ? user.Role[0] : user.Role;
    
    if (!user || role !== 'Production Engineer') {
        showError('Only Production Engineers can save process status changes');
        return;
    }

    try {
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        // Group changes by part ID
        const partUpdates = new Map();
        statusChanges.forEach((newStatus, key) => {
            const [partId, statusField] = key.split('-');
            if (!/^Process[1-5]_Status$/.test(statusField)) return;
            if (!partUpdates.has(partId)) {
                partUpdates.set(partId, {});
            }
            partUpdates.get(partId)[statusField] = newStatus;
        });
        // Update each part and update local currentParts
        for (const [partId, updates] of partUpdates) {
            await pb.collection('Parts_Table').update(partId, updates);
            // Update local currentParts
            const idx = currentParts.findIndex(p => p.id === partId);
            if (idx !== -1) {
                currentParts[idx] = { ...currentParts[idx], ...updates };
            }
        }
        // Clear changes
        statusChanges.clear();
        hasUnsavedChanges = false;
        const saveChangesSection = document.getElementById('saveChangesSection');
        if (saveChangesSection) {
            saveChangesSection.style.display = 'none';
        }
        showSuccessBlue('All changes saved successfully!');
        // Re-render table to reflect new statuses
        renderPartsTable();
        updateOverallProgress();
    } catch (error) {
        console.error('Error saving changes:', error);
        showError('Failed to save changes');
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

// Inline Note Management
function setupNoteForm() {
    const noteForm = document.getElementById('noteForm');
    const noteContent = document.getElementById('noteContent');
    const saveBtn = document.getElementById('saveNoteBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const noteMessage = document.getElementById('noteMessage');

    noteForm.onsubmit = async function(e) {
        e.preventDefault();
        const content = noteContent.value.trim();
        if (!content) {
            showNoteMessage('Note content cannot be empty', true);
            return;
        }
        const user = getCurrentUser();
        if (editingNoteIndex === -1) {
            // Add new note
            notes.push({
                content,
                created: new Date().toISOString(),
                user_name: user ? (user.Full_Name || user.Account_Name || 'Unknown') : 'Unknown'
            });
        } else {
            // Edit existing note
            notes[editingNoteIndex].content = content;
            notes[editingNoteIndex].edited = new Date().toISOString();
        }
        try {
            await pb.collection('MO_Table').update(currentMO.id, {
                Notes: JSON.stringify(notes)
            });
            showNoteMessage(editingNoteIndex === -1 ? 'Note added successfully!' : 'Note updated successfully!', false);
            editingNoteIndex = -1;
            noteContent.value = '';
            cancelBtn.style.display = 'none';
            renderNotes();
            handleNoteAdded(currentMO, content); // Call the new function here
        } catch (error) {
            showNoteMessage('Failed to save note', true);
        }
    };
    cancelBtn.onclick = function() {
        editingNoteIndex = -1;
        noteContent.value = '';
        cancelBtn.style.display = 'none';
        renderNotes();
    };
}

function showNoteMessage(msg, isError) {
    const noteMessage = document.getElementById('noteMessage');
    noteMessage.textContent = msg;
    noteMessage.style.color = isError ? '#d32f2f' : '#2563eb';
    setTimeout(() => { noteMessage.textContent = ''; }, 2000);
}

function loadNotes() {
    try {
        if (currentMO.Notes) {
            if (typeof currentMO.Notes === 'string') {
                notes = JSON.parse(currentMO.Notes);
            } else {
                notes = currentMO.Notes;
            }
        } else {
            notes = [];
        }
    } catch (error) {
        console.error('Error parsing notes:', error);
        notes = [];
    }
    renderNotes();
    setupNoteForm();
}

function renderNotes() {
    const notesList = document.getElementById('notesList');
    const noNotes = document.getElementById('noNotes');
    if (notes.length === 0) {
        notesList.style.display = 'none';
        noNotes.style.display = 'block';
        return;
    }
    notesList.style.display = 'block';
    noNotes.style.display = 'none';
    notesList.innerHTML = '';
    notes.forEach((note, index) => {
        const noteElement = createNoteElement(note, index);
        notesList.appendChild(noteElement);
    });
}

function createNoteElement(note, index) {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note-item mb-4 p-4 border rounded';
    const user = getCurrentUser();
    const canEdit = user && (note.user_name === user.Full_Name || note.user_name === user.Account_Name);
    if (editingNoteIndex === index) {
        // Inline edit form for this note
        noteDiv.innerHTML = `
            <textarea class="form-textarea mb-2" rows="4" id="editNoteContent${index}">${note.content}</textarea>
            <div style="display: flex; gap: 0.5em;">
                <button class="btn btn-primary btn-sm" id="saveEditBtn${index}">Save</button>
                <button class="btn btn-secondary btn-sm" id="cancelEditBtn${index}">Cancel</button>
            </div>
        `;
        setTimeout(() => {
            document.getElementById(`saveEditBtn${index}`).onclick = async function() {
                const newContent = document.getElementById(`editNoteContent${index}`).value.trim();
                if (!newContent) {
                    showNoteMessage('Note content cannot be empty', true);
                    return;
                }
                notes[index].content = newContent;
                notes[index].edited = new Date().toISOString();
                try {
                    await pb.collection('MO_Table').update(currentMO.id, {
                        Notes: JSON.stringify(notes)
                    });
                    showNoteMessage('Note updated successfully!', false);
                    editingNoteIndex = -1;
                    renderNotes();
                } catch (error) {
                    showNoteMessage('Failed to update note', true);
                }
            };
            document.getElementById(`cancelEditBtn${index}`).onclick = function() {
                editingNoteIndex = -1;
                renderNotes();
            };
        }, 0);
    } else {
        noteDiv.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="font-semibold text-sm">${note.user_name}</span>
                <div class="flex gap-2">
                    ${canEdit ? `<button class="btn btn-secondary btn-sm" onclick="editNoteInline(${index})">✏️ Edit</button>` : ''}
                    ${canEdit ? `<button class="btn btn-secondary btn-sm" onclick="deleteNote(${index})">🗑️ Delete</button>` : ''}
                </div>
            </div>
            <p class="text-sm mb-2">${note.content}</p>
            <span class="text-xs text-muted-foreground">${formatDate(note.created)}${note.edited ? ' (edited)' : ''}</span>
        `;
    }
    return noteDiv;
}

window.editNoteInline = function(index) {
    editingNoteIndex = index;
    renderNotes();
};

window.deleteNote = async function(noteIndex) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    notes.splice(noteIndex, 1);
    try {
        await pb.collection('MO_Table').update(currentMO.id, {
            Notes: JSON.stringify(notes)
        });
        showNoteMessage('Note deleted successfully!', false);
        renderNotes();
    } catch (error) {
        showNoteMessage('Failed to delete note', true);
    }
};

// File Management
async function downloadAllFiles() {
    if (!currentMO.Files || currentMO.Files.length === 0) {
        showError('No files to download');
        return;
    }
    
    // Attempt native share if mobile + Web Share
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (navigator.share && isMobile) {
        try {
            const files = await fetchFilesAsBlobs();
            if (files.length) {
                await navigator.share({
                    title: `MO Files - ${currentMO.MO_Name}`,
                    text: `Files for Manufacturing Order: ${currentMO.MO_Name}`,
                    files
                });
                showSuccess('Files shared via native share!');
                return;
            }
        } catch (err) {
            console.warn('Native share failed, falling back to downloads:', err);
        }
    }

    // Fallback: Download files one by one
    showSuccess(`Starting download of ${currentMO.Files.length} files...`);
    for (let i = 0; i < currentMO.Files.length; i++) {
        const file = currentMO.Files[i];
        try {
            await downloadFile(file);
            if (i < currentMO.Files.length - 1) {
                await new Promise(res => setTimeout(res, 1500));
            }
        } catch (err) {
            console.error(`Failed to download ${file}:`, err);
        }
    }
    showSuccess(`Download process completed for ${currentMO.Files.length} files`);
}



async function downloadFile(file) {
    // force download attachment
    const fileUrl = `${getPocketBaseUrl()}/api/files/MO_Table/${currentMO.id}/${file}?download`;
    
    try {
        showSuccess(`Starting download: ${file}`);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = file;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showSuccess(`Downloaded: ${file}`);
    } catch (error) {
        console.error('Download failed:', error);
        showError(`Failed to download: ${file} - ${error.message}`);
        // fallback direct link
        const fallback = document.createElement('a');
        fallback.href = fileUrl;
        fallback.download = file;
        fallback.style.display = 'none';
        document.body.appendChild(fallback);
        fallback.click();
        document.body.removeChild(fallback);
        showSuccess(`Started download via fallback: ${file}`);
    }
}

// --- helper: fetch & wrap any MO file as a File object ---
async function fetchFileAsFileObj(fileName) {
    const url = `${getPocketBaseUrl()}/api/files/MO_Table/${currentMO.id}/${fileName}?download`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const blob = await res.blob();
    // wrap it in a File with a generic MIME so canShare will see it
    return new File([blob], fileName, { type: 'application/octet-stream' });
  }
  
  async function shareFile(fileName) {
    if (!currentMO || !fileName) {
        showError('No file to share');
        return;
    }
    const url = `${getPocketBaseUrl()}/api/files/MO_Table/${currentMO.id}/${fileName}?download`;

    // Native share first
    try {
        const file = await urlToFile(url, fileName);
        if (canNativeShareFiles([file])) {
            await navigator.share({
                title: `MO File - ${currentMO.MO_Name}`,
                text: `File for Manufacturing Order: ${currentMO.MO_Name}`,
                files: [file]
            });
            showSuccess('Shared via native share!');
            return;
        }
    } catch (err) {
        console.warn('Native file share failed; falling back to link:', err);
    }

    // Fallback: link modal
    showShareScreen(url, `MO File - ${currentMO.MO_Name}`);
}
// ---------- Native Share Helpers (Chrome mobile + desktop) ----------
function canNativeShareFiles(files) {
    try {
        return !!(navigator.share && navigator.canShare && files && files.length && navigator.canShare({ files }));
    } catch {
        return false;
    }
}

async function urlToFile(url, nameHint) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const blob = await res.blob();
    const name = nameHint || (url.split('/').pop() || 'file');
    const type = blob.type || 'application/octet-stream';
    return new File([blob], name, { type });
}

// Simple fallback modal with copyable links
function showShareScreen(content, title) {
    const modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,.5);
        display: flex; align-items: center; justify-content: center; z-index: 10000;
    `;
    modal.innerHTML = `
      <div style="background:#fff;padding:1.25rem;border-radius:.5rem;max-width:640px;width:92%;box-shadow:0 10px 25px rgba(0,0,0,.2)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
          <h3 style="margin:0;font-size:1.1rem;font-weight:700">${title}</h3>
          <button onclick="closeShareScreen()" style="background:none;border:none;font-size:1.5rem;cursor:pointer">&times;</button>
        </div>
        <textarea id="shareContent" readonly style="width:100%;min-height:220px;padding:.75rem;border:1px solid #e5e7eb;border-radius:.5rem;font-family:monospace;font-size:.9rem">${content}</textarea>
        <div style="display:flex;gap:.5rem;margin-top:.75rem;flex-wrap:wrap">
          <button onclick="copyToClipboard()" class="btn btn-primary">📋 Copy to Clipboard</button>
          <button onclick="closeShareScreen()" class="btn btn-secondary">Close</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    setTimeout(() => {
        const t = document.getElementById('shareContent'); if (t) { t.focus(); t.select(); }
    }, 50);
}
function closeShareScreen() {
    const m = document.getElementById('shareModal'); if (m) m.remove();
}
function copyToClipboard() {
    const t = document.getElementById('shareContent');
    if (!t) return;
    t.select();
    (navigator.clipboard?.writeText(t.value) || Promise.reject()).then(
        () => showSuccess('Content copied to clipboard!'),
        () => {
            try { document.execCommand('copy'); showSuccess('Content copied to clipboard!'); }
            catch { showError('Copy failed.'); }
        }
    );
}

  
async function shareAllFiles() {
    if (!currentMO || !Array.isArray(currentMO.Files) || currentMO.Files.length === 0) {
        showError('No files to share');
        return;
    }

    // Build URLs (always needed for fallback)
    const urls = currentMO.Files.map(f => `${getPocketBaseUrl()}/api/files/MO_Table/${currentMO.id}/${f}?download`);
    const names = currentMO.Files.map(f => (typeof f === 'string' ? f : (f?.name || 'file')));

    // Try native share with file objects (Chrome mobile + desktop where supported)
    try {
        const files = await Promise.all(urls.map((u, i) => urlToFile(u, names[i])));
        if (canNativeShareFiles(files)) {
            await navigator.share({
                title: `MO Files - ${currentMO.MO_Name}`,
                text: `Files for Manufacturing Order: ${currentMO.MO_Name}`,
                files
            });
            showSuccess('Shared via native share!');
            return;
        }
    } catch (err) {
        console.warn('Native file share failed; falling back to links:', err);
    }

    // Fallback: show copyable links
    showShareScreen(urls.join('\n'), `MO Files - ${currentMO.MO_Name}`);
}


// Function to toggle file sent status
async function toggleFileSentStatus(fileName, isSent) {
    if (!currentMO || !currentMO.Files_Status) {
        console.error('No MO data or Files_Status available');
        return;
    }
    
    const user = getCurrentUser();
    if (!checkUserRole(user, 'Production Engineer')) {
        showError('Only Production Engineers can mark files as sent');
        return;
    }
    
    
    try {
        let fileStatus = currentMO.Files_Status.find(f => f.file === fileName);
        
        if (fileStatus) {
            fileStatus.sent = isSent;
            fileStatus.sentBy = isSent ? user.Full_Name || user.Account_Name : '';
            fileStatus.sentDate = isSent ? new Date().toISOString() : '';
        } else {
            fileStatus = {
                file: fileName,
                sent: isSent,
                sentBy: isSent ? user.Full_Name || user.Account_Name : '',
                sentDate: isSent ? new Date().toISOString() : ''
            };
            currentMO.Files_Status.push(fileStatus);
        }
        
        await pb.collection('MO_Table').update(currentMO.id, {
            Files_Status: JSON.stringify(currentMO.Files_Status)
        });
        
        renderFiles();
    } catch (error) {
        console.error('Error updating file sent status:', error);
        showError(`Failed to update file status: ${error.message}`);
        
        const checkbox = document.querySelector(`input[onchange*="${fileName}"]`);
        if (checkbox) {
            checkbox.checked = !isSent;
        }
    }
}

// Function to mark all files as sent
async function markAllFilesAsSent() {
    if (!currentMO || !currentMO.Files || currentMO.Files.length === 0) {
        showError('No files to mark as sent');
        return;
    }
    
    const user = getCurrentUser();
    if (!checkUserRole(user, 'Production Engineer')) {
        showError('Only Production Engineers can mark files as sent');
        return;
    }
    
    
    try {
        showSuccess('Marking all files as sent...');
        
        for (const fileName of currentMO.Files) {
            let fileStatus = currentMO.Files_Status.find(f => f.file === fileName);
            
            if (fileStatus) {
                fileStatus.sent = true;
                fileStatus.sentBy = user.Full_Name || user.Account_Name;
                fileStatus.sentDate = new Date().toISOString();
            } else {
                fileStatus = {
                    file: fileName,
                    sent: true,
                    sentBy: user.Full_Name || user.Account_Name,
                    sentDate: new Date().toISOString()
                };
                currentMO.Files_Status.push(fileStatus);
            }
        }
        
        await pb.collection('MO_Table').update(currentMO.id, {
            Files_Status: JSON.stringify(currentMO.Files_Status)
        });
        
        renderFiles();
    } catch (error) {
        console.error('Error marking all files as sent:', error);
        showError(`Failed to mark files as sent: ${error.message}`);
    }
}

// Function to check and log Web Share API support
function checkWebShareSupport() {
    const isWebShareSupported = !!navigator.share;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('Web Share API Support Check:');
    console.log('- navigator.share available:', isWebShareSupported);
    console.log('- Is mobile device:', isMobile);
    
    return isWebShareSupported;
}

function closeShareScreen() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.remove();
    }
}

function copyToClipboard() {
    const textarea = document.getElementById('shareContent');
    if (textarea) {
        textarea.select();
        navigator.clipboard.writeText(textarea.value).then(() => {
            showSuccess('Content copied to clipboard!');
        }).catch(() => {
            document.execCommand('copy');
            showSuccess('Content copied to clipboard!');
        });
    }
}

// Image Preview
window.showImagePreview = function(src) {
    document.getElementById('previewImage').src = src;
    document.getElementById('imagePreviewModal').style.display = 'flex';
};

window.closeImagePreview = function() {
    document.getElementById('imagePreviewModal').style.display = 'none';
};

// Utility Functions
function getMOStatus(completed) {
    if (completed) {
        return { text: 'Completed', badge: 'success' };
    } else {
        return { text: 'In Progress', badge: 'primary' };
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
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
        z-index: 1000;
        background: var(--color-success);
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

function showError(message) {
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

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const modals = ['noteModal', 'imagePreviewModal', 'cadPreviewModal'];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal && modal.style.display === 'block') {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        }
    });
    
    const shareModal = document.getElementById('shareModal');
    if (shareModal && event.target === shareModal) {
        closeShareScreen();
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = ['noteModal', 'imagePreviewModal', 'cadPreviewModal'];
        
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
        
        closeShareScreen();
    }
});

// Add utility classes and styles
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

.status-select {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    background: var(--color-background);
    color: var(--color-foreground);
    font-size: 0.875rem;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: var(--color-background);
    border-radius: 0.5rem;
    box-shadow: var(--shadow-lg);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    padding: 1rem;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.modal-body {
    padding: 1rem;
}

.modal-footer {
    padding: 1rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-muted-foreground);
}

.form-textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    background: var(--color-background);
    color: var(--color-foreground);
    resize: vertical;
}

.note-item {
    background: var(--color-card);
    border: 1px solid var(--color-border);
}

.thumbnail {
    transition: transform 0.2s ease;
}

.thumbnail:hover {
    transform: scale(1.1);
}

.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
}

/* Responsive Parts Table for Mobile */
@media (max-width: 768px) {
  .responsive-table table, .responsive-table thead, .responsive-table tbody, .responsive-table tr, .responsive-table th, .responsive-table td {
    display: block;
    width: 100%;
  }
  .responsive-table thead {
    display: none;
  }
  .responsive-table tr {
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    margin-bottom: 1.5rem;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    background: #fff;
    padding: 1.25rem 1rem;
  }
  .responsive-table td[data-label] {
    padding: 0.5rem 0;
    border: none;
    position: relative;
    font-size: 1.05em;
  }
  .responsive-table td[data-label]:before {
    color: #6b7280;
    font-size: 0.95em;
    font-weight: 600;
    margin-bottom: 0.15rem;
    display: block;
  }
  .responsive-table td[data-label='Part Code'],
  .responsive-table td[data-label='Part Name'] {
    font-size: 1.15em;
    font-weight: 700;
    color: #222;
  }
  .responsive-table td[data-label='Part Image'] {
    text-align: right;
  }
  .responsive-table .badge {
    margin-left: 0.5em;
    margin-bottom: 0.1em;
  }
  .responsive-table td[data-label='Processes'] div {
    margin-bottom: 0.25em;
  }
}
</style>
`);

// Fix dropdown menu for process status
window.showStatusDropdown = function(partId, statusField, currentStatus) {
    const user = getCurrentUser();
    if (!user || (Array.isArray(user.Role) ? user.Role[0] : user.Role) !== 'Production Engineer') return;
    const badgeId = `badge_${partId}_${statusField}`;
    const badgeElem = document.getElementById(badgeId);
    if (!badgeElem) return;
    // Remove any existing dropdown
    const existing = document.getElementById('status-dropdown-menu');
    if (existing) existing.remove();
    // Create dropdown menu
    const menu = document.createElement('div');
    menu.id = 'status-dropdown-menu';
    menu.className = 'status-dropdown-menu';
    menu.style.position = 'absolute';
    menu.style.zIndex = 1002;
    menu.style.background = '#fff';
    menu.style.border = '1px solid #ddd';
    menu.style.borderRadius = '6px';
    menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    menu.style.padding = '0.25em 0';
    menu.style.minWidth = '120px';
    menu.style.fontSize = '0.95em';
    menu.style.left = badgeElem.getBoundingClientRect().left + window.scrollX + 'px';
    menu.style.top = badgeElem.getBoundingClientRect().bottom + window.scrollY + 'px';
    ['None','In Progress','Done','Rejected','Cancelled'].forEach(opt => {
        const item = document.createElement('div');
        item.textContent = opt;
        item.className = `status-dropdown-item badge badge-${getStatusBadgeClass(opt)}`;
        item.style.cursor = 'pointer';
        item.style.margin = '0.15em 0.5em';
        item.onclick = function(e) {
            e.stopPropagation();
            updateProcessStatus({ value: opt }, partId, statusField);
            menu.remove();
            // Re-render the badge immediately
            setTimeout(() => {
                const newBadgeElem = document.getElementById(badgeId);
                if (newBadgeElem) {
                    newBadgeElem.textContent = opt;
                    newBadgeElem.className = `badge badge-${getStatusBadgeClass(opt)} clickable-status`;
                }
            }, 10);
        };
        if (opt === currentStatus) {
            item.style.outline = '2px solid #0070f3';
        }
        menu.appendChild(item);
    });
    document.body.appendChild(menu);
    // Remove menu on click outside
    setTimeout(() => {
        function removeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('mousedown', removeMenu);
            }
        }
        document.addEventListener('mousedown', removeMenu);
    }, 0);
};

function createStatusBadge(partId, statusField, status) {
    const badge = document.createElement('span');
    badge.id = `badge_${partId}_${statusField}`;
    badge.className = `badge badge-${getStatusBadgeClass(status)} clickable-status`;
    badge.style.fontSize = '0.85em';
    badge.style.cursor = 'pointer';
    badge.textContent = status;
    badge.onclick = function() { window.showStatusDropdown(partId, statusField, status); };
    return badge;
}

// Add dropdown menu styles
if (!document.getElementById('status-dropdown-style')) {
    document.head.insertAdjacentHTML('beforeend', `
    <style id="status-dropdown-style">
    .status-dropdown-menu {
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        border-radius: 6px;
        border: 1px solid #ddd;
        background: #fff;
        min-width: 120px;
        padding: 0.25em 0;
        position: absolute;
    }
    .status-dropdown-item {
        padding: 0.35em 1em;
        margin: 0.1em 0;
        display: block;
        border-radius: 4px;
        transition: background 0.15s;
    }
    .status-dropdown-item:hover {
        background: #f3f4f6;
    }
    
    /* Custom badge styles for Rejected and Cancelled */
    .badge.badge-destructive {
        background: #dc2626;
        color: white;
    }
    
    .badge.badge-dark {
        background: #1f2937;
        color: white;
    }
    </style>
    `);
}

// Add sticky styles
if (!document.getElementById('sticky-save-style')) {
    document.head.insertAdjacentHTML('beforeend', `
    <style id="sticky-save-style">
    #saveBtn.sticky-save {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 1001;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        border-radius: 2em;
        padding-left: 2em;
        padding-right: 2em;
    }
    @media (max-width: 768px) {
        #saveBtn.sticky-save {
            left: 0;
            right: 0;
            width: 90vw;
            margin: 0 auto;
            bottom: 12px;
        }
    }
    </style>
    `);
}

// Add sticky-save class to the button after DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) saveBtn.classList.add('sticky-save');
});

// Add blue success message beside save button
function showSuccessBlue(message) {
    let msg = document.getElementById('save-success-msg');
    if (!msg) {
        msg = document.createElement('span');
        msg.id = 'save-success-msg';
        msg.style.marginLeft = '1.5em';
        msg.style.fontWeight = '600';
        msg.style.fontSize = '1em';
        msg.style.verticalAlign = 'middle';
        msg.style.color = '#2563eb'; // Geist/website blue
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn && saveBtn.parentNode) {
            saveBtn.parentNode.insertBefore(msg, saveBtn.nextSibling);
        }
    }
    msg.textContent = message;
    msg.style.display = 'inline';
    setTimeout(() => { if (msg) msg.style.display = 'none'; }, 2000);
}

// Utility to get icon and color for MO type
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
    return `<span class=\"mo-type-box\" style=\"background:${color};\">${icon ? `<img src='${icon}' alt='${displayType}' style='width:2em;height:2em;vertical-align:middle;margin-right:0.6em;'>` : ''}${displayType}</span>`;
}



