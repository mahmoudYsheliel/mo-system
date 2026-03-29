<script lang="ts" setup>
import { Dialog } from 'primevue';
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload';
import { ref, nextTick } from 'vue';
import Button from 'primevue/button';
import { dbToJson, readDbFile } from '@/services/sql.service';
import { useRouter } from 'vue-router';
import { Toast, useToast } from 'primevue';
import { addMO, getMO, setMoProdEng } from '@/services/apis/mo.service';
import type { MOModel } from '@/models/mo.model';
import { getProject } from '@/services/apis/project.service';
import type { DBPartModel, PartModel } from '@/models/part.model';
import { addPart } from '@/services/apis/part.service';
import type { ProcessModel } from '@/models/process.model';
import { batchPostProcesses } from '@/services/apis/process.service';
import { createNotification } from '@/services/apis/mo-notification.service';

const visible = defineModel<boolean>('visible')

const jsonData = ref<Record<string, Record<string, any>[]> | undefined>(undefined)
const fileName = ref('')
const toast = useToast()
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

        const moRecord = data['mos']
        const partRecords = data['parts']

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
        const moRecord = data['mos'] as MOModel[]
        const partRecords = data['parts'] as DBPartModel[]
        if (!moRecord[0] || !partRecords[0]) {
            fireToast('error', 'Database Incorrect', 'mos or parts no found')
            return
        }

        const moData = moRecord[0]
        const moRes = await addMO(moData)
        const moId = moRes.data?.id
        if (!moId) {
            fireToast('error', 'MO Creation Failed', 'Could not save the ne MO')
            return
        }
        if (moData.projectId) {
            // add production engineer to the mo
            const projectEndId = (await getProject(moData.projectId)).data?.productionEngineersId?.[0]
            if (projectEndId) await setMoProdEng(moId, projectEndId)
        }


        // add parts to the mo
        partRecords.forEach(async (part) => {
            part['moId'] = moId
            const uint8 = new Uint8Array(part['pic'])
            const file = new File(
                [uint8],
                'image.png',
                { type: 'image/png' }
            )
            part['pic'] = file
            const formData = new FormData()
            Object.entries(part).forEach(([k, v]) => { if(k !== 'processes') formData.append(k, v) })
            const partRes = await addPart(formData)
            if (partRes.data?.id && part.processes) {
                const processes = part.processes.split(',').map<ProcessModel>((proc, i) => ({ order: i, status: 'Not Started', partId: partRes.data?.id, name: proc }))
                const procRes = await batchPostProcesses(processes)
            }
        })
        fireToast('success', 'MO Creation Succeeded', `Mo created successfully with id: ${moId}`)
        visible.value = false

        const expandedMoRes = await getMO(moId)
        if(expandedMoRes.data) await createNotification({mo:expandedMoRes.data,notificationType:'mo_created'})
        router.push(`/manufacturing-order-info/${moId}`)
    }
    catch (err) {
        fireToast('error', 'Failed', `Failed with err: ${err}`)
    }
};

async function clearUpload() {
    await nextTick()
    fileUploadRef.value?.clear()
    fileName.value = ''
    jsonData.value = undefined
}



function fireToast(severity: string, summary: string, detail: string) {
    toast.add({ severity, summary, detail })
}

</script>


<template>
    <Toast />
    <Dialog v-model:visible="visible" modal header="Add New MO">
        <FileUpload ref="fileUploadRef" @select="onFileSelect">
            <template #header="{ chooseCallback, files }">
                <div class="upload-action-buttons">
                    <Button v-if="!fileName" @click="chooseCallback()" icon="pi pi-plus" label="Browse"
                        severity="secondary" />
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
