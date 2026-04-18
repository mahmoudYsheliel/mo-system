<script lang="ts" setup>
import { Dialog } from 'primevue';
import { ref } from 'vue';
import Button from 'primevue/button';
import { Toast, useToast } from 'primevue';
import { addProjectFiles } from '@/services/apis/project.service';

const visible = defineModel<boolean>('visible')
const props = defineProps<{ projectId: string }>()
const toast = useToast()

// --- File Handling Refs ---
const assemblyPics = ref<File[]>([])
const assemblyFiles = ref<File[]>([])
const projectFiles = ref<File[]>([])

// DOM References for hidden inputs
const fileInputAssemblyPics = ref<HTMLInputElement | null>(null)
const fileInputAssemblyFiles = ref<HTMLInputElement | null>(null)
const fileInputProjectFiles = ref<HTMLInputElement | null>(null)

// --- File Helper Functions ---

// Trigger the hidden html input
const triggerFileSelect = (inputRef: HTMLInputElement | null) => {
    inputRef?.click()
}

// Handle the file selection change event
const onFileSelect = (event: Event, targetArray: any[]) => {
    const input = event.target as HTMLInputElement;
    if (input.files) {
        for (const file of input.files) {
            // Optional: Check for duplicates before adding
            targetArray.push(file);
        }
    }
    // Reset input value so the same file can be selected again if needed
    input.value = '';
}

// Remove file from list
const removeFile = (targetArray: any[], index: number) => {
    targetArray.splice(index, 1);
}

// --- Submission Logic ---

async function addProject() {

    const formData = new FormData();

    assemblyPics.value.forEach(file => formData.append('assemblyPics+', file));
    assemblyFiles.value.forEach(file => formData.append('assemblyFiles+', file));
    projectFiles.value.forEach(file => formData.append('projectFiles+', file));

    const res = await addProjectFiles(props.projectId, formData)
    if (res.success) {
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Project and files added successfully'
        })
        visible.value = false
        window.location.reload()
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'There was an error during project creation'
        })
    }
}

</script>

<template>
    <Toast />
    <Dialog v-model:visible="visible" modal header="Add New Project Files">

        <div class="add-project-container">
            <div>
                <input type="file" ref="fileInputAssemblyPics" class="hidden" multiple accept="image/*" @change="(e) => onFileSelect(e, assemblyPics)" />
                <Button label="Add Assembly Pic" icon="pi pi-images" severity="secondary" outlined class="w-full" @click="triggerFileSelect(fileInputAssemblyPics)" />

                <div v-if="assemblyPics.length > 0" class="file-list">
                    <div v-for="(file, index) in assemblyPics" :key="index" class="file-chip">
                        <span class="file-name">{{ file.name }}</span>
                        <i class="pi pi-times remove-icon" @click="removeFile(assemblyPics, index)"></i>
                    </div>
                </div>
            </div>

            <div>
                <input type="file" ref="fileInputAssemblyFiles" class="hidden" multiple @change="(e) => onFileSelect(e, assemblyFiles)" />
                <Button label="Add Assembly File" icon="pi pi-file" severity="secondary" outlined class="w-full" @click="triggerFileSelect(fileInputAssemblyFiles)" />

                <div v-if="assemblyFiles.length > 0" class="file-list">
                    <div v-for="(file, index) in assemblyFiles" :key="index" class="file-chip">
                        <span class="file-name">{{ file.name }}</span>
                        <i class="pi pi-times remove-icon" @click="removeFile(assemblyFiles, index)"></i>
                    </div>
                </div>
            </div>

            <div>
                <input type="file" ref="fileInputProjectFiles" class="hidden" multiple @change="(e) => onFileSelect(e, projectFiles)" />
                <Button label="Add Project File" icon="pi pi-folder" severity="secondary" outlined class="w-full" @click="triggerFileSelect(fileInputProjectFiles)" />

                <div v-if="projectFiles.length > 0" class="file-list">
                    <div v-for="(file, index) in projectFiles" :key="index" class="file-chip">
                        <span class="file-name">{{ file.name }}</span>
                        <i class="pi pi-times remove-icon" @click="removeFile(projectFiles, index)"></i>
                    </div>
                </div>
            </div>

            <Button @click="addProject" label="Add" icon="pi pi-plus" style="width: 6rem; align-self: flex-end; margin-top: 1rem;" />
        </div>
    </Dialog>
</template>

<style scoped>
.add-project-container {
    width: 32rem;
    display: grid;
    flex-direction: column;
    gap: 1rem;
}

.hidden {
    display: none;
}


/* Individual file item (Chip style) */
.file-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    color: #374151;
}

.file-name {
    max-width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.remove-icon {
    font-size: 0.75rem;
    color: #ef4444;
    /* Red color */
    cursor: pointer;
}

.remove-icon:hover {
    color: #b91c1c;
    font-weight: bold;
}
</style>