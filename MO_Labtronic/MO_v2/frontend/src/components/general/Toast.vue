<script setup lang="ts">
import { onMounted } from 'vue';
import { Toast } from 'primevue';
import { useToast } from 'primevue';
import { subscribe } from '@/utils/mediator';
import type { ToastNotification } from '@/types/toast';


const toast = useToast()

onMounted(() => {
    subscribe('add_toast', (arg: ToastNotification) => {
        const severity = arg.severity || 'info'
        const summary = arg.summary || 'Message'
        const detail = arg.detail || 'Message Details'
        const life = arg.life || 3000
        toast.add({severity,summary,detail,life})
    })
})
</script>


<template>
    <Toast />
</template>