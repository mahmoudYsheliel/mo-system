<script lang="ts" setup>
import { Dialog } from 'primevue';
import { ref, nextTick, watch } from 'vue';
import Button from 'primevue/button';
import { apiHandle } from '@/services/apiService';
import { postEvent } from '@/utils/mediator';
import InputText from 'primevue/inputtext';

const visible = defineModel<boolean>('visible')
const labName = ref('')
const labCode = ref('')


async function addLab() {
    if (labName.value.length < 3 || labCode.value.length < 3) {
        postEvent('add_toast', {
            severity: 'error',
            summary: 'Name Error',
            detail: 'Lab name and code must contain at least 3 characters'
        })
        return
    }
    const res = await apiHandle('/api/collections/Lab_T/records', 'POST', true, '', { Lab_Name: labName.value ,Lab_Code: labCode.value })
    if (res.success) {
        postEvent('add_toast', {
            severity: 'success',
            summary: 'Lab Added',
            detail: 'New lab was added successfully'
        })
        visible.value = false
    }
    else {
        postEvent('add_toast', {
            severity: 'error',
            summary: 'Error',
            detail: 'There was error during lab creation'
        })
    }
}
</script>


<template>
    <Dialog v-model:visible="visible" modal header="Add New Lab">
        <div class="add-lab-container">
            <InputText v-model="labName" placeholder="LAb Name" />
            <InputText v-model="labCode" placeholder="LAb Code" />
            <Button @click="addLab" label="Add" icon="pi pi-plus" style="width: 6rem;align-self: flex-end;" />
        </div>
    </Dialog>
</template>


<style scoped>
.add-lab-container {
    width: 20rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
</style>