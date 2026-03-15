<script setup lang="ts">
import CodeIcon from "@/icons/CodeIcon.vue";
import ThicknessIcon from "@/icons/ThicknessIcon.vue";
import ColorIcon from "@/icons/ColorIcon.vue";
import MaterialTypeIcon from "@/icons/MaterialTypeIcon.vue";
import DimensionIcon from "@/icons/DimensionIcon.vue";
import CountIcon from "@/icons/CountIcon.vue";
import StatusMenu from "./StatusMenu.vue";
import "primeicons/primeicons.css";
import { getFileLink } from "@/lib/helper-functions";
import Image from 'primevue/image';
import type { ExpandedPart } from "@/services/apis/mo.service";
import { computed } from "vue";

const pros = defineProps<{ part: ExpandedPart }>();

const dataObject = computed(() => {
    return [
        {
            com: CodeIcon,
            type: 'Code',
            val: pros?.part.code
        },
        {
            com: ThicknessIcon,
            type: 'Thickness',
            val: pros?.part.thickness
        },
        {
            com: DimensionIcon,
            type: 'Dimension',
            val: pros?.part.dim
        },
        {
            com: ColorIcon,
            type: 'Color',
            val: pros?.part.color
        },
        {
            com: MaterialTypeIcon,
            type: 'Material',
            val: pros?.part.material
        },
        {
            com: CountIcon,
            type: 'Count',
            val: pros?.part.quantity
        },

    ]
})

</script>

<template>
    <div class="part-container">
        <h3 class="part-name">{{ pros?.part?.name }}</h3>
        <div class="part-info-wrapper" v-for="data in dataObject">
            <div class="part-info-type">
                <component style="width: 1rem" :is="data.com" />
                <p class="info-type">{{ data.type }}:</p>
            </div>
            <p class="part-info-value">
                {{ data.val }}
            </p>
        </div>


        <p class="process-text">Process</p>


        <div class="process-container">
            <div class="process-name-status" v-for="proc in pros?.part?.expand?.processes_via_partId" :key="proc.id">
                <p class="process-name">{{ proc.name }}</p>
                <StatusMenu :statusProp="proc.status" @newStatus="s => proc.status = s" />
            </div>
        </div>
        <div class="part-img" v-if="!!pros?.part?.id && !!pros?.part?.pic">
            <Image :src="getFileLink('parts', pros?.part?.id, pros?.part?.pic)" alt="Image" preview width="100%"
                height="100%" />
        </div>
    </div>

</template>

<style scoped>
.part-container {
    box-shadow: 0 0.125rem 0.25rem 0 rgba(0, 0, 0, 0.25);
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    height: 100%;
}

.part-name {
    text-align: center;
    opacity: 0.75;
    margin-bottom: 1rem;
    border-bottom: solid 1px #bdbdbd;
}

.part-info-wrapper {
    display: grid;
    grid-template-columns: 10rem 10rem;
}

.part-info-type {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    color: #444;
    fill: #444;
}

.part-info-value {
    font-weight: 500;
    color: #2c2c2c;
}

.part-img {
    width: 8rem;
    aspect-ratio: 1/1;
    display: block;
    margin-inline: auto;
    display: flex;
    justify-content: center;
}

.process-text {
    margin-block: 0.5rem 0.25rem;
    color: #444;
}

.process-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.process-name-status {
    display: grid;
    grid-template-columns: 9rem 9rem;
    align-items: center;
    margin-bottom: 0.25rem;
}
</style>
