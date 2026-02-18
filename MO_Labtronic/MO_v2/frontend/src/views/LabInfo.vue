<script setup lang="ts">
import SideBar from '@/components/general/SideBar.vue';
import { apiHandle } from '@/services/apiService';
import { computed, onMounted, ref } from 'vue'; import NavigationBar from '@/components/general/NavigationBar.vue';
import ProjectCard from '@/components/project/ProjectCard.vue';
import { useRoute } from 'vue-router';
import UniCard from '@/components/university/UniCard.vue';

const route = useRoute()
const labName = ref()
const labId = computed(() => route.params.id)
const unis = ref<any[]>([])
const projects = ref<any[]>([])

onMounted(async () => {
    const { success, data } = await apiHandle(`/api/collections/Lab_View/records/${labId.value}`, 'GET', true)
    if (!success || !data) return
    labName.value = data.Lab_Name


    const projectsId = data.Project_IDs as string[]
    projectsId.forEach(id => {
        apiHandle(`/api/collections/Project_View/records/${id}`, 'GET', true).then(pRes => projects.value.push(pRes.data))
    })

    const unisId = data.Uni_IDs as string[]
    unisId.forEach(id => {
        apiHandle(`/api/collections/Uni_View/records/${id}`, 'GET', true).then(uRes => unis.value.push(uRes.data))
    })
})

</script>

<template>

    <div id="lab-info-container">
        <SideBar />
        <div id="lab-info-main">
            <NavigationBar :pageName="labName" />
            <div id="lab-info-main-body">
                <div id="projects-container">
                    <h2 class="title">Projects</h2>

                    <div id="projects-wrapper">
                        <ProjectCard v-for="prj, i in projects" :key="i" :projectData="prj" />
                    </div>
                </div>

                <div id="unis-container">
                    <h2 class="title">Universities</h2>

                    <div id="unis-wrapper">
                        <UniCard v-for="uni, i in unis" :key="i" :uni="uni" />
                    </div>
                </div>


            </div>
        </div>
    </div>


</template>


<style scoped>
#lab-info-container {
    display: grid;
    grid-template-columns: max-content auto;
}

#lab-info-main {
    display: grid;
    max-height: 100vh;
    grid-template-rows: max-content 1fr;
}

#lab-info-main-body {
    padding-inline: 2rem;
    max-height: 100%;
    overflow-y: auto;
}

.lab-info-section-container {
    margin-block: 1rem;
}

#projects-container,
#unis-container {
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
#unis-wrapper {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

</style>