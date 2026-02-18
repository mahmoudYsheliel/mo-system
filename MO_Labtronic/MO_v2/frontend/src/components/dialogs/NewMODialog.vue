<script lang="ts" setup>
import { Dialog } from 'primevue';
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload';
import { ref,nextTick,watch } from 'vue';
import Button from 'primevue/button';
import { dbToJson, readDbFile } from '@/services/sqlService';
import { apiHandle } from '@/services/apiService';
import { postEvent } from '@/utils/mediator';
import { type Severity } from '@/types/toast';
import { useRouter } from 'vue-router';



const visible = defineModel<boolean>('visible')

const jsonData = ref<Record<string, Record<string, any>[]> | undefined>(undefined)
const fileName = ref('')

const fileUploadRef = ref()
const router = useRouter()
async function onFileSelect(event: FileUploadSelectEvent) {
    try {
        const file = event.files[0]
        if (!file) {
            await clearUpload()
            fireToast('error', 'No File Selected', 'There was error during uploading')
            return
        }

        const [tables, db] = await readDbFile(file)
        if (!tables || !tables.values) {
            await clearUpload()
            fireToast('error', 'No DataBase', 'File uploaded has no database')
            return
        }
        const data = dbToJson(tables as string[], db)

        const moRecord = data['MO_Info']
        const partRecords = data['Parts_List']

        if (!moRecord || !partRecords) {
            await clearUpload()
            fireToast('error', 'Database Incorrect', 'MO_Info or Parts_List no found')
            return
        }
        jsonData.value = data
        fileName.value = file.name

    }
    catch (err) {
        await clearUpload()
        fireToast('error', 'Failed', `Failed with err: ${err}`)
    }
}


async function uploadEvent() {
    try {
        if (!jsonData.value) {
            return
        }
        const data = jsonData.value
        const moRecord = data['MO_Info']
        const partRecords = data['Parts_List']
        if (!moRecord || !partRecords) {
            fireToast('error', 'Database Incorrect', 'MO_Info or Parts_List no found')
            return
        }

        const moDta = moRecord[0]
        const res = await apiHandle('/api/collections/MO_T/records', 'POST', true, '', moDta)
        const moId = res?.data.id
        if (!moId) {
            fireToast('error', 'MO Creation Failed', 'Could not save the ne MO')
            return
        }

        // add production engineer to the mo
        const projectEngRes = await apiHandle(`/api/collections/Project_T/records/${moDta?.Project}`,'GET',true, `?fields=Production_Engineer,`)

        if(projectEngRes.success)
            await apiHandle('/api/collections/MO_T/records', 'PATCH', true, '', {Production_Engineer:[projectEngRes.data[0]]})
        
        
        // add parts to the mo
        partRecords.forEach(async (part) => {
            part['MO_Name'] = moId
            const uint8 = new Uint8Array(part['P_Pic'])
            const file = new File(
                [uint8],
                'image.png',
                { type: 'image/png' }
            )
            part['P_Pic'] = file
            const formData = new FormData()
            Object.entries(part).forEach(([k, v]) => { formData.append(k, v) })
            await apiHandle('/api/collections/Parts_T/records', 'POST', true, '', formData, 'data', 'form_data')
        })
        
        fireToast('success', 'MO Creation Succeeded', `Mo created successfully with id: ${moId}`)
        visible.value = false
        router.push(`/manufacturing-order-info/${moId}`)
    }
    catch (err) {
        fireToast('error', 'Failed', `Failed with err: ${err}`)
    }
};

async function clearUpload(){
    await nextTick() 
    fileUploadRef.value?.clear()
    fileName.value = ''
    jsonData.value = undefined
}



function fireToast(severity: Severity, summary: string, detail: string) {
    postEvent('add_toast', { severity, summary, detail })
}

</script>


<template>
    <Dialog v-model:visible="visible" modal header="Add New MO" >

        <FileUpload  ref="fileUploadRef" @select="onFileSelect">
            <template #header="{ chooseCallback, files }">
                <div class="upload-action-buttons">
                    <Button v-if="!fileName" @click="chooseCallback()" icon="pi pi-plus" label="Browse" severity="secondary" />
                    <Button v-else @click="uploadEvent()" icon="pi pi-upload" label="Upload" severity="success" />
                </div>
            </template>

            <template #content>
                <div class="upload-container">
                    <div v-if="fileName" class="file-name">
                        <p style="color: #2c2c2c;font-size: 1.25rem;">{{ fileName }}</p>
                        <Button icon="pi pi-times" @click="clearUpload()" outlined text severity="danger" />
                    </div>
                </div>
            </template>
            <template #empty>
                <div class="upload-container ">
                    <i class="pi pi-cloud-upload upload-icon " />
                    <p class="empty-text">Drag and drop files to here to upload.</p>
                </div>
            </template>
        </FileUpload>

    </Dialog>
</template>


<style scoped>
.upload-container {
    width: 24rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #9CA3AF;
}

.upload-action-buttons {
    width: 100%;
    display: flex;
    justify-content: end;
}

.upload-icon {
    font-size: 8rem;
    font-weight: 100;
    margin-bottom: 1rem;
}

.file-name {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.empty-text {
    font-size: 1.25rem;
    font-weight: 600;

}
</style>
