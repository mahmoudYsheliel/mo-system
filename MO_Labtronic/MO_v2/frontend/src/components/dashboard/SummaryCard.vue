<script setup lang="ts">
import { ref, watch } from 'vue'
import { Skeleton } from 'primevue'
import type { SummaryData } from '@/types/summaryData'
import type { PropType } from 'vue'


const props = defineProps({ isLoading: { type: Boolean }, title: { type: String }, summaryData: { type: Object as PropType<SummaryData>,required:true }, isSelected: { type: Boolean } })
const emits = defineEmits(['selectedSummaryType'])
const mainColorUpdated = ref(props.isSelected ? props.summaryData.bgColor : props.summaryData.mainColor)
const bgColorUpdated = ref(props.isSelected ? props.summaryData.mainColor : props.summaryData.bgColor)
watch((props), () => {
    mainColorUpdated.value = props.isSelected ? props.summaryData.bgColor : props.summaryData.mainColor
    bgColorUpdated.value = props.isSelected ? props.summaryData.mainColor : props.summaryData.bgColor
})
</script>

<template>
    <div class="summary-card-container" @click="$emit('selectedSummaryType', title)">
        <Skeleton style="width: 71%; height: 71%;" class="icon-wrapper" v-if="isLoading" />
        <div class="icon-wrapper" :style="{ background: mainColorUpdated, border: isSelected ? 'none' : '' }" v-if="!isLoading">
            <component :is="summaryData.Element" :fillColor="mainColorUpdated" class="summary-icon" :style="{ backgroundColor: bgColorUpdated, color: mainColorUpdated }" />
        </div>
        <p v-if="!isLoading" class="summary-count" :style="{ color: (isSelected ? 'white' : 'initial') }"> {{ summaryData.count }}</p>
        <p v-if="!isLoading" class="summary-title" :style="{ backgroundColor: bgColorUpdated, color: mainColorUpdated, border: `${mainColorUpdated} solid 1px` }"> {{ title }} </p>
    </div>
</template>

<style scoped>
.summary-card-container {
    position: relative;
    width: 12rem;
    height: 12rem;
    cursor: pointer;

}

.summary-card-container>* {
    transition-duration: 0.25s;
}

.summary-icon {
    width: 50%;
    padding: 15% 15% 5% 15%;
    transform: translateX(-20%) translateY(-20%) rotateZ(-45deg);
    position: relative;
    border-radius: 100%;
}

.icon-wrapper {
    width: 71%;
    height: 71%;
    position: relative;
    transform: rotateZ(45deg) translateX(29%);
    border-radius: 1rem;
    overflow: hidden;
    border: 0.125rem solid rgba(0, 0, 0, 0.1);
}


.summary-count {
    font-size: 2rem;
    position: absolute;
    top: 50%;
    left: 50%;
    margin: 0;
    transform: translateX(-50%) translateY(-50%);
}

.summary-title {
    position: absolute;
    top: 50%;
    left: 50%;
    margin: 0;
    transform: translateX(-50%) translateY(100%);
    width: 80%;
    text-align: center;
    border-radius: 0.5rem;
    padding: 0.25rem;
}

@media (max-width:1024px) {
    .summary-card-container {
        width: 10rem;
        height: 10rem;
    }
}
</style>
