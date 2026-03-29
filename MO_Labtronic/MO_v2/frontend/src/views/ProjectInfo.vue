<script setup lang="ts">
import SideBar from '@/components/general/SideBar.vue';
import { onMounted, ref } from 'vue';
import MODates from '@/components/manufacturing-order-info/MODates.vue';
import Notes from '@/components/manufacturing-order-info/Notes.vue';
import BreadCrumbNavigator from '@/components/general/BreadCrumbNavigator.vue';
import { type BreadCrumb } from '@/types/bread-crumb';
import NavigationBar from '@/components/general/NavigationBar.vue';
import { MORepresentativeColors, priorityColor } from '@/constants/colors';
import type { MODate } from '@/types/mo-order';
import Chip from '@/components/general/Chip.vue';
import CheckList from '@/components/project-info/CheckList.vue';
import FilesImages from '@/components/project-info/FilesImages.vue';
import { useRouter, useRoute } from 'vue-router';
import MOCard from '@/components/dashboard/MOCard.vue';
import { getExpandedProject, type DeepExpandedProject } from '@/services/apis/project.service';

const router = useRouter()
const route = useRoute()
const project = ref<DeepExpandedProject>({})
const breadCrumbData = ref<BreadCrumb[]>([])

const projectDatesObj = ref<MODate>({});

onMounted(async () => {
    const projectId = route.params.id

    const projectRes = await getExpandedProject(projectId as string)
    const projectData = projectRes.data

    if (!projectData) return
    project.value = projectData

    const uniData = projectData?.expand?.universityId
    const labData = projectData?.expand?.labId

    breadCrumbData.value?.push({ name: uniData?.name || '', command: () => { router.push(`/university-info/${uniData?.id}`) } });
    breadCrumbData.value?.push({ name: labData?.name || '', command: () => { router.push(`/lab-info/${labData?.id}`) } });
    breadCrumbData.value?.push({ name: projectData?.name || '', command: () => { router.push(`/project-info/${projectData?.id}`) } });


    projectDatesObj.value.start = projectData.created ? new Date(projectData.created) : undefined
    projectDatesObj.value.estimated = projectData.estDeadline ? new Date(projectData.estDeadline) : undefined
    projectDatesObj.value.finish = projectData.finDeadline ? new Date(projectData.finDeadline) : undefined

})


async function reloadProject() {
    const projectId = route.params.id as string
    const res = await getExpandedProject(projectId)
    const expandedProject = res.data

    if (!expandedProject) return;

    project.value = expandedProject
}

</script>

<template>

    <div id="project-info-container">
        <SideBar />
        <div id="project-info-main">
            <NavigationBar :pageName="project.name" />
            <div id="project-info-main-body">
                <BreadCrumbNavigator :breadCrumbElements="breadCrumbData" style="margin-top: 1rem" />
                <div class="chip-line-container">
                    <Chip v-if="project.priority" :bg="priorityColor[project.priority]" :label="project.priority" />
                    <Chip v-if="project?.expand?.projectManagerId?.userName"
                        :label="project?.expand?.projectManagerId?.userName"
                        :bg="MORepresentativeColors['Project Manager']" />

                    <Chip v-if="project?.expand?.designEngineersId?.[0]"
                        :label="project.expand.designEngineersId[0].userName"
                        :bg="MORepresentativeColors['Design Engineer']" />

                    <Chip v-if="project?.expand?.productionEngineersId?.[0]?.userName"
                        :label="project?.expand?.productionEngineersId?.[0]?.userName"
                        :bg="MORepresentativeColors['Production Engineer']" />
                </div>

                <div id="main-body">
                    <MODates :startDate="projectDatesObj.start" :estDate="projectDatesObj.estimated"
                        :finDate="projectDatesObj.finish" id="project-dates" />

                         <FilesImages :assemblyPics="project.assemblyPics" :assemblyFiles="project.assemblyFiles"
                                :projectFiles="project.projectFiles" />
                    <div class="checklist-notes-container">
                        <div style="flex: 2;"
                        
                            v-show="project.assemblyPics?.length || project.assemblyFiles?.length || project.projectFiles?.length">
                            <Notes :notes="project.expand?.notes_via_projectId" @noteSent="reloadProject()"
                        :projectId="project.id" />
                           
                        </div>
                        <div style="flex: 1;" >
                            <CheckList  :checkList="project.expand?.project_check_list_via_projectId" :projectId="project.id" @itemAdded="reloadProject()" />
                        </div>

                    </div>

                    


                    <div id="project-notes-container" v-show="project.expand?.mos_via_projectId?.length">
                        <h2 id="project-title">Manufacturing Orders</h2>
                        <TransitionGroup class="project-cards-container" tag="MOCard" name="list">
                            <MOCard v-for="mo, i in project.expand?.mos_via_projectId" :key="i" :MOData="mo"
                                @click="router.push(`/manufacturing-order-info/${mo.id}`)" />
                        </TransitionGroup>
                    </div>
                </div>

            </div>
        </div>
    </div>


</template>


<style scoped>
#project-info-container {
    display: grid;
    grid-template-columns: max-content auto;
}

#project-info-main {
    display: grid;
    max-height: 100vh;
    grid-template-rows: max-content 1fr;
}

#project-info-main-body {
    padding-inline: 1rem;
    max-height: 100%;
    overflow-y: auto;

}

.chip-line-container {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
    gap: 1rem;
    max-width: 100%;
    overflow-x: auto;
    padding: 0 1rem 0.5rem 1rem;
    scrollbar-width: thin;
    scrollbar-color: #aaa transparent;
    scrollbar-track-color: none;
}

#main-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
}

.project-cards-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

#project-title {
    opacity: 0.75;
    margin-bottom: 1rem;
    text-align: center;
}

#project-notes-container {
    padding: 1.5rem;
    box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    background-color: white;
    border-radius: 0.25rem;
}

.checklist-notes-container {
    display: flex;
    gap: 1rem;
}

@media screen and (max-width:1440px) {
    .checklist-notes-container {
        flex-direction: column;

    }
}
</style>