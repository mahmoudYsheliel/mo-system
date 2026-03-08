<script setup lang="ts">
import Checkbox from "primevue/checkbox";
import "primeicons/primeicons.css";
import FileIcon from "@/icons/FileIcon.vue";
import { ref, watch } from "vue";
import { getDate, isSharableFile } from "@/lib/helper-functions"
import { downloadFile } from "@/services/download.service";
import { shareFile, sendFileLink } from "@/services/share.service";
import { type ExpandedFile } from "@/services/apis/mo.service";
import { getUser } from "@/services/user.service";
import { updateMOFile } from "@/services/apis/mo-files.service";

const props = defineProps<{
    file?: ExpandedFile,
}>();

const isSent = ref(!!props.file?.senderId);

watch(props, () => {
    isSent.value = !!props.file?.senderId;
});
watch(isSent, () => {
    const userId = isSent.value ? getUser()?.id : ''
    if(props?.file?.id) updateMOFile(props.file.id, { senderId: userId })
});


async function handleShare(
    tableName: string | undefined,
    recordId: string | undefined,
    fileName: string | undefined
) {
    const isFileSharable = isSharableFile(fileName);
    if (isFileSharable) {
        shareFile(tableName, recordId, fileName);
    } else {
        sendFileLink(tableName, recordId, fileName);
    }
}

function getFileExtenssion(name?:string){
    const nameParts = name?.split('.')
    return nameParts ? nameParts[nameParts?.length -1] : ''
}
</script>

<template>
    <div class="file-viewer-container">
        <div class="file-viewer-header">
            <div class="file-viewer-file-type">
                <FileIcon style="width: 1rem" />
                <p class="file-type">{{ getFileExtenssion(file?.file)}}</p>
            </div>
            <div class="file-actions">
                <i style="color: #1e88e5" class="pi pi-download"
                    @click="downloadFile('mo_files', file?.id, file?.file)"></i>
                <i class="pi pi-arrow-up-right" style="color: #26c6da; display: block"
                    @click="handleShare('mo_files', file?.id, file?.file)"></i>
            </div>
        </div>
        <div class="file-name-checkbox">
            <p class="file-name">
                {{ (file?.file?.split(".")[0] as string).substring(0, 15) }}
            </p>
            <Checkbox @change="
                () => {
                    $emit('fileSent', isSent);
                }
            " v-model="isSent" binary />
        </div>
        <div class="file-sender-data">
            <p v-if="isSent" class="file-sender">
                {{ file?.expand?.senderId?.userName }}
            </p>
            <p v-if="isSent" class="file-sent-date">
                {{ getDate(new Date(file?.updated || "")) }}
            </p>
        </div>
    </div>
</template>

<style scoped>
.file-viewer-container {
    border-radius: 0.5rem;
    border-top-left-radius: 0;
    position: relative;
    width: 18rem;
    height: 9rem;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding: 1rem;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    box-shadow: 0 0.125rem 0.25rem 0 rgba(0, 0, 0, 0.25);
    border-radius: 1rem 2rem 1rem 2rem;
}

.file-viewer-header {
    display: flex;
    justify-content: space-between;
}

.file-viewer-file-type {
    display: flex;
    gap: 0.5rem;
    fill: #2c2c2c;
    color: #2c2c2c;
}

.file-actions {
    display: flex;
    gap: 1rem;
}

.file-name {
    font-size: 1.125rem;
}


.file-sender-data,
.file-name-checkbox {
    display: flex;
    justify-content: space-between;
    opacity: 0.75;
    font-size: 0.75rem;
    align-items: center;
    height: 0.75rem;
}

i {
    cursor: pointer;
}
</style>
