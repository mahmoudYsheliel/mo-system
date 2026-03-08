<script lang="ts" setup>
import { Dialog } from 'primevue';
import { ref } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import type { LabModel } from '@/models/lab.model';
import { Toast, useToast } from 'primevue';
import { createLab } from '@/services/apis/lab.service';

const visible = defineModel<boolean>('visible')
const lab = ref<LabModel>({ name: '', code: '' })
const toast = useToast()

async function addLab() {
    if (!lab.value.name || lab.value.name.length < 3 || !lab.value.code || lab.value.code.length < 3) {
        toast.add({
            severity: 'error',
            summary: 'Name Error',
            detail: 'Lab name and code must contain at least 3 characters',
            life: 3000
        })
        return
    }
    const res = await createLab(lab.value)
    if (res.success) {
        toast.add({
            severity: 'success',
            summary: 'Lab Added',
            detail: 'New lab was added successfully',
            life: 3000
        })
        visible.value = false
    }
    else {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'There was error during lab creation',
            life: 3000
        })
    }
}
</script>


<template>
    <Toast />
    <Dialog v-model:visible="visible" modal header="Add New Lab">
        <div class="add-lab-container">
            <InputText v-model="lab.name" placeholder="Lab Name" />
            <InputText v-model="lab.code" placeholder="Lab Code" />
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