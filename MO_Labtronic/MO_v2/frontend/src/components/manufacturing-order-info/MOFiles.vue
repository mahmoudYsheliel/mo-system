<script setup lang="ts">
import FileViewer from "./FileViewer.vue";
import { useRoute } from "vue-router";
import { Button } from "primevue";
import { downloadFile } from "@/services/download.service";
import { shareAllLinks } from "@/services/share.service";
import { getUser } from "@/services/user.service";
import type { ExpandedFile } from "@/services/apis/mo.service";
import { updateMOFile } from "@/services/apis/mo-files.service";

const props = defineProps<{
    files?: ExpandedFile[],
    projectName?: string,
    MOName?: string,
    MOId?: string
}>();
const buttonPT = {
    root: { style: "font-size:0.75rem" },
    icon: { style: "font-size:0.75rem" },
};

function markAllAsSent() {
    const userId = getUser()?.id
    props.files?.forEach((file) => {
        if (file.id)
            updateMOFile(file.id, { senderId: userId })
    })
}
function downloadAll() {
    props?.files?.forEach((f, i) => {
        setTimeout(() => {
            const res = downloadFile('mo_files', f.id, f.file);
        }, 1000 * i);
    })
}
function shareAll() {
    shareAllLinks(
        "mo_files",
        props.files,
        props.projectName || '',
        props.MOName || ''
    );
}
</script>

<template>
    <div id="file-viewers-container">
        <h2 id="file-viewers-title">Files</h2>
        <div id="files-wrapper">
            <div v-for="file, i in files" :key="i">
                <FileViewer :file="file" :MOId="MOId" />
            </div>
        </div>
        <div id="files-actions-wrapper">
            <Button :pt="buttonPT" @click="markAllAsSent()" severity="success" icon="pi pi-check-circle"
                label="Mark All as Sent" />
            <Button :pt="buttonPT" @click="downloadAll()" severity="info" style="margin-left: 2rem"
                icon="pi pi-download" label="Download All" />
            <Button :pt="buttonPT" @click="shareAll()" severity="help" style="margin-left: 1rem" icon="pi pi-share-alt"
                label="Share All" />
        </div>
    </div>
</template>

<style scoped>
#file-viewers-container {
    width: 100%;
    padding: 2rem;
    box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    background-color: white;
    border-radius: 0.25rem;
    gap: 1rem;
}

#file-viewers-title {
    opacity: 0.75;
    margin-bottom: 1rem;
    text-align: center;
}

#files-wrapper {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 2rem;
}

#files-actions-wrapper {
    display: flex;
    justify-content: end;
    margin-top: 2rem;
}
</style>
