<script setup lang="ts">
import ProductionEngineerIcon from '@/icons/ProductionEngineerIcon.vue';
import ProjectManagerIcon from '@/icons/ProjectManagerIcon.vue';
import DesignEnginerIcon from '@/icons/DesignEnginerIcon.vue';
import LabIcon from '@/icons/LabIcon.vue';
import UniversityIcon from '@/icons/UniversityIcon.vue';
import { priorityColor } from '@/constants/colors';
import { useRouter } from 'vue-router';
import type { Priority } from '@/types/mo-order'

const router = useRouter()
const props = defineProps(['projectData'])
</script>

<template>
    <div class="project-card-container" @click="router.push(`/project-info/${projectData?.id}`)">
        <div class="project-card-header">
            <div class="project-card-left-header">
                <p class="project-card-title">{{ projectData.Project_Name }}</p>
            </div>
            <div class="project-card-right-header">
                <p class="project-card-code">({{ projectData.Project_Code }})</p>

            </div>
        </div>

        <div class="project-card-main">


            <div class="project-card-engs">
                <div class="projeject-card-element-container">
                    <ProjectManagerIcon class="element-icon" />
                    <p>{{ projectData.Project_Manager }}</p>
                </div>
                <div class="projeject-card-element-container">
                    <DesignEnginerIcon class="element-icon" />
                    <p>{{ projectData.Design_Engineer }}</p>
                </div>
                <div class="projeject-card-element-container">
                    <ProductionEngineerIcon class="element-icon" />
                    <p>{{ projectData.Production_Engineer }}</p>
                </div>

            </div>
            <div class="project-card-main-separator"></div>
            <div class="project-card-uni-lab">
                <p class="project-card-priority projeject-card-element-container" v-if="(projectData.Periority as Priority)" :style="{ backgroundColor: priorityColor[projectData.Periority as Priority] }">{{ projectData.Periority }}</p>
                <div class="projeject-card-element-container">
                    <UniversityIcon class="element-icon" />
                    <p>{{ projectData.University_Name }} </p>
                </div>
                <div class="projeject-card-element-container">
                    <LabIcon class="element-icon" />
                    <p>{{ projectData.Lab_Name }} </p>
                </div>
            </div>
        </div>
        <div>
            <p style="font-weight: 600;margin-bottom: 0.25rem;">MOs Count: {{ projectData.MOs_Count }}</p>
        
        </div>

    </div>
</template>

<style scoped>
.project-card-container {
    width: 24rem;
    min-height: 14rem;
    color: var(--text);
    box-sizing: border-box;
    border: 0.125rem solid rgba(0, 0, 0, 0.05);
    border-radius: 1rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: 0 6px 14px rgba(0, 0, 0, .05);
    cursor: pointer;
}

.project-card-header * {
    margin: 0;
}

.project-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 1rem;
    border-bottom: 2px var(--color-secondary) solid;
}

.project-card-left-header,
.project-card-right-header {
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.project-card-code,
.project-card-title {
    color: #2c2c2c;
}

.project-card-code {
    font-size: 0.75rem;
    opacity: 0.75;
}

.project-card-main {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
}

.project-card-priority {
    font-size: 0.75rem;
    border-radius: 0.75rem;
    padding: 0.25rem 0.5rem;
    color: white;
    width: fit-content;
}

.project-card-main-separator {
    width: 4px;
    border-radius: 1rem;
    background-color: var(--color-muted-foreground);
    margin-inline: 0.5rem;
}

.project-card-engs,
.project-card-uni-lab {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.projeject-card-element-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 1.5rem;
}

.element-icon {
    width: 1.125rem;
    fill: var(--color-muted-foreground);
}

.project-card-mos-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
}

.mo-chip {
    font-size: 0.875rem;
    background-color: #e0e0e0;
    width: 8rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
}
.empty-icon-container{
    display: flex; 
    justify-content: center;
    align-items: center;
    padding-top: 1rem;
}

</style>