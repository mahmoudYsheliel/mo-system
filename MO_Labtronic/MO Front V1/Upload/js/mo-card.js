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

function updateUserInfo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.Full_Name || user.Account_Name || 'User';
        document.getElementById('userRole').textContent = user.Role || 'Unknown Role';
    }
}

async function loadMOData(moId) {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    
    try {
        loadingState.style.display = 'block';
        errorState.style.display = 'none';
        
        // Load MO data
        currentMO = await pb.collection('MO_Table').getOne(moId);
        
        // Parse Files_Status if it's a string (PocketBase JSON field format)
        if (currentMO.Files_Status && typeof currentMO.Files_Status === 'string') {
            try {
                if (currentMO.Files_Status.trim()) {
                    currentMO.Files_Status = JSON.parse(currentMO.Files_Status);
                    console.log('Parsed Files_Status from JSON string:', currentMO.Files_Status);
                } else {
                    console.log('Files_Status is empty string, initializing as empty array');
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
        if (user && user.Role === 'Production Engineer') {
            markAllSection.style.display = 'block';
        } else {
            markAllSection.style.display = 'none';
        }
    }
}

function updateMarkAllAsSentVisibility() {
    const user = getCurrentUser();
    const markAllAsSentBtn = document.querySelector('button[onclick="markAllFilesAsSent()"]');
    
    if (markAllAsSentBtn) {
        if (user && user.Role === 'Production Engineer') {
            markAllAsSentBtn.style.display = 'inline-block';
        } else {
            markAllAsSentBtn.style.display = 'none';
        }
    }
}

function renderMOData(projectDetails) {
    if (!currentMO) return;
    // Update page title and header
    document.title = `${currentMO.MO_Name} - LabTronic MO System`;
    document.getElementById('moTitle').textContent = currentMO.MO_Name;
    // Update MO data fields
    document.getElementById('moName').textContent = currentMO.MO_Name || 'N/A';
    document.getElementById('moType').textContent = currentMO.MO_Type || 'N/A';
    
    // Display project information from Projects collection if available
    if (projectDetails) {
        document.getElementById('projectName').textContent = projectDetails.Project_Name || 'N/A';
        document.getElementById('university').textContent = projectDetails.University || 'N/A';
        document.getElementById('projectManager').textContent = projectDetails.Project_Manager || 'N/A';
        document.getElementById('designEng').textContent = projectDetails.Design_Engineer || 'N/A';
        document.getElementById('productionEng').textContent = projectDetails.Production_Engineer || 'N/A';
    } else {
        // Fallback to MO_Table data if project details not found
        document.getElementById('projectName').textContent = currentMO.Project_Name || 'N/A';
        document.getElementById('university').textContent = currentMO.University || 'N/A';
        document.getElementById('projectManager').textContent = currentMO.Project_Manager || 'N/A';
        document.getElementById('designEng').textContent = currentMO.Design_Eng || 'N/A';
        document.getElementById('productionEng').textContent = currentMO.Production_Eng || 'N/A';
    }
    
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
    const isProductionEngineer = user && user.Role === 'Production Engineer';
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
    const isProductionEngineer = user && user.Role === 'Production Engineer';
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
        button.onclick = () => markAllProcessAsDone(processName);
        processNamesList.appendChild(button);
    });
}

async function markAllAsDone() {
    const button = document.getElementById('markAllDoneBtn');
    const originalText = button.innerHTML;
    
    try {
        button.innerHTML = '⏳ Updating...';
        button.disabled = true;
        
        let updateCount = 0;
        
        currentParts.forEach(part => {
            for (let i = 1; i <= 5; i++) {
                const processField = `Process${i}`;
                const statusField = `Process${i}_Status`;
                
                if (part[processField] && part[processField].trim() !== '') {
                    const key = `${part.id}-${statusField}`;
                    statusChanges.set(key, 'Done');
                    // Update local currentParts immediately for UI sync
                    part[statusField] = 'Done';
                    updateCount++;
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

async function markAllProcessAsDone(processName) {
    const button = event.target;
    const originalText = button.innerHTML;
    
    try {
        button.innerHTML = '⏳ Updating...';
        button.disabled = true;
        
        let updateCount = 0;
        
        currentParts.forEach(part => {
            for (let i = 1; i <= 5; i++) {
                const processField = `Process${i}`;
                const statusField = `Process${i}_Status`;
                
                if (part[processField] === processName) {
                    const key = `${part.id}-${statusField}`;
                    statusChanges.set(key, 'Done');
                    // Update local currentParts immediately for UI sync
                    part[statusField] = 'Done';
                    updateCount++;
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
    
    // Check Web Share API support based on caniuse.com data
    const isWebShareSupported = navigator.share && navigator.canShare;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Try Web Share API first (works on 91.22% of browsers according to caniuse.com)
    if (isWebShareSupported && isMobile) {
        try {
            // Check if file sharing is supported
            if (navigator.canShare({ files: [] })) {
                const files = await fetchFilesAsBlobs();
                if (files.length > 0) {
                    await navigator.share({
                        title: `MO Files - ${currentMO.MO_Name}`,
                        text: `Files for Manufacturing Order: ${currentMO.MO_Name}`,
                        files: files
                    });
                    showSuccess('Files shared successfully via native share!');
                    return;
                }
            }
        } catch (error) {
            console.log('Web Share API failed, falling back to download:', error);
            // Continue to download fallback
        }
    }
    
    // Fallback: Download files one by one using improved blob method
    showSuccess(`Starting download of ${currentMO.Files.length} files...`);
    
    for (let i = 0; i < currentMO.Files.length; i++) {
        const file = currentMO.Files[i];
        
        try {
            await downloadFile(file);
            
            // Add delay between downloads to prevent browser blocking
            if (i < currentMO.Files.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1500)); // Increased delay for better reliability
            }
        } catch (error) {
            console.error(`Failed to download file ${file}:`, error);
            // Continue with next file instead of stopping
        }
    }
    
    showSuccess(`Download process completed for ${currentMO.Files.length} files`);
}

async function shareAllFiles() {
    if (!currentMO.Files || currentMO.Files.length === 0) {
        showError('No files to share');
        return;
    }
    
    // Check Web Share API support (91.22% browser support according to caniuse.com)
    const isWebShareSupported = navigator.share && navigator.canShare;
    
    if (isWebShareSupported) {
        try {
            const fileUrls = currentMO.Files.map(file => {
                return `${getPocketBaseUrl()}/api/files/MO_Table/${currentMO.id}/${file}`;
            });
            
            const shareData = {
                title: `MO Files - ${currentMO.MO_Name}`,
                text: `Files for Manufacturing Order: ${currentMO.MO_Name}`,
                url: fileUrls[0] // Share first file URL as primary
            };
            
            // Try to share actual files if supported
            if (navigator.canShare({ files: [] })) {
                try {
                    const files = await fetchFilesAsBlobs();
                    if (files.length > 0) {
                        shareData.files = files;
                        console.log('Sharing files directly via Web Share API');
                    }
                } catch (error) {
                    console.log('Could not fetch files as blobs, sharing URLs instead:', error);
                }
            }
            
            await navigator.share(shareData);
            showSuccess('Files shared successfully via native share!');
            return;
            
        } catch (error) {
            console.log('Web Share API failed or cancelled:', error);
            // Fallback to desktop share screen
            const fileUrls = currentMO.Files.map(file => {
                return `${getPocketBaseUrl()}/api/files/MO_Table/${currentMO.id}/${file}`;
            });
            const shareText = `Files for MO: ${currentMO.MO_Name}\n\n${fileUrls.join('\n')}`;
            showShareScreen(shareText, `MO Files - ${currentMO.MO_Name}`);
        }
    } else {
        // Fallback for browsers without Web Share API (like Firefox)
        const fileUrls = currentMO.Files.map(file => {
            return `${getPocketBaseUrl()}/api/files/MO_Table/${currentMO.id}/${file}`;
        });
        const shareText = `Files for MO: ${currentMO.MO_Name}\n\n${fileUrls.join('\n')}`;
        showShareScreen(shareText, `MO Files - ${currentMO.MO_Name}`);
    }
}

async function downloadFile(file) {
    const fileUrl = `${getPocketBaseUrl()}/api/files/MO_Table/${currentMO.id}/${file}`;
    
    try {
        // Show loading state
        showSuccess(`Starting download: ${file}`);
        
        // Fetch the file as blob using fetch API
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Create blob from response
        const blob = await response.blob();
        
        // Create blob URL using URL.createObjectURL
        const blobUrl = URL.createObjectURL(blob);
        
        // Create anchor element for download
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = file; // Set the filename
        downloadLink.style.display = 'none';
        
        // Add to DOM, trigger click, and remove
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up blob URL to prevent memory leaks
        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
        }, 1000);
        
        showSuccess(`Downloaded: ${file}`);
        
    } catch (error) {
        console.error('Download failed:', error);
        showError(`Failed to download: ${file} - ${error.message}`);
        
        // Fallback: Try direct link download
        try {
            const fallbackLink = document.createElement('a');
            fallbackLink.href = fileUrl;
            fallbackLink.download = file;
            fallbackLink.target = '_blank';
            fallbackLink.style.display = 'none';
            
            document.body.appendChild(fallbackLink);
            fallbackLink.click();
            document.body.removeChild(fallbackLink);
            
            showSuccess(`Download started via fallback: ${file}`);
        } catch (fallbackError) {
            console.error('Fallback download also failed:', fallbackError);
            showError(`Download failed completely: ${file}`);
        }
    }
}

async function shareFile(file) {
    const fileUrl = `${getPocketBaseUrl()}/api/files/MO_Table/${currentMO.id}/${file}`;
    
    // Check Web Share API support (91.22% browser support according to caniuse.com)
    const isWebShareSupported = navigator.share && navigator.canShare;
    
    if (isWebShareSupported) {
        try {
            const shareData = {
                title: `File: ${file}`,
                text: `File from MO: ${currentMO.MO_Name}`,
                url: fileUrl
            };
            
            // Try to share the actual file if supported
            if (navigator.canShare({ files: [] })) {
                try {
                    const response = await fetch(fileUrl);
                    if (response.ok) {
                        const blob = await response.blob();
                        const fileBlob = new File([blob], file, { type: blob.type });
                        
                        if (navigator.canShare({ files: [fileBlob] })) {
                            shareData.files = [fileBlob];
                            console.log('Sharing file directly via Web Share API');
                        }
                    }
                } catch (error) {
                    console.log('Could not fetch file as blob, sharing URL instead:', error);
                }
            }
            
            await navigator.share(shareData);
            showSuccess('File shared successfully via native share!');
            
        } catch (error) {
            console.log('Web Share API failed or cancelled:', error);
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(fileUrl);
                showSuccess('File link copied to clipboard!');
            } catch (clipboardError) {
                showShareScreen(fileUrl, `File: ${file}`);
            }
        }
    } else {
        // Fallback for browsers without Web Share API (like Firefox)
        showShareScreen(fileUrl, `File: ${file}`);
    }
}

async function fetchFilesAsBlobs() {
    const files = [];
    
    for (const fileName of currentMO.Files) {
        try {
            const fileUrl = `${getPocketBaseUrl()}/api/files/MO_Table/${currentMO.id}/${fileName}`;
            
            // Fetch file as blob using fetch API
            const response = await fetch(fileUrl);
            
            if (response.ok) {
                // Create blob from response
                const blob = await response.blob();
                
                // Create File object from blob with proper filename and MIME type
                const fileBlob = new File([blob], fileName, { 
                    type: blob.type || 'application/octet-stream' 
                });
                
                files.push(fileBlob);
                console.log(`Successfully fetched file: ${fileName}`);
            } else {
                console.error(`Failed to fetch file ${fileName}: HTTP ${response.status}`);
            }
        } catch (error) {
            console.error(`Failed to fetch file ${fileName}:`, error);
        }
    }
    
    console.log(`Total files fetched as blobs: ${files.length}/${currentMO.Files.length}`);
    return files;
}

// Function to toggle file sent status
async function toggleFileSentStatus(fileName, isSent) {
    if (!currentMO || !currentMO.Files_Status) {
        console.error('No MO data or Files_Status available');
        return;
    }
    
    const user = getCurrentUser();
    if (!user || user.Role !== 'Production Engineer') {
        showError('Only Production Engineers can mark files as sent');
        return;
    }
    
    try {
        // Find existing status for this file
        let fileStatus = currentMO.Files_Status.find(f => f.file === fileName);
        
        if (fileStatus) {
            // Update existing status
            fileStatus.sent = isSent;
            fileStatus.sentBy = isSent ? user.Full_Name || user.Account_Name : '';
            fileStatus.sentDate = isSent ? new Date().toISOString() : '';
        } else {
            // Create new status entry
            fileStatus = {
                file: fileName,
                sent: isSent,
                sentBy: isSent ? user.Full_Name || user.Account_Name : '',
                sentDate: isSent ? new Date().toISOString() : ''
            };
            currentMO.Files_Status.push(fileStatus);
        }
        
        // Update the MO record in PocketBase
        await pb.collection('MO_Table').update(currentMO.id, {
            Files_Status: JSON.stringify(currentMO.Files_Status)
        });
        
        // Re-render files to update the UI
        renderFiles();
        
    } catch (error) {
        console.error('Error updating file sent status:', error);
        showError(`Failed to update file status: ${error.message}`);
        
        // Revert the checkbox state
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
    if (!user || user.Role !== 'Production Engineer') {
        showError('Only Production Engineers can mark files as sent');
        return;
    }
    
    try {
        showSuccess('Marking all files as sent...');
        
        // Update all files to sent status
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
        
        // Update the MO record in PocketBase
        await pb.collection('MO_Table').update(currentMO.id, {
            Files_Status: JSON.stringify(currentMO.Files_Status)
        });
        
        // Re-render files to update the UI
        renderFiles();
        
    } catch (error) {
        console.error('Error marking all files as sent:', error);
        showError(`Failed to mark files as sent: ${error.message}`);
    }
}

// Function to check and log Web Share API support
function checkWebShareSupport() {
    const isWebShareSupported = navigator.share && navigator.canShare;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('Web Share API Support Check:');
    console.log('- navigator.share available:', !!navigator.share);
    console.log('- navigator.canShare available:', !!navigator.canShare);
    console.log('- Is mobile device:', isMobile);
    console.log('- Overall support:', isWebShareSupported);
    
    if (isWebShareSupported) {
        console.log('- Browser supports Web Share API (91.22% global support)');
        
        // Test file sharing capability
        if (navigator.canShare({ files: [] })) {
            console.log('- File sharing is supported');
        } else {
            console.log('- File sharing is NOT supported (URL sharing only)');
        }
    } else {
        console.log('- Browser does NOT support Web Share API (fallback to custom share)');
    }
    
    return isWebShareSupported;
}

function showShareScreen(content, title) {
    // Create share modal
    const modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600;">Share ${title}</h3>
                <button onclick="closeShareScreen()" style="
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 0.25rem;
                    color: #666;
                ">&times;</button>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Content to share:</label>
                <textarea id="shareContent" readonly style="
                    width: 100%;
                    min-height: 100px;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 0.25rem;
                    font-family: monospace;
                    font-size: 0.875rem;
                    resize: vertical;
                ">${content}</textarea>
            </div>
            
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button onclick="copyToClipboard()" style="
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    padding: 0.75rem 1rem;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    font-weight: 500;
                ">📋 Copy to Clipboard</button>
                <button onclick="closeShareScreen()" style="
                    background: var(--color-secondary);
                    color: white;
                    border: none;
                    padding: 0.75rem 1rem;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    font-weight: 500;
                ">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on the textarea
    setTimeout(() => {
        const textarea = document.getElementById('shareContent');
        if (textarea) {
            textarea.focus();
            textarea.select();
        }
    }, 100);
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
            // Fallback for older browsers
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
    
    // Handle share modal
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
        
        // Close share modal with Escape
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
    if (!user || user.Role !== 'Production Engineer') return;
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