<script setup lang="ts">
import Select from 'primevue/select';
import useUsersNames from '@/stores/usersNames';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { postEvent } from '@/utils/mediator';
import { apiHandle } from '@/services/apiService';

const route = useRoute()
const visible = defineModel<boolean>('visible')
const selectedEng = ref()
const pEngs = ref<any[] | undefined>([])
onMounted(() => {
    const users = useUsersNames()
    users.getUsers().then(res => pEngs.value = res?.filter(user => user.Role.includes('Production Engineer')))
})

async function setPEng(){
    if(!selectedEng.value)
        return
    const moId = route.params.id
    const res = await apiHandle(`/api/collections/MO_T/records/${moId}`,'PATCH',true,'',{Production_Engineer:[selectedEng.value.id]})
    
    if(res.success){
        postEvent('add_toast', {
            severity: 'success',
            summary: 'Updated Successfully',
            detail: 'Production engineer was updated successfully'
        })
    }
    else{
        postEvent('add_toast', {
            severity: 'error',
            summary: 'Failed to Update',
            detail: 'Production engineer could not be updated successfully'
        })
    }
    visible.value = false
}

</script>

<template>
    <Dialog v-model:visible="visible" modal header="Select Production Engineer">
        <div class="select-eng-container">
            <Select v-model="selectedEng" :options="pEngs" optionLabel="Full_Name" placeholder="Select an Engineer"  />
            <Button @click="setPEng" label="Update Eng" style="width: 8rem;align-self: flex-end;"/>
        </div>
    </Dialog>
</template>


<style scoped>
.select-eng-container {
    width: 20rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
</style>