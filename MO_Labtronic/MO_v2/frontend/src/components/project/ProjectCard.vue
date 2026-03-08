<script setup lang="ts">
import ProductionEngineerIcon from '@/icons/ProductionEngineerIcon.vue';
import ProjectManagerIcon from '@/icons/ProjectManagerIcon.vue';
import DesignEngineerIcon from '@/icons/DesignEngineerIcon.vue';
import LabIcon from '@/icons/LabIcon.vue';
import UniversityIcon from '@/icons/UniversityIcon.vue';
import { priorityColor } from '@/constants/colors';
import { useRouter } from 'vue-router';
import type { DeepExpandedProject } from '@/services/apis/project.service';

const router = useRouter()
const props = defineProps<{projectData?:DeepExpandedProject}>()
</script>

<template>
    <div class="project-card-container" @click="router.push(`/project-info/${projectData?.id}`)">
        <div class="project-card-header">
            <div class="project-card-left-header">
                <p class="project-card-title">{{ projectData?.name }}</p>
            </div>
            <div class="project-card-right-header">
                <p class="project-card-code">({{ projectData?.code }})</p>

            </div>
        </div>

        <div class="project-card-main">


            <div class="project-card-eng">
                <div class="project-card-element-container">
                    <ProjectManagerIcon class="element-icon" />
                    <p>{{ projectData?.expand?.projectManagerId?.userName }}</p>
                </div>
                <div class="project-card-element-container">
                    <DesignEngineerIcon class="element-icon" />
                    <p>{{ projectData?.expand?.designEngineersId?.[0]?.userName }}</p>
                </div>
                <div class="project-card-element-container">
                    <ProductionEngineerIcon class="element-icon" />
                    <p>{{ projectData?.expand?.productionEngineersId?.[0]?.userName }}</p>
                </div>

            </div>
            <div class="project-card-main-separator"></div>
            <div class="project-card-uni-lab">
                <p class="project-card-priority project-card-element-container" v-if="projectData?.priority" :style="{ backgroundColor: priorityColor[projectData.priority] }">{{ projectData.priority }}</p>
                <div class="project-card-element-container">
                    <UniversityIcon class="element-icon" />
                    <p>{{ projectData?.expand?.universityId?.name }} </p>
                </div>
                <div class="project-card-element-container">
                    <LabIcon class="element-icon" />
                    <p>{{ projectData?.expand?.labId?.name  }} </p>
                </div>
            </div>
        </div>
        <div>
            <p style="font-weight: 600;margin-bottom: 0.25rem;">MOs Count: {{ projectData?.expand?.mos_via_projectId?.length || 0 }}</p>
        
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
    border-bottom: 2px #ebebeb solid;
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
    background-color: #757575;
    margin-inline: 0.5rem;
}

.project-card-eng,
.project-card-uni-lab {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.project-card-element-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 1.5rem;
}

.element-icon {
    width: 1.125rem;
    fill: #757575;
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