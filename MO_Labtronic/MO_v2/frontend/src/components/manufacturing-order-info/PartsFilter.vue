<script lang="ts" setup>
import Select from "primevue/select";
import { computed, ref, watch } from "vue";
import Button from "primevue/button";
import StatusMenu from "./StatusMenu.vue";
import type { ProcessStatus } from "@/types/process";
import type { ExpandedPart } from "@/services/apis/mo.service";

const props = defineProps<{ parts: ExpandedPart[] }>();

const selectedColor = ref<string>('');
const selectedMaterial = ref<string>('');
const selectedProcess = ref<string>('');

const showFilterActions = ref(false);
const showMarkDone = ref(false);
const showProcessStatus = ref(false);

const emits = defineEmits<{
    (e: 'selectedColor', value: string): void;
    (e: 'selectedMaterial', value: string): void;
    (e: 'selectedProcess', value: string): void;
    (e: 'markFilterDone'): void;
    (e: 'editProcess', status: ProcessStatus): void;
}>();

function updateFilter(
    val: any,
    filterType: "color" | "material" | "process" | "none"
) {
    selectedColor.value = filterType == "color" ? val : null;
    selectedMaterial.value = filterType == "material" ? val : null;
    selectedProcess.value = filterType == "process" ? val : null;
    showFilterActions.value = filterType != "none";
    showMarkDone.value = filterType == "color" || filterType == "material";
    showProcessStatus.value = filterType == "process";
    emits('selectedColor', selectedColor.value);
    emits("selectedMaterial", selectedMaterial.value);
    emits("selectedProcess", selectedProcess.value);
}

const materials = computed(() => {
    const _materials = props.parts.map((pp) => pp.material + "-" + pp.thickness);
    return [...new Set(_materials)];
});

const colors = computed(() => {
    const _colors = props.parts.map((pp) => pp.color);
    return [...new Set(_colors)];
});

const processes = computed(() => {
    const processes = props.parts
        .flatMap((pp) => pp.expand?.processes_via_partId)
        .map(p => p?.name)
        .filter(Boolean)

    return [...new Set(processes)];
});
</script>

<template>
    <div class="filter-multiselect-container">
        <Select class="filter-select" @change="(v) => updateFilter(v.value, 'color')" v-model="selectedColor"
            placeholder="Color" :options="colors" />
        <Select class="filter-select" @change="(v) => updateFilter(v.value, 'material')" v-model="selectedMaterial"
            placeholder="Material" :options="materials" />
        <Select class="filter-select" @change="(v) => updateFilter(v.value, 'process')" v-model="selectedProcess"
            placeholder="Process" :options="processes" />
        <div style="flex-grow: 1"></div>

        <Button class="mark-done" label="Mark as Done" @click="emits('markFilterDone')"
            v-if="showFilterActions && showMarkDone" icon="pi pi-check-circle" />

        <StatusMenu v-if="showFilterActions && showProcessStatus" status-prop="Not Started"
            @new-status="(s: ProcessStatus) => emits('editProcess', s)" />
        <Button class="clear-filter" label="Clear" v-if="showFilterActions" @click="updateFilter('', 'none')"
            icon="pi pi-filter-slash" />
    </div>
</template>

<style scoped>
.filter-multiselect-container {
    position: relative;
    display: flex;
    justify-content: stretch;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.filter-select {
    width: 12rem;
}

.filter-key-manual-select {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    gap: 2rem;
}

.mark-done {
    background-color: #2ecc71;
    border: none;
}

.mark-done:hover {
    background-color: #27ae60 !important;
    border: none !important;
}

.clear-filter {
    background-color: #a0aec0;
    border: none;
}

.clear-filter:hover {
    background-color: #718096 !important;
    border: none !important;
}
</style>
