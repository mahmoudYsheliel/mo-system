<script lang="ts" setup>
import { Dialog } from 'primevue';
import { ref, onMounted, watch } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select, { type SelectChangeEvent } from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import { getUsers } from '@/services/apis/account.service';
import type { Priority } from '@/types/mo-order';
import { Toast, useToast } from 'primevue';
import { getUniversities } from '@/services/apis/university.service';
import type { UniversityModel } from '@/models/university.model';
import type { LabModel } from '@/models/lab.model';
import { getLabs } from '@/services/apis/lab.service';
import type { AccountModel } from '@/models/account.model';
import { createProject } from '@/services/apis/project.service';
import { useRouter } from 'vue-router';
import { syncDB } from '@/services/sql.service';

const visible = defineModel<boolean>('visible')

const router = useRouter()
const toast = useToast()
// --- Form Data Refs ---
const projectName = ref('')
const projectCode = ref('')
const projectCodeWithLabCode = ref('')
const projectManager = ref()
const projectDesigner = ref()
const projectProduction = ref()
const projectUniversity = ref<UniversityModel>({})
const projectLab = ref<LabModel>({})
const projectPriority = ref()
const projectEstDeadline = ref()

// --- Dropdown Options ---
const managers = ref<AccountModel[]>([])
const designers = ref<AccountModel[]>([])
const productions = ref<AccountModel[]>([])
const universities = ref<UniversityModel[]>([])
const labs = ref<LabModel[]>([])
const priorities: Priority[] = ['HIGH', 'MEDIUM', 'LOW']

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

    formData.append('name', projectName.value);
    formData.append('code', projectCode.value);

    if (projectManager.value?.id) formData.append('projectManagerId', projectManager.value.id);
    if (projectDesigner.value?.id) formData.append('designEngineersId', projectDesigner.value.id);
    if (projectProduction.value?.id) formData.append('productionEngineersId', projectProduction.value.id);
    if (projectUniversity.value?.id) formData.append('universityId', projectUniversity.value.id);
    if (projectLab.value?.id) formData.append('labId', projectLab.value.id);
    if (projectPriority.value) formData.append('priority', projectPriority.value);
    if (projectEstDeadline.value) formData.append('estDeadline', projectEstDeadline.value.toISOString())

    assemblyPics.value.forEach(file => formData.append('assemblyPics', file));
    assemblyFiles.value.forEach(file => formData.append('assemblyFiles', file));
    projectFiles.value.forEach(file => formData.append('projectFiles', file));

    const res = await createProject(formData)
    if (res.success) {
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Project and files added successfully'
        })
        visible.value = false
        await syncDB()
    router.push(`/project-info/${res.data?.id}`)
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'There was an error during project creation'
        })
    }
}

function getProjectCodePrefix(){
    return projectLab.value?.code ? `${projectLab.value.code} - ` : ''
 }

onMounted(() => {
    getUsers().then(res => {
        const users = res.data?.items || []
        managers.value = users?.filter(user => user?.roles?.includes('Project Manager')) || []
        designers.value = users?.filter(user => user?.roles?.includes('Design Engineer')) || []
        productions.value = users?.filter(user => user?.roles?.includes('Production Engineer')) || []
    })
    getUniversities().then(res => {
        if (res.data?.items)
            universities.value = res.data.items
    })
    getLabs().then(res => {
        if (res.data?.items)
            labs.value = res.data.items
    })
})

const updateProjectCode = (event:SelectChangeEvent) => {
    const newPrefix = event.value as LabModel;
    const oldCodeSections = projectCode.value.split('-')
    const oldCode = oldCodeSections[1] || oldCodeSections[0] 
    projectCode.value = `${newPrefix.code}-${oldCode}`;
};
</script>

<template>
    <Toast />
    <Dialog v-model:visible="visible" modal header="Add New Project">

        <div class="add-project-container">
            <InputText v-model="projectName" placeholder="Project Name" />
            <InputText v-model="projectCode" placeholder="Project Code" />

            <Select v-model="projectManager" :options="managers" optionLabel="userName" placeholder="Project Manager" />
            <Select v-model="projectDesigner" :options="designers" optionLabel="userName"
                placeholder="Design Engineer" />
            <Select v-model="projectProduction" :options="productions" optionLabel="userName"
                placeholder="Production Engineer" />

            <Select v-model="projectUniversity" :options="universities" optionLabel="name" placeholder="University" />
            <Select v-model="projectLab" :options="labs" optionLabel="name" placeholder="Lab" @change="updateProjectCode" />

            <Select v-model="projectPriority" :options="priorities" placeholder="Priority" />

            <DatePicker v-model="projectEstDeadline" placeholder="Estimated Deadline" />

            <div>
                <input type="file" ref="fileInputAssemblyPics" class="hidden" multiple accept="image/*"
                    @change="(e) => onFileSelect(e, assemblyPics)" />
                <Button label="Add Assembly Pic" icon="pi pi-images" severity="secondary" outlined class="w-full"
                    @click="triggerFileSelect(fileInputAssemblyPics)" />

                <div v-if="assemblyPics.length > 0" class="file-list">
                    <div v-for="(file, index) in assemblyPics" :key="index" class="file-chip">
                        <span class="file-name">{{ file.name }}</span>
                        <i class="pi pi-times remove-icon" @click="removeFile(assemblyPics, index)"></i>
                    </div>
                </div>
            </div>

            <div>
                <input type="file" ref="fileInputAssemblyFiles" class="hidden" multiple
                    @change="(e) => onFileSelect(e, assemblyFiles)" />
                <Button label="Add Assembly File" icon="pi pi-file" severity="secondary" outlined class="w-full"
                    @click="triggerFileSelect(fileInputAssemblyFiles)" />

                <div v-if="assemblyFiles.length > 0" class="file-list">
                    <div v-for="(file, index) in assemblyFiles" :key="index" class="file-chip">
                        <span class="file-name">{{ file.name }}</span>
                        <i class="pi pi-times remove-icon" @click="removeFile(assemblyFiles, index)"></i>
                    </div>
                </div>
            </div>

            <div>
                <input type="file" ref="fileInputProjectFiles" class="hidden" multiple
                    @change="(e) => onFileSelect(e, projectFiles)" />
                <Button label="Add Project File" icon="pi pi-folder" severity="secondary" outlined class="w-full"
                    @click="triggerFileSelect(fileInputProjectFiles)" />

                <div v-if="projectFiles.length > 0" class="file-list">
                    <div v-for="(file, index) in projectFiles" :key="index" class="file-chip">
                        <span class="file-name">{{ file.name }}</span>
                        <i class="pi pi-times remove-icon" @click="removeFile(projectFiles, index)"></i>
                    </div>
                </div>
            </div>

            <Button @click="addProject" label="Add" icon="pi pi-plus"
                style="width: 6rem; align-self: flex-end; margin-top: 1rem;" />
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

/* Container for the list of files */
.file-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: #f8f9fa;
    /* Light gray background */
    border-radius: 6px;
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