<script setup lang="ts">
import SideBar from '@/components/general/SideBar.vue';
import { apiHandle } from '@/services/apiService';
import { onMounted, ref } from 'vue';
import MODates from '@/components/manufacturing-order-info/MODates.vue';
import Notes from '@/components/manufacturing-order-info/Notes.vue';
import BreadCrumbNavigator from '@/components/general/BreadCrumbNavigator.vue';
import { type BreadCrumb } from '@/types/breadCrumb';
import NavigationBar from '@/components/general/NavigationBar.vue';
import useUsersNames from '@/stores/usersNames';
import { MORepresentativeColors, priorityColor } from '@/constants/colors';
import type { Priority, MODate } from '@/types/mo-order';
import Chip from '@/components/general/Chip.vue';
import type { UserType } from '@/types/user';
import { type FetchedNote } from '@/types/note';
import CheckList from '@/components/project-info/CheckList.vue';
import FilesImages from '@/components/project-info/FilesImages.vue';
import { useRouter, useRoute } from 'vue-router';
import MOCard from '@/components/dashboard/MOCard.vue';

const router = useRouter()
const route = useRoute()
const projectName = ref()
const breadCrumbData = ref<BreadCrumb[]>([])
const userNames = useUsersNames()
const projectPriority = ref<Priority>();
const engineers = ref<Partial<Record<UserType, string>>>({});
const projectDatesObj = ref<MODate>({});
const notes = ref<FetchedNote[]>()
const checkList = ref('')
const assemblyPics = ref<any[]>([])
const assemblyfiles = ref<any[]>([])
const projectFiles = ref<any[]>([])
const MOs = ref<any[]>([])


onMounted(async () => {
    const projectId = route.params.id

    const { success, data } = await apiHandle(`/api/collections/Projects_T/records/${projectId}`, 'GET', true)
    if (!success || !data) return
    const projectData = data

    const { data: uniData, success: uniSuccess } = await apiHandle('/api/collections/Uni_T/records', 'GET', true, `?filter=(id='${projectData.University}')`)
    const { data: labData, success: labSuccess } = await apiHandle('/api/collections/Lab_T/records', 'GET', true, `?filter=(id='${projectData.Lab}')`)

    if (uniSuccess && labSuccess) {
        const uniName = uniData.items[0]?.Uni_Name
        const labName = labData.items[0]?.Lab_Name
        breadCrumbData.value?.push({ name: uniName, command: () => { } });
        breadCrumbData.value?.push({ name: labName, command: () => { } });
        breadCrumbData.value?.push({ name: projectData?.Project_Name, command: () => { } });
    }

    projectName.value = projectData?.Project_Name
    projectPriority.value = projectData.Periority

    const names = await userNames.getUsers()
    engineers.value['Project Manager'] = names?.find(n => n.id == projectData.Project_Manager[0]).Full_Name
    engineers.value['Design Engineer'] = names?.find(n => n.id == projectData.Design_Engineer[0]).Full_Name
    engineers.value['Production Engineer'] = names?.find(n => n.id == projectData.Production_Engineer[0]).Full_Name

    projectDatesObj.value.start = projectData?.created;
    projectDatesObj.value.estimated = projectData?.Est_Deadline;
    projectDatesObj.value.finish = projectData?.Fin_Deadline;
    notes.value = projectData?.Notes ?? JSON.parse(projectData?.Notes)
    checkList.value = projectData.CheckList

    assemblyPics.value = projectData.Assembly_Pic
    assemblyfiles.value = projectData.Assembly_Files
    projectFiles.value = projectData.Project_Files


    const res = await apiHandle('/api/collections/MO_View/records', 'GET', true, `?filter=(Project='${projectId}')`)
    if (!(res && res.success && res.data && res.data.items))
        return

    MOs.value = res.data.items as any[]
})



</script>

<template>

    <div id="project-info-container">
        <SideBar />
        <div id="project-info-main">
            <NavigationBar :pageName="projectName" />
            <div id="project-info-main-body">
                <BreadCrumbNavigator :breadCrumbElements="breadCrumbData" style="margin-top: 1rem" />
                <div class="chip-line-constainer">
                    <Chip :bg="priorityColor[projectPriority as Priority]" :label="projectPriority" />
                    <Chip v-for="(engineer, engType) in engineers" :bg="MORepresentativeColors[engType as UserType]" :label="engineer" />
                </div>

                <MODates :start="projectDatesObj.start" :estemated="projectDatesObj.estimated" :finished="projectDatesObj.finish" id="project-dates" />

                <div class="project-info-section-container">
                    <CheckList :checkListString="checkList" />
                </div>
                <div class="project-info-section-container">
                    <FilesImages :assemblyPics="assemblyPics" :assemblyfiles="assemblyfiles" :projectFiles="projectFiles" />
                </div>
                <div class="project-info-section-container">
                    <Notes :fetchedNotes="notes" tableName="Projects_T" />
                </div>


                <div class="project-info-section-container">
                    <div id="project-notes-container">
                        <h2 id="project-title">Manufacturing Orders</h2>
                        <TransitionGroup class="project-cards-container" tag="MOCard" name="list">
                            <MOCard v-for="mo, i in MOs" :key="i" :MOData="mo" @click="router.push(`/manufacturing-order-info/${mo.id}`)" />
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
    padding-inline: 2rem;
    max-height: 100%;
    overflow-y: auto;
}

.chip-line-constainer {
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

.project-info-section-container {
    margin-block: 1rem;
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
</style>