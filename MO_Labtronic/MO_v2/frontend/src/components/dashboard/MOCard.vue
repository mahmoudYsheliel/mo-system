<script setup lang="ts">
import SingleCheckMark from '@/icons/SingleCheckMark.vue';
import DoubleCheckIcon from '@/icons/DoubleCheckIcon.vue';
import NoteIcon from '@/icons/NoteIcon.vue';
import { ProgressBar } from 'primevue';
import { priorityColor } from '@/constants/colors';
import type { MOSummaryStatus, Priority } from '@/types/mo-order'
import { useAuth } from '@/stores/auth';
import { moStatusColorMap } from '@/constants/colors';


const props = defineProps(['MOData'])
const auth = useAuth()
function isReadByUser(){
    const seen =  props.MOData.Seen as any[]
    return seen?.includes(auth.user.id)
}
</script>

<template>
    <div class="mo-card-container">
        <div class="mo-card-header">
            <div class="mo-card-left-header">
                <div class="mo-card-is-read" v-if="!isReadByUser()"></div>
               
                <p class="mo-card-title">{{ MOData.MO_Name }}</p>
                <p class="mo-card-priority" v-if="(MOData.Periority as Priority)" :style="{ backgroundColor: priorityColor[MOData.Periority as Priority] }">{{ MOData.Periority }}</p>
            </div>
            <div class="mo-card-right-header">
                <div class="mo-card-new-notes">
                    <NoteIcon class="mo-card-icon" v-if="MOData.Notes_Status == 'True'" />
                </div>
                <div class="mo-card-message-status">
                    <SingleCheckMark v-if="MOData.Files_Sent_Status == 'Some Sent'" class="mo-card-icon" />
                    <DoubleCheckIcon v-if="MOData.Files_Sent_Status == 'All Sent'" class="mo-card-icon" />
                </div>
                <p class="mo-card-status" :style="{ backgroundColor: moStatusColorMap[MOData.MO_Status as MOSummaryStatus] }">{{ MOData.MO_Status }}</p>
            </div>
        </div>
        <div class="mo-card-main">
            <div class="mo-card-current-process">
            </div>
            <div class="mo-card-uni-lab">
                <div class="mo-card-uni">{{ MOData.Project_Name }}</div>
                <div class="mo-card-uni">{{ MOData.Project_Code }}</div>
            </div>
            <div class="mo-card-parts-engs">
                <div class="mo-card-engs">{{ MOData.Project_Manager }} - {{ MOData.Production_Engineer }} - {{ MOData.Design_Engineer }} </div>
                <div class="mo-card-parts">{{ MOData.Parts_Count }} Parts</div>
            </div>
            <div class="mo-card-progress">
                <div class="mo-card-prog-bar">
                    <ProgressBar :value="MOData.Completed" />
                </div>

            </div>
        </div>


    </div>


</template>

<style scoped>
.mo-card-container {
    width: 24rem;
    height: 10rem;
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

.mo-card-header * {
    margin: 0;
}

.mo-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 1rem;
    border-bottom: 2px var(--color-secondary) solid;
}

.mo-card-is-read {
    width: 1rem;
    height: 1rem;
    background-color: red;
    border-radius: 100%;
}

.mo-card-left-header,
.mo-card-right-header {
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.mo-card-priority,
.mo-card-status {
    font-size: 0.75rem;
    border-radius: 0.75rem;
    padding: 0.25rem 0.5rem;
    color: white;
}

.mo-card-parts-engs,
.mo-card-progg-percentage,
.mo-card-uni-lab {
    color: var(--color-muted-foreground);
    font-size: 0.75rem;
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.mo-card-progress {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
}

.mo-card-prog-bar {
    flex-grow: 1;
}

.mo-card-icon {
    width: 1rem;
}
</style>