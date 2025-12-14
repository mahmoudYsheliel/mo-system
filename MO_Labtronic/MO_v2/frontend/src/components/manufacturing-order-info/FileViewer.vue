<script setup lang="ts">
import Checkbox from "primevue/checkbox";
import "primeicons/primeicons.css";
import FileIcon from "@/icons/FileIcon.vue";
import { ref, watch, type PropType } from "vue";
import { getDate, isSharableFile } from "@/lib/helperFunctions"
import type { MOFileStructure } from "@/types/moFile";
import { downloadFile } from "@/services/downloadServices";
import { shareFile,sendFileLink } from "@/services/shareServices";

const props = defineProps({
  file: { type: Object as PropType<MOFileStructure> },
  users: { type: Array as PropType<any[]> },
  MOId: { type: String },
});
const emits = defineEmits(["fileSent"]);
const isSent = ref(props.file?.isSent);

watch(props, () => {
  isSent.value = props.file?.isSent;
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
</script>

<template>
  <div class="file-viewer-container">
    <div class="file-viewer-header">
      <div class="file-viewer-file-type">
        <FileIcon style="width: 1rem" />
        <p class="file-type">{{ file?.fileName.split(".")[1] }}</p>
      </div>
      <div class="file-actions">
        <i
          style="color: #1e88e5"
          class="pi pi-download"
          @click="downloadFile('MO_T', MOId, file?.fileName)"
        ></i>
        <i
          class="pi pi-arrow-up-right"
          style="color: #26c6da; display: block"
          @click="handleShare('MO_T', MOId, file?.fileName)"
        ></i>
      </div>
    </div>
    <div class="file-name-checkbox">
      <p class="file-name">
        {{ (file?.fileName.split(".")[0] as string).substring(0, 15) }}
      </p>
      <Checkbox
        @change="
          () => {
            $emit('fileSent', isSent);
          }
        "
        v-model="isSent"
        binary
      />
    </div>
    <div class="file-sender-data">
      <p v-if="isSent" class="file-sender">
        {{
          users?.find((u) => {
            return u?.id == file?.senderName;
          })?.Full_Name
        }}
      </p>
      <p v-if="isSent" class="file-sent-date">
        {{ getDate(new Date(file?.sentDate || "")) }}
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
