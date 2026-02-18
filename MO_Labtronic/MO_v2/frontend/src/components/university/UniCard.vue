<script lang="ts" setup>
import { useRouter } from 'vue-router';
const router  = useRouter()
defineProps(['uni'])
</script>

<template>

    <div class="uni-container"  @click="router.push(`/university-info/${uni.id}`)">
        <div class="uni-info">
            <p>{{ uni.Uni_Name }}</p>
        </div>
        <p style="font-weight: 600; margin-bottom: 0.25rem;">Projects Count: {{ uni.Projects_Count }}</p>
    </div>
</template>

<style scoped>


.uni-container{
    border: 0.125rem solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 6px 14px rgba(0, 0, 0, .05);
    min-width: 24rem;
    padding: 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
}
.uni-info {
    width: 100%;
    text-align: center;
    
    display: flex;
    justify-content: space-between;
    padding-bottom: 0.5rem;
    margin-bottom: 0.5rem;
    border-bottom: 2px var(--color-secondary) solid;
}

</style>