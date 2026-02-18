<!-- <script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import PartViewer from "./PartViewer.vue";
import { useApiHandler } from "@/services/apiService";
import PartsFilter from "./PartsFilter.vue";
import { UndoRedo } from "@/utils/UndoRedo";
import type { ProcessStatus } from "@/types/process";
import { Button } from "primevue";
import { getPartProcessObject } from "@/lib/partsStatusMapper";

const props = defineProps(["MOId"]);

const selectedColor = ref<string>();
const selectedMaterial = ref<string>();
const selectedProcess = ref<string>();

// const undoRedoObject = reactive(new UndoRedo<Record<string, object>>());
// const currentStatus: Record<string, object> = {};

const { response, isLoading, apiHandle } = useApiHandler();
const parts = ref<any[]>([]);
watch(props, () => {
  if (props.MOId) {
    apiHandle(
      "/api/collections/Parts_T/records",
      "GET",
      true,
      `?filter=(MO_Name='${props.MOId}')`
    );
  }
});
watch(response, () => {
  if (response.value?.success && response.value.data) {
    parts.value = response.value.data.items as any[];
    const state: Record<string, object> = {};
    for (const part of parts.value) {
      part.P_Color = part.P_Color || "No Color";
      const _process = getPartProcessObject(part);
      part.processes = _process;
      state[part.id] = _process;
      // currentStatus[part.id] = _process;
    }
    // undoRedoObject.intiate(state);
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
        // (currentStatus[part.id] as any)[key] = "Done";
      }
      // undoRedoObject.record(currentStatus);
    }
  }
}

function changeProcessStatus(newStatus: ProcessStatus) {
  for (const part of parts.value) {
    for (const key of Object.keys(part.processes)) {
      if (key == selectedProcess.value) {
        part.processes[key] = newStatus;
        // (currentStatus[part.id] as any)[key] = newStatus;
      }
    }
  }
  // undoRedoObject.record(currentStatus);
}

// function recordAction(action: Record<string, ProcessStatus>, part: any) {
//   currentStatus[part.id] = action;
//   undoRedoObject.record(currentStatus);
// }
// function redo() {
//   const status = undoRedoObject.redo();

//   for (const k in status) {
//     parts.value.find((part) => part.id == k).processes = status[k];
//     currentStatus[k] = JSON.parse(JSON.stringify(status[k]));
//   }
//   parts.value = [...parts.value];
// }
// function undo() {
//   const status = undoRedoObject.undo();
//   for (const k in status) {
//     parts.value.find((part) => part.id == k).processes = status[k];
//     currentStatus[k] = JSON.parse(JSON.stringify(status[k]));
//   }
//   parts.value = [...parts.value];
// }
</script>

<template>
  <div id="parts-container">
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
    <div id="parts-wrapper" v-if="!isLoading">
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
        style="background-color: #007aff;border: none;"
        title="Cancel"
        icon="pi pi-backward"
      />
      <Button
        style="background-color: #10b981;border: none;"
        title="Save"
        icon="pi pi-save"
      />

      <i
        @click="redo()"
        style="background-color: #3b82f6"
        title="Redo"
        class="pi pi-refresh"
        v-if="undoRedoObject.canRedo()"
      ></i>
      <i
        @click="undo()"
        style="background-color: #6b7280"
        title="Undo"
        class="pi pi-undo"
        v-if="undoRedoObject.canUndo()"
      ></i>
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
i {
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0.5rem;
  color: white;
  border-radius: 0.5rem;
}
</style> -->
