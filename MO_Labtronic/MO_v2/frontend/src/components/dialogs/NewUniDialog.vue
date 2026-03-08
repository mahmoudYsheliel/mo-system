<script lang="ts" setup>
import { Dialog } from 'primevue';
import { ref, nextTick, watch } from 'vue';
import Button from 'primevue/button';
import { createUniversity } from '@/services/apis/university.service';
import InputText from 'primevue/inputtext';
import { Toast, useToast } from 'primevue';

const visible = defineModel<boolean>('visible')
const uniName = ref('')
const toast = useToast()

async function addUni(){
    if(uniName.value.length < 3){
        toast.add({
            severity:'error',
            summary:'Name Error',
            detail:'University name must contain at least 3 characters',
            life:3000
        })
        return 
    }
    const res = await createUniversity({name:uniName.value})
    if (res.success){
        toast.add({
            severity:'success',
            summary:'University Added',
            detail:'New University was added successfully',
            life:3000
        })
        visible.value = false
    }
    else{
        toast.add({
            severity:'error',
            summary:'Error',
            detail:'There was error during university creation',
            life:3000
        })
    }
}
</script>


<template>
    <Toast />
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