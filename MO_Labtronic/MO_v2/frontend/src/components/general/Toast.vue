<script setup lang="ts">
import { onMounted } from 'vue';
import { Toast } from 'primevue';
import { useToast } from 'primevue';
import { subscribe } from '@/utils/mediator';
import type { ToastNotification } from '@/types/toast';


const toast = useToast()

onMounted(()=>{
    subscribe('add_toast',(arg:ToastNotification)=>{
        toast.add(arg)
    })
})
</script>


<template>
    <Toast />
</template>