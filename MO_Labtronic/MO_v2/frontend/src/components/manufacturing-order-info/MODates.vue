<script lang="ts" setup>
import ArrowBowIcon from '@/icons/ArrowBowIcon.vue';
import ArrowTargetIcon from '@/icons/ArrowTargetIcon.vue';
import ArrowDownIcon from '@/icons/ArrowDownIcon.vue';
import ArrowRightIcon from '@/icons/ArrowRightIcon.vue';
import { getDate } from '@/lib/helperFunctions';
import { dateColorMap } from '@/constants/colors';
import { ref, watch } from 'vue';
import { Skeleton } from 'primevue';

const props = defineProps(['start', 'estemated', 'finished'])
let currentDate = new Date();


const startDate = ref();
const finishedDate = ref();
const estematedDate = ref();

const currentDiff = ref()
const finishedDiff = ref()
const estimatedDiff = ref()

const endPoint = ref()
const dateColor = ref()
watch((props), () => {
    startDate.value = new Date(props.start)
    finishedDate.value = props.finished ? new Date(props.finished) : null
    estematedDate.value =  props.estemated ? new Date(props.estemated) :null

    currentDiff.value = (Number(currentDate) - Number(startDate.value)) / (1000 * 60 * 60 * 24)
    finishedDiff.value = (finishedDate.value ? (Number(finishedDate.value) - Number(startDate.value)) / (1000 * 60 * 60 * 24) : null)
    estimatedDiff.value = (estematedDate.value ? (Number(estematedDate.value) - Number(startDate.value)) / (1000 * 60 * 60 * 24) : null)

    endPoint.value = ((finishedDiff.value && estimatedDiff.value) ? Math.max(finishedDiff.value, estimatedDiff.value) : Math.max(currentDiff.value, estimatedDiff.value))
    dateColor.value = dateColorMap(estematedDate.value ? estematedDate.value > currentDate : false)
})
</script>
 

<template>
    <Skeleton style="border-radius: 1rem; height: 4rem; width: calc(100% - 4rem);margin-inline:auto ;" v-if="!props.start" />
    <div class="mo-date-container" v-else>
        <div class="mo-date-line"></div>
        <div class="mo-date-point">
            <ArrowBowIcon :style="{ background: dateColor['start'], fill: 'white' }" />
            <div :style="{ backgroundColor: dateColor['start'] }" class="mo-date-date1">{{ getDate(startDate) }}</div>
        </div>

        <div v-if="finishedDate && finishedDiff" class="mo-date-point" :style="{ left: (finishedDiff / endPoint * 100).toString() + '%' }">
            <ArrowDownIcon :style="{ background: dateColor['finish'], fill: 'white' }" />
            <div :style="{ backgroundColor: dateColor['finish'] }" class="mo-date-date2">{{ getDate(finishedDate) }}</div>
        </div>

        <div v-else class="mo-date-point" :style="{ left: (currentDiff / endPoint * 100).toString() + '%' }">
            <ArrowRightIcon :style="{ background: dateColor['current'], fill: 'white' }" />
            <div :style="{ backgroundColor: dateColor['current'] }" class="mo-date-date2">{{ getDate(currentDate) }}</div>
        </div>

        <div v-if="estematedDate" class="mo-date-point" :style="{ left: (estimatedDiff / endPoint * 100).toString() + '%' }">
            <ArrowTargetIcon :style="{ background: dateColor['estimated'], fill: 'white' }" />
            <div :style="{ backgroundColor: dateColor['estimated'] }" class="mo-date-date3">{{ getDate(estematedDate) }}</div>
        </div>
    </div>

</template>

<style scoped>
.mo-date-container {
    margin-inline: 4rem;
    position: relative;
    height: 8rem;
}

.mo-date-line {
    position: absolute;
    width: 100%;
    height: 0.125rem;
    background-color: #ccc;
    top: calc(50%);
    transform: translateY(-50%);
    z-index: 2;
}

.mo-date-point {
    position: absolute;
    aspect-ratio: 1/1;
    border-radius: 100%;
    top: calc(50%);
    transform: translateY(-50%) translateX(-50%);
    z-index: 4;
}

.mo-date-point>*:first-child {
    width: 2rem;
    padding: 0.375rem 0.375rem 0rem 0.375rem;
    aspect-ratio: 1/1;
    position: absolute;
    transform: translate(-50%, -50%);
    border-radius: 100%;
    z-index: 4;
}

.mo-date-date3,
.mo-date-date2,
.mo-date-date1 {
    position: absolute;
    font-size: 0.75rem;
    width: max-content;
    letter-spacing: 0.25px;
    text-align: center;
    padding: 0.5rem 1rem;
    background-color: antiquewhite;
    transform: translateX(-50%) translateY(75%);
    border-radius: 1rem;
    top: calc(50%);
    color: white;
    font-weight: 900;
    background-color: inherit;
}

.mo-date-date2 {
    transform: translateX(-50%) translateY(-175%);
}
</style>