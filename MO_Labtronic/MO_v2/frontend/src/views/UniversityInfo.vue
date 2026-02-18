<script setup lang="ts">
import SideBar from '@/components/general/SideBar.vue';
import { apiHandle } from '@/services/apiService';
import { computed, onMounted, ref } from 'vue'; import NavigationBar from '@/components/general/NavigationBar.vue';
import ProjectCard from '@/components/project/ProjectCard.vue';
import { useRoute } from 'vue-router';
import LabCard from '@/components/lab/LabCard.vue';

const route = useRoute()
const uniName = ref()
const uniId = computed(() => route.params.id)
const labs = ref<any[]>([])
const projects = ref<any[]>([])

onMounted(async () => {
    const { success, data } = await apiHandle(`/api/collections/Uni_View/records/${uniId.value}`, 'GET', true)
    if (!success || !data) return
    uniName.value = data.Uni_Name


    const projectsId = data.Project_IDs as string[]
    projectsId.forEach(id => {
        apiHandle(`/api/collections/Project_View/records/${id}`, 'GET', true).then(pRes => projects.value.push(pRes.data))
    })

    const labsId = data.Lab_IDs as string[]
    labsId.forEach(id => {
        apiHandle(`/api/collections/Lab_View/records/${id}`, 'GET', true).then(lRes => labs.value.push(lRes.data))
    })
})

</script>

<template>

    <div id="uni-info-container">
        <SideBar />
        <div id="uni-info-main">
            <NavigationBar :pageName="uniName" />
            <div id="uni-info-main-body">
                <div id="projects-container">
                    <h2 class="title">Projects</h2>

                    <div id="projects-wrapper">
                        <ProjectCard v-for="prj, i in projects" :key="i" :projectData="prj" />
                    </div>
                </div>

                <div id="labs-container">
                    <h2 class="title">Labs</h2>

                    <div id="labs-wrapper">
                        <LabCard v-for="lab, i in labs" :key="i" :lab="lab" />
                    </div>
                </div>


            </div>
        </div>
    </div>


</template>


<style scoped>
#uni-info-container {
    display: grid;
    grid-template-columns: max-content auto;
}

#uni-info-main {
    display: grid;
    max-height: 100vh;
    grid-template-rows: max-content 1fr;
}

#uni-info-main-body {
    padding-inline: 2rem;
    max-height: 100%;
    overflow-y: auto;
}

.uni-info-section-container {
    margin-block: 1rem;
}

#projects-container,
#labs-container {
    margin-block: 1rem;
    padding: 1.5rem;
    box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    background-color: white;
    border-radius: 0.25rem;
}

.title {
    opacity: 0.75;
    margin-bottom: 1rem;
    text-align: center;

}

#projects-wrapper,
#labs-wrapper {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

</style>