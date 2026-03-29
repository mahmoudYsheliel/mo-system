<script setup lang="ts">
import { computed, ref, watch } from "vue";
import PartViewer from "./PartViewer.vue";
import PartsFilter from "./PartsFilter.vue";
import { Button } from "primevue";
import { useConfirm } from "primevue/useconfirm";
import { Toast, useToast } from "primevue";
import type { ExpandedPart } from "@/services/apis/mo.service";
import { batchUpdateProcesses } from "@/services/apis/process.service";
import type { ProcessStatus } from "@/types/process";
import { getUser } from "@/services/user.service";

const props = defineProps<{ originalParts?: ExpandedPart[] }>();
const parts = ref<ExpandedPart[]>([])
const filteredParts = computed(() => {
    if(!(selectedMaterial.value || selectedColor.value || selectedProcess.value )) return parts.value
    const material = selectedMaterial.value?.split("-")[0];
    const thickness = selectedMaterial.value?.split("-")[1];
    return parts.value.filter(part => part.color == selectedColor.value ||
        (part.material == material && part.thickness == thickness) ||
        part.expand?.processes_via_partId?.some(proc => proc.name == selectedProcess.value)

    )
})

const emits = defineEmits(['updateProcesses'])


watch(props, () => {
    if (props.originalParts) parts.value =  JSON.parse(JSON.stringify(props.originalParts))
})

const selectedColor = ref<string>();
const selectedMaterial = ref<string>();
const selectedProcess = ref<string>();

const toast = useToast()
const showSaveRevertBtn = computed(() => JSON.stringify(parts.value) !== JSON.stringify(props.originalParts));

function editFilteredStatus(status: ProcessStatus) {
    filteredParts.value.forEach(part => {
        part.expand?.processes_via_partId
            ?.forEach(proc => proc.status = status)
    })
}
function markAllDone() {
    parts.value.forEach(part => {
        part.expand?.processes_via_partId
            ?.forEach(proc => proc.status = "Done")
    })
}

function revert() {
    parts.value = JSON.parse(JSON.stringify(props.originalParts)) ;
}

async function save() {
    const processes = parts.value.flatMap(part => part.expand?.processes_via_partId || [])
    const batchRes = await batchUpdateProcesses(processes)
    if (batchRes.success) {
        toast.add({
            severity: "success",
            summary: "Updated",
            detail: "Processes new states were saved successfully",
            life: 3000,
        });
        emits('updateProcesses')
    }
    else {
        toast.add({
            severity: "error",
            summary: "Failed",
            detail: "Some Processes new states were not saved successfully",
            life: 3000,
        });
    }
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
            toast.add({
                severity: "info",
                summary: "Cancelled",
                detail: "Saving process was cancelled",
                life: 3000,
            });
        },
    });
};
const isUserProduction = getUser()?.roles?.includes('Production Engineer')

</script>

<template>
    <Toast />
    <div id="parts-container" v-show="parts?.length">
        <h2 id="parts-title">Parts</h2>
        <div id="parts-filter">
            <PartsFilter @selected-color="(v) => (selectedColor = v)" @selected-material="(v) => (selectedMaterial = v)"
                @selected-process="(v) => (selectedProcess = v)" @edit-process="
                    (p) => { editFilteredStatus(p) }
                " @mark-filter-done="editFilteredStatus('Done')" :parts="parts" />
        </div>
        <div id="parts-wrapper">
            <div v-for="(part, i) in filteredParts">
                <PartViewer :key="i" :part="part" />
            </div>
        </div>
        <div id="parts-actions">
            <Button class="btn-revert" title="Revert" icon="pi pi-backward" v-if="showSaveRevertBtn" label="Revert"
                @click="revert()" />

            <Button class="btn-save" title="Save" icon="pi pi-save" v-if="showSaveRevertBtn" label="Save"
                @click="confirmSave()" />

            <Button class="btn-done" title="Mark all Done" icon="pi pi-check-circle" label="Mark all Done"
                @click="markAllDone()" v-if="isUserProduction" />
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
