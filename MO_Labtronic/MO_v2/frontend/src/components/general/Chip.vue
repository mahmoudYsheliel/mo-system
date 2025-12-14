<script lang="ts" setup>
import 'primeicons/primeicons.css'
import { Skeleton } from 'primevue';

const props = defineProps({
    label: String,
    icon: String,
    iconItem: { type: Object, default: null },
    color: { type: String, default: '#FFFFFF' },
    bg: { type: String, default: '#9E9E9E' } // gray
});
</script>

<template>
    <Skeleton style="width: 6rem;height: 2rem; border-radius: 1rem;" v-if="!label" /> 
    <div class="chip-container" :style="{ color: props.color, background: props.bg }" v-if="props.label">
        <i v-if="props.icon" :class="props.icon"></i>
        <component v-if="props.iconItem" :is="props.iconItem" :style="{ fill: props.color }" class="icon-item" />
        <p>{{ props.label }}</p>
    </div>
</template>


<style scoped>
.chip-container {
    padding: 0.5rem 1rem;
    width: fit-content;
    font-size: 0.8rem;
    font-weight: bolder;
    border-radius: 2rem;
    display: flex;
    gap: 0.25rem;
    align-items: center;
}

p {
    margin: 0;
}

i {
    font-size: 0.75rem;
    font-weight: bolder;
}

.icon-item {
    width: 0.75rem;
}
</style>