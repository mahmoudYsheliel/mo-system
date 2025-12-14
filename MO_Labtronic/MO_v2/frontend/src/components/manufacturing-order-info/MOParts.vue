<script setup lang="ts">
import { compile, computed, ref, watch } from "vue";
import PartViewer from "./PartViewer.vue";
import { useApiHandler } from "@/services/apiService";
import PartsFilter from "./PartsFilter.vue";
import type { ProcessStatus } from "@/types/process";
import { Button } from "primevue";
import {
  getPartProcessDBShema,
  getPartProcessObject,
} from "@/lib/partsStatusMapper";
import { useConfirm } from "primevue/useconfirm";
import { postEvent } from "@/utils/mediator";

const props = defineProps(["MOId"]);

const selectedColor = ref<string>();
const selectedMaterial = ref<string>();
const selectedProcess = ref<string>();
const partsInitialStatuses = ref<Record<string, string>>({});

const showSaveRevertBtn = computed(() => {
  for (const part of parts.value) {
    if (JSON.stringify(part.processes) != partsInitialStatuses.value[part.id])
      return true;
  }
  return false;
});

const {
  response: partsRes,
  isLoading: partsLoading,
  apiHandle: partsApi,
} = useApiHandler();

const parts = ref<any[]>([]);
watch(props, () => {
  if (props.MOId) {
   callPartsApi()
  }
});
function callPartsApi(){
 partsApi(
      "/api/collections/Parts_T/records",
      "GET",
      true,
      `?filter=(MO_Name='${props.MOId}')`
    );
}
watch(partsRes, () => {
  if (partsRes.value?.success && partsRes.value.data) {
    parts.value = partsRes.value.data.items as any[];
    for (const part of parts.value) {
      part.P_Color = part.P_Color || "No Color";
      const _process = getPartProcessObject(part);
      part.processes = _process;
      partsInitialStatuses.value[part.id] = JSON.stringify(_process);
    }
  }
});

function markFilterDone() {
  for (const part of parts.value) {
    const mat = selectedMaterial.value?.split("-")[0];
    const thick = selectedMaterial.value?.split("-")[1];
    if (
      (part.P_Color == selectedColor.value ||
        (part.P_Material == mat && part.P_Thickness == thick)) &&
      part.processes
    ) {
      for (const key of Object.keys(part.processes)) {
        part.processes[key] = "Done" as ProcessStatus;
      }
    }
  }
}

function changeProcessStatus(newStatus: ProcessStatus) {
  for (const part of parts.value) {
    for (const key of Object.keys(part.processes)) {
      if (key == selectedProcess.value) {
        part.processes[key] = newStatus;
      }
    }
  }
}

function revert() {
  for (const part of parts.value) {
    part.processes = JSON.parse(partsInitialStatuses.value[part.id] || "");
  }
}
function markDone() {
  for (const part of parts.value) {
    for (const key of Object.keys(part.processes)) {
      part.processes[key] = "Done" as ProcessStatus;
    }
  }
}
async function save() {
  const promises = [];
  for (const part of parts.value) {
    const processDBMaped = getPartProcessDBShema(part, part.processes);
    const { apiHandle } = useApiHandler();

    promises.push(
      apiHandle(
        `/api/collections/Parts_T/records/${part.id}`,
        "PATCH",
        true,
        undefined,
        processDBMaped
      )
    );
  }
  const results = await Promise.all(promises);

  const isAllPassed = results.every((res) => res?.success);
  if (isAllPassed) {
    postEvent("add_toast", {
      severity: "success",
      summary: "Updated",
      detail: "Processes new states were saved successfully",
      life: 3000,
    });
  }
  else{
     postEvent("add_toast", {
      severity: "error",
      summary: "Failed",
      detail: "Some Processes new states were not saved successfully",
      life: 3000,
    });
  }
  callPartsApi()
}

const confirm = useConfirm();

const confirmSave = () => {
  confirm.require({
    message: "Are you sure you want to save changes?",
    header: "Confirmation",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "Save",
    },
    accept: () => {
      save();
    },
    reject: () => {
      postEvent("add_toast", {
        severity: "info",
        summary: "Cancelled",
        detail: "Saving process was cancelled",
        life: 3000,
      });
    },
  });
};
</script>

<template>
  <div id="parts-container" v-show="parts.length">
    <h2 id="parts-title">Parts</h2>
    <div id="parts-filter">
      <PartsFilter
        @selected-color="(v) => (selectedColor = v)"
        @selected-material="(v) => (selectedMaterial = v)"
        @selected-process="(v) => (selectedProcess = v)"
        @edit-process="
          (p) => {
            changeProcessStatus(p);
          }
        "
        @mark-filter-done="markFilterDone()"
        :parts="parts"
      />
    </div>
    <div id="parts-wrapper" v-if="!partsLoading">
      <div v-for="(part, i) in parts">
        <PartViewer
          :selected-color="selectedColor"
          :selected-material="selectedMaterial"
          :selected-process="selectedProcess"
          :key="i"
          :part="part"
          @new-part-status="
            (nps) => {
              part.processes = nps;
            }
          "
        />
      </div>
    </div>
    <div id="parts-actions">
      <Button
        class="btn-revert"
        title="Revert"
        icon="pi pi-backward"
        v-if="showSaveRevertBtn"
        label="Revert"
        @click="revert()"
      />

      <Button
        class="btn-save"
        title="Save"
        icon="pi pi-save"
        v-if="showSaveRevertBtn"
        label="Save"
        @click="confirmSave()"
      />

      <Button
        class="btn-done"
        title="Mark all Done"
        icon="pi pi-check-circle"
        label="Mark all Done"
        @click="markDone()"
      />
    </div>
  </div>
</template>

<style scoped>
#parts-container {
  width: 100%;
  padding: 1rem;
  box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
  background-color: white;
  border-radius: 0.25rem;
}

#parts-title {
  opacity: 0.75;
  margin-bottom: 1rem;
  text-align: center;
}

#parts-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
#parts-actions {
  display: flex;
  gap: 1rem;
  margin: 1.5rem;
  justify-content: end;
}
.btn-revert {
  background-color: #007aff !important;
  border: none !important;
  color: white !important;
}
.btn-revert:hover {
  background-color: #0060d1 !important;
}
.btn-save {
  background-color: #10b981 !important;
  border: none !important;
  color: white !important;
}
.btn-save:hover {
  background-color: #0e9f6e !important;
}
.btn-done {
  background-color: #0fa36b !important;
  border: none !important;
  color: white !important;
}
.btn-done:hover {
  background-color: #0c8b5a !important;
}
</style>
