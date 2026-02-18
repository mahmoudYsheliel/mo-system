<script setup lang="ts">
import Dialog from 'primevue/dialog';
import { Button } from 'primevue';
import { DatePicker } from 'primevue';
import { computed, ref } from 'vue';
import { postEvent } from '@/utils/mediator';
import { apiHandle } from '@/services/apiService';

import { useRoute } from 'vue-router';


const route = useRoute()
const visible = defineModel<boolean>('visible')
const selectedDate = ref()
const moId = computed(() => route.params.id)

async function setEndDate() {
    if (!selectedDate.value)
        return
    const res = await apiHandle(`/api/collections/MO_T/records/${moId.value}`, 'PATCH', true, '', { Est_Deadline: selectedDate.value })
    if (res.success) {
        postEvent('add_toast', {
            severity: 'success',
            summary: 'Updated Successfully',
            detail: `Estimated End date has been updated successfully`
        })
    }
    else {
        postEvent('add_toast', {
            severity: 'error',
            summary: 'Failed to Update',
            detail: 'Estimated End date could not be updated successfully'
        })
    }
    visible.value = false
}
</script>

<template>
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