<script setup lang="ts">
import Dialog from 'primevue/dialog';
import { Button } from 'primevue';
import { DatePicker } from 'primevue';
import { computed, ref } from 'vue';
import {Toast,useToast} from 'primevue';
import { useRoute } from 'vue-router';
import { setEstDate } from '@/services/apis/mo.service';

const toast = useToast()
const route = useRoute()
const visible = defineModel<boolean>('visible')
const selectedDate = ref()
const moId = computed(() => route.params.id)

async function setEndDate() {
    if (!selectedDate.value)
        return
    const res = await setEstDate(moId.value as string, selectedDate.value )
    if (res.success) {
        toast.add({
            severity: 'success',
            summary: 'Updated Successfully',
            detail: `Estimated End date has been updated successfully`
        })
    }
    else {
        toast.add({
            severity: 'error',
            summary: 'Failed to Update',
            detail: 'Estimated End date could not be updated successfully'
        })
    }
    visible.value = false
}
</script>

<template>
    <Toast />
    <Dialog v-model:visible="visible" modal header="Select MO End Date">
        <div class="set-end-date-container">
            <div class="label-date-element">
                <p>Select Date</p>
                <DatePicker v-model="selectedDate" />
            </div>
            <Button :disabled="!selectedDate" style="align-self: flex-end;" label="Confirm" @click="setEndDate()" />
        </div>
    </Dialog>
</template>


<style scoped>
.set-end-date-container {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.label-date-element {
    display: flex;
    gap: 2rem;
    align-items: center;
}
</style>