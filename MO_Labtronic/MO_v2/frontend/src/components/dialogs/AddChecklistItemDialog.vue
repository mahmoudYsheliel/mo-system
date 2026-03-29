<script lang="ts" setup>
import { Dialog } from 'primevue';
import { ref } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { Toast, useToast } from 'primevue';
import { addChecklistItem } from '@/services/apis/project-checklist.service';

const emits = defineEmits(['itemAdded'])
const props = defineProps<{projectId?:string}>()
const visible = defineModel<boolean>('visible')
const checklistItem = ref('')
const toast = useToast()

async function addItem() {
    if (checklistItem.value.length < 3) {
        toast.add({
            severity: 'error',
            summary: 'Name Error',
            detail: 'Checklist item must contain at least 3 characters',
            life: 3000
        })
        return
    }
    const res = await addChecklistItem({ item: checklistItem.value,projectId:props.projectId })
    if (res.success) {
        toast.add({
            severity: 'success',
            summary: 'Checklist Item Added',
            detail: 'New checklist item was added successfully',
            life: 3000
        })
        visible.value = false
        emits('itemAdded')
    }
    else {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'There was error during checklist item creation',
            life: 3000
        })
    }
}
</script>


<template>
    <Toast />
    <Dialog v-model:visible="visible" modal header="Add New Checklist Item">
        <div class="add-checklist-item-container">
            <InputText v-model="checklistItem" placeholder="New Item" />
            <Button @click="addItem" label="Add" icon="pi pi-plus" style="width: 6rem;align-self: flex-end;" />
        </div>
    </Dialog>
</template>


<style scoped>
.add-checklist-item-container {
    width: 20rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
</style>