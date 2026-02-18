<script lang="ts" setup>
import { useRouter } from 'vue-router';

const router =useRouter()
defineProps(["lab"])
</script>

<template>
    <div class="lab-container"  @click="router.push(`/lab-info/${lab.id}`)">
        <div class="lab-info">
            <p>{{ lab.Lab_Name }}</p>
            <p>{{ lab.Lab_Code }}</p>
        </div>
        <p data-v-84abed25="" style="font-weight: 600; margin-bottom: 0.25rem;">Projects Count: {{ lab.Projects_Count }}</p>
    </div>
</template>


<style>
.lab-container{
    border: 0.125rem solid rgba(232, 226, 226, 0.05);
    box-shadow: 0 6px 14px rgba(0, 0, 0, .05);
    min-width: 24rem;
    padding: 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
}
.lab-info {
    width: 100%;
    text-align: center;
   
    display: flex;
    justify-content: space-between;
    padding-bottom: 0.5rem;
    margin-bottom: 0.5rem;
    border-bottom: 2px var(--color-secondary) solid;
}
</style>