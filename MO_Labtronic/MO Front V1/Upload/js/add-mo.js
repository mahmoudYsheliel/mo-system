document.addEventListener('DOMContentLoaded', function() {
    // Initialize Add MO page
    initAddMOPage();
});

let csvData = null;
let imagesData = [];
let filesData = [];
let uploadProgress = {
    csv: false,
    images: false,
    files: false
};

function initAddMOPage() {
    // Check authentication and permissions
    if (!requireAuth()) return;
    if (!requirePermission('add_mo')) return;
    
    // Update user info
    updateUserInfo();
    
    // Setup drag and drop
    setupDragAndDrop();
    
    // Update progress
    updateProgress();
}

function updateUserInfo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.Full_Name || user.Account_Name || 'User';
        document.getElementById('userRole').textContent = user.Role || 'Unknown Role';
    }
}

function setupDragAndDrop() {
    const uploadAreas = ['csvUpload', 'imagesUpload', 'filesUpload'];
    
    uploadAreas.forEach(areaId => {
        const area = document.getElementById(areaId);
        
        area.addEventListener('dragover', function(e) {
            e.preventDefault();
            area.classList.add('dragover');
        });
        
        area.addEventListener('dragleave', function(e) {
            e.preventDefault();
            area.classList.remove('dragover');
        });
        
        area.addEventListener('drop', function(e) {
            e.preventDefault();
            area.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            handleFileDrop(areaId, files);
        });
    });
}

function handleFileDrop(areaId, files) {
    switch (areaId) {
        case 'csvUpload':
            if (files.length > 0 && files[0].type === 'text/csv') {
                handleCSVFile(files[0]);
            }
            break;
        case 'imagesUpload':
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            handleImagesFiles(imageFiles);
            break;
        case 'filesUpload':
            handleFilesFiles(files);
            break;
    }
}

function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (file) {
        handleCSVFile(file);
    }
}

function handleCSVFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const csvText = e.target.result;
            csvData = parseCSV(csvText);
            
            if (csvData && csvData.length > 0) {
                uploadProgress.csv = true;
                showCSVPreview(csvData);
                updateProgress();
            } else {
                showError('Invalid CSV format or empty file');
            }
        } catch (error) {
            console.error('Error parsing CSV:', error);
            showError('Failed to parse CSV file');
        }
    };
    
    reader.readAsText(file);
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const requiredHeaders = [
        'Part_Code', 'Part_Name', 'Quantity', 'Part_Material', 
        'Part_Thickness', 'Part_Color', 'Process1', 'Process2', 
        'Process3', 'Process4', 'Process5'
    ];
    
    // Validate headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    
    return data;
}

function showCSVPreview(data) {
    const preview = document.getElementById('csvPreview');
    const tbody = document.getElementById('csvTableBody');
    
    tbody.innerHTML = '';
    
    // Show first 5 rows as preview
    data.slice(0, 5).forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.Part_Code}</td>
            <td>${row.Part_Name}</td>
            <td>${row.Quantity}</td>
            <td>${row.Part_Material}</td>
            <td>${row.Part_Thickness}</td>
            <td>${row.Part_Color}</td>
            <td>${row.Process1}</td>
            <td>${row.Process2}</td>
            <td>${row.Process3}</td>
            <td>${row.Process4}</td>
            <td>${row.Process5}</td>
        `;
        tbody.appendChild(tr);
    });
    
    if (data.length > 5) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="11" class="text-center text-muted-foreground">... and ${data.length - 5} more rows</td>`;
        tbody.appendChild(tr);
    }
    
    preview.style.display = 'block';
}

function handleImagesUpload(event) {
    const files = Array.from(event.target.files);
    handleImagesFiles(files);
}

function handleImagesFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showError('No image files found');
        return;
    }
    
    imagesData = imageFiles;
    uploadProgress.images = true;
    showImagesPreview(imageFiles);
    updateProgress();
}

function showImagesPreview(files) {
    const preview = document.getElementById('imagesPreview');
    const grid = document.getElementById('imagesGrid');
    
    grid.innerHTML = '';
    
    files.slice(0, 8).forEach(file => {
        const div = document.createElement('div');
        div.className = 'text-center';
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.className = 'w-16 h-16 object-cover rounded border mx-auto mb-2';
        img.alt = file.name;
        
        const p = document.createElement('p');
        p.className = 'text-xs text-muted-foreground';
        p.textContent = file.name;
        
        div.appendChild(img);
        div.appendChild(p);
        grid.appendChild(div);
    });
    
    if (files.length > 8) {
        const div = document.createElement('div');
        div.className = 'text-center flex items-center justify-center h-16';
        div.innerHTML = `<span class="text-muted-foreground">+${files.length - 8} more</span>`;
        grid.appendChild(div);
    }
    
    preview.style.display = 'block';
}

