// Fixed role checking function
function checkUserRole(user, requiredRole) {
    if (!user) return false;
    const userRole = Array.isArray(user.Role) ? user.Role[0] : user.Role;
    return userRole === requiredRole;
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
