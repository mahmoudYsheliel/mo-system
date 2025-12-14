<script setup lang="ts">
import FileViewer from "./FileViewer.vue";
import { useAuth } from "@/stores/auth";
import { useApiHandler } from "@/services/apiService";
import { useRoute } from "vue-router";
import {type MOFileStructure } from "@/types/moFile";
import { Button } from "primevue";
import { ref, watch } from "vue";
import { downloadAllFiles } from "@/services/downloadServices";
import { shareAllLinks } from "@/services/shareServices";

const props = defineProps(["files", "users", "MOId",'projectName','MOName']);
const auth = useAuth();
const route = useRoute();
const filesRef = ref<MOFileStructure[]>([]);

watch(props, () => {
  
  filesRef.value = props.files as MOFileStructure[];
});

function updateFileStatus(index: number, isSent: boolean) {
  if (!filesRef.value[index]) return;
  filesRef.value[index].isSent = isSent;
  filesRef.value[index].sentDate = isSent ? new Date().toString() : "null";
  filesRef.value[index].senderName = isSent ? auth.user.id : "null";
  const dataString = filesRef.value
    .map((od) => {
      return `{${od.fileName},${od.isSent},${od.senderName},${od.sentDate}}`;
    })
    .join(",");
  const { apiHandle: updateFilesApiHandler } = useApiHandler();
  updateFilesApiHandler(
    `/api/collections/MO_T/records/${route.params.id}`,
    "PATCH",
    true,
    undefined,
    { Files_Status: `[${dataString}]` }
  );
}

const buttonPT = {
  root: { style: "font-size:0.75rem" },
  icon: { style: "font-size:0.75rem" },
};
function markAllAsSent() {
  filesRef.value = filesRef.value.map((file) => ({
    ...file,
    isSent: true,
    senderName: auth.user.id,
    sentDate: new Date().toString(),
  }));
  const dataString = filesRef.value
    .map((od) => {
      return `{${od.fileName},${od.isSent},${od.senderName},${od.sentDate}}`;
    })
    .join(",");
  const { apiHandle: updateFilesApiHandler } = useApiHandler();
  updateFilesApiHandler(
    `/api/collections/MO_T/records/${route.params.id}`,
    "PATCH",
    true,
    undefined,
    { Files_Status: `[${dataString}]` }
  );
}
function downloadAll() {
  downloadAllFiles(
    "MO_T",
    props.MOId,
    filesRef.value.map((f) => {
      return f.fileName;
    })
  );
}
function shareAll() {
  shareAllLinks(
    "MO_T",
    props.MOId,
    filesRef.value.map((f) => {
      return f.fileName;
    }),
    props.projectName,
    props.MOName
  );
}
</script>

<template>
  <div id="file-viewers-container">
    <h2 id="file-viewers-title">Files</h2>
    <div id="files-wrapper">
      <div v-for="(file, i) in filesRef" :key="i">
        <FileViewer
          :users="users"
          :file="file"
          :MOId="MOId"
          @fileSent="
            (isSent) => {
              updateFileStatus(i, isSent);
            }
          "
        />
      </div>
    </div>
    <div id="files-actions-wrapper">
      <Button
        :pt="buttonPT"
        @click="markAllAsSent()"
        severity="success"
        icon="pi pi-check-circle"
        label="Mark All as Sent"
      />
      <Button
        :pt="buttonPT"
        @click="downloadAll()"
        severity="info"
        style="margin-left: 2rem"
        icon="pi pi-download"
        label="Download All"
      />
      <Button
        :pt="buttonPT"
        @click="shareAll()"
        severity="help"
        style="margin-left: 1rem"
        icon="pi pi-share-alt"
        label="Share All"
      />
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