function handleFilesUpload(event) {
    const files = Array.from(event.target.files);
    handleFilesFiles(files);
}

function handleFilesFiles(files) {
    if (files.length === 0) {
        showError('No files selected');
        return;
    }
    
    filesData = files;
    uploadProgress.files = true;
    showFilesPreview(files);
    updateProgress();
}

function showFilesPreview(files) {
    const preview = document.getElementById('filesPreview');
    const grid = document.getElementById('filesGrid');
    
    grid.innerHTML = '';
    
    files.forEach(file => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 p-3 border rounded';
        
        const icon = document.createElement('span');
        icon.className = 'text-2xl';
        icon.textContent = getFileIcon(file.name);
        
        const info = document.createElement('div');
        info.className = 'flex-1';
        
        const name = document.createElement('p');
        name.className = 'font-semibold text-sm';
        name.textContent = file.name;
        
        const size = document.createElement('p');
        size.className = 'text-xs text-muted-foreground';
        size.textContent = formatFileSize(file.size);
        
        info.appendChild(name);
        info.appendChild(size);
        
        div.appendChild(icon);
        div.appendChild(info);
        grid.appendChild(div);
    });
    
    preview.style.display = 'block';
}

function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
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

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateProgress() {
    const completed = Object.values(uploadProgress).filter(Boolean).length;
    const total = 3;
    const percentage = (completed / total) * 100;
    
    document.getElementById('progressBar').style.width = `${percentage}%`;
    document.getElementById('progressText').textContent = `${completed}/${total} Complete`;
    
    // Enable/disable done button
    const doneBtn = document.getElementById('doneBtn');
    doneBtn.disabled = completed < total;
}

async function createMO() {
    if (!csvData || imagesData.length === 0 || filesData.length === 0) {
        showError('Please complete all uploads before creating MO');
        return;
    }
    
    const loadingState = document.getElementById('loadingState');
    const doneBtn = document.getElementById('doneBtn');
    
    try {
        loadingState.style.display = 'block';
        doneBtn.disabled = true;
        
        // Parse filename to extract MO details
        const csvFile = document.getElementById('csvFile').files[0];
        const moDetails = parseFilename(csvFile.name);
        
        if (!moDetails) {
            throw new Error('Invalid CSV filename format. Expected: MO-Name_MO-Type_Project-Code.csv');
        }
        
        console.log('Parsed MO details:', moDetails);
        
        // Search for project by Project_Code
        let projectDetails = null;
        try {
            const projectRecord = await pb.collection('Projects').getFirstListItem(`Project_Code = "${moDetails.projectCode}"`, {
                fields: 'id,University,Lab,Project_Name,Project_Code,Project_Manager,Design_Engineer,Production_Engineer'
            });
            projectDetails = projectRecord;
            console.log('Found project:', projectDetails);
        } catch (error) {
            console.warn('Project not found for code:', moDetails.projectCode);
            showError(`Project with code "${moDetails.projectCode}" not found. Please check the project code in your CSV filename.`);
            return;
        }
        
        // Create MO record with project data
        const moData = {
            MO_Name: moDetails.moName,
            MO_Type: moDetails.moType,
            Project_Name: moDetails.projectCode, // Store the project code
            University: projectDetails.University || '',
            Project_Manager: projectDetails.Project_Manager || '',
            Design_Eng: getCurrentUser().Full_Name,
            Production_Eng: projectDetails.Production_Engineer || '',
            Completed: 0,
            MO_Date: new Date().toISOString(),
            Notes: '',
            Files_Status: 'Uploaded'
        };
        
        console.log('Creating MO with data:', moData);
        
        // Create MO record first
        const moRecord = await pb.collection('MO_Table').create(moData);
        console.log('MO record created:', moRecord);
        
        // Upload files to the MO record
        await uploadFilesToMO(moRecord.id, filesData);
        
        // Create parts records
        await createPartsRecords(moDetails.moName, csvData, imagesData);
        
        // Show success and redirect
        showSuccess('Manufacturing Order created successfully!');
        setTimeout(() => {
            window.location.href = `MO_Card.html?id=${moRecord.id}`;
        }, 2000);
        
    } catch (error) {
        console.error('Error creating MO:', error);
        showError(error.message || 'Failed to create Manufacturing Order');
    } finally {
        loadingState.style.display = 'none';
        doneBtn.disabled = false;
    }
}

