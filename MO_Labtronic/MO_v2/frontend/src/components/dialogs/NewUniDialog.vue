<script lang="ts" setup>
import { Dialog } from 'primevue';
import { ref, nextTick, watch } from 'vue';
import Button from 'primevue/button';
import { apiHandle } from '@/services/apiService';
import { postEvent } from '@/utils/mediator';
import InputText from 'primevue/inputtext';

const visible = defineModel<boolean>('visible')
const uniName = ref('')


async function addUni(){
    if(uniName.value.length < 3){
        postEvent('add_toast',{
            severity:'error',
            summary:'Name Error',
            detail:'Universiy name must contain at least 3 characters'
        })
        return 
    }
    const res = await apiHandle('/api/collections/Uni_T/records','POST',true,'',{Uni_Name:uniName.value})
    if (res.success){
        postEvent('add_toast',{
            severity:'success',
            summary:'Universiy Added',
            detail:'New Universiy was added successfully'
        })
        visible.value = false
    }
    else{
        postEvent('add_toast',{
            severity:'error',
            summary:'Error',
            detail:'There was error during university creation'
        })
    }
}
</script>


<template>
    <Dialog v-model:visible="visible" modal header="Add New University">
        <div class="add-uni-container">
            <InputText v-model="uniName" placeholder="University Name" />
            <Button @click="addUni" label="Add" icon="pi pi-plus" style="width: 6rem;align-self: flex-end;"/>
        </div>
    </Dialog>
</template>


<style scoped>
.add-uni-container {
    width: 20rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
</style>