function parseFilename(filename) {
    // Expected format: MO-Name_MO-Type_Project-Code.csv
    const match = filename.match(/^(.+)_(.+)_(.+)\.csv$/);
    
    if (!match) {
        return null;
    }
    
    return {
        moName: match[1],
        moType: match[2],
        projectCode: match[3]
    };
}

async function uploadFilesToMO(moId, files) {
    const uploadedFiles = [];
    
    try {
        // Create FormData with all files
        const formData = new FormData();
        
        // Add each file to the Files field (multiple files)
        files.forEach((file, index) => {
            formData.append('Files', file);
        });
        
        console.log(`Uploading ${files.length} files to MO ${moId}`);
        
        // Update the MO record with all files at once
        const response = await pb.collection('MO_Table').update(moId, formData);
        
        console.log('Files uploaded successfully:', response);
        
        // Add file names to uploaded files list
        files.forEach(file => {
            uploadedFiles.push(file.name);
        });
        
        return uploadedFiles;
        
    } catch (error) {
        console.error('Error uploading files to MO:', error);
        throw new Error(`Failed to upload files: ${error.message}`);
    }
}

async function createPartsRecords(moName, partsData, images) {
    const imageMap = new Map();
    images.forEach(img => {
        const nameWithoutExt = img.name.split('.')[0];
        imageMap.set(nameWithoutExt, img);
    });
    
    for (const part of partsData) {
        try {
            const partData = {
                MO_Name: moName,
                Part_Code: part.Part_Code,
                Part_Name: part.Part_Name,
                Quantity: parseInt(part.Quantity) || 1,
                Part_Material: part.Part_Material,
                Part_Thickness: part.Part_Thickness,
                Part_Color: part.Part_Color,
                Process1: part.Process1,
                Process1_Status: 'None',
                Process2: part.Process2,
                Process2_Status: 'None',
                Process3: part.Process3,
                Process3_Status: 'None',
                Process4: part.Process4,
                Process4_Status: 'None',
                Process5: part.Process5,
                Process5_Status: 'None',
                Notes: ''
            };
            
            // Create the part record first
            const createdPart = await pb.collection('Parts_Table').create(partData);
            
            // Add part image if available - match by Part_Code
            const imageFile = imageMap.get(part.Part_Code);
            if (imageFile) {
                const formData = new FormData();
                formData.append('Part_Pic', imageFile);
                
                // Update the part record with the image
                await pb.collection('Parts_Table').update(createdPart.id, formData);
            }
            
        } catch (error) {
            console.error('Error creating part record:', part.Part_Code, error);
            throw new Error(`Failed to create part: ${part.Part_Code}`);
        }
    }
}

function resetForm() {
    if (confirm('Are you sure you want to reset the form? All uploaded data will be lost.')) {
        // Reset file inputs
        document.getElementById('csvFile').value = '';
        document.getElementById('imagesFolder').value = '';
        document.getElementById('moFiles').value = '';
        
        // Reset data
        csvData = null;
        imagesData = [];
        filesData = [];
        uploadProgress = { csv: false, images: false, files: false };
        
        // Hide previews
        document.getElementById('csvPreview').style.display = 'none';
        document.getElementById('imagesPreview').style.display = 'none';
        document.getElementById('filesPreview').style.display = 'none';
        
        // Update progress
        updateProgress();
    }
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

// Add utility classes and styles
document.head.insertAdjacentHTML('beforeend', `
<style>
.flex { display: flex; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.text-lg { font-size: 1.125rem; }
.text-2xl { font-size: 1.5rem; }
.font-semibold { font-weight: 600; }
.text-muted-foreground { color: var(--color-muted-foreground); }
.text-center { text-align: center; }
.w-16 { width: 4rem; }
.h-16 { height: 4rem; }
.object-cover { object-fit: cover; }
.rounded { border-radius: 0.25rem; }
.border { border: 1px solid var(--color-border); }
.mx-auto { margin-left: auto; margin-right: auto; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1rem; }
.mt-8 { margin-top: 2rem; }
.p-3 { padding: 0.75rem; }
.space-y-1 > * + * { margin-top: 0.25rem; }
.list-disc { list-style-type: disc; }
.list-inside { list-style-position: inside; }
.file-upload.dragover { border-color: var(--color-primary); background: var(--color-accent); }
</style>
`); 