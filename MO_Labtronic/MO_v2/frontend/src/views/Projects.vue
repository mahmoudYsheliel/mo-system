<script setup lang="ts">
import SideBar from '@/components/general/SideBar.vue';
import NavigationBar from '@/components/general/NavigationBar.vue';
import { useRouter } from 'vue-router';
import { onMounted, ref, watch, computed, TransitionGroup } from 'vue';
import { apiHandle } from '@/services/apiService';
import ProjectCard from '@/components/project/ProjectCard.vue';
import { InputText } from 'primevue';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { Searcher } from 'fast-fuzzy';
import Button from 'primevue/button';
import { syncDB } from '@/services/sqlService';
import useUsersNames from '@/stores/usersNames';
import NewProjectDialog from '@/components/dialogs/NewProjectDialog.vue';

const usersNames = useUsersNames()
const router = useRouter()
const projects = ref<any[]>([])
const showDialog = ref(false)


onMounted(async () => {
    const projectsRes =await apiHandle('/api/collections/Project_View/records', 'GET')


    if (!(projectsRes && projectsRes.success))
        return
    projects.value = projectsRes.data.items as any[]

})
const search = ref('')

const results = computed(() => {
    if (search.value.trim() === '')
        return projects.value
    const searcher = new Searcher(
        projects.value,
        {
            keySelector: (obj) => Object.values(obj).join(' ').toLowerCase(),
            threshold: 0.8
        },
    );
    return searcher.search(search.value)
})



</script>

<template>
    <NewProjectDialog v-model:visible="showDialog" />
    <div id="project-container">
        <SideBar selectedPage="Projects" />
        <div id="project-main-container">
            <NavigationBar pageName="Projects" />
            <div class="new-project-action-container">
                <IconField style="width:clamp(12rem,60%,40rem) ;">
                    <InputIcon class="pi pi-search" />
                    <InputText style="width:100%" v-model="search" placeholder="Search" />
                </IconField>
                <Button @click="showDialog = true" label="New Project" icon="pi pi-plus" style="width: 12rem;" />
            </div>
            <TransitionGroup class="project-cards-container" tag="projectCard" name="list">
                <ProjectCard v-for="project, i in results" :key="i" :projectData="project" />
            </TransitionGroup>

            <div style="position: absolute; bottom: 2rem; right:2rem">
                <Button @click="syncDB" label="Sync DB" />
            </div>
        </div>
    </div>
</template>


<style scoped>
#project-container {
    display: grid;
    grid-template-columns: max-content auto;
}

#project-main-container {
    padding-inline: 2rem;
    max-height: 100vh;
    overflow: auto;
}

.new-project-action-container {
    margin-block: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}

.project-cards-container {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;

}

.list-enter-active,
.list-leave-active {
    transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}

@media screen and (max-width:1100px) {
    .project-cards-container {
        justify-content: center;
    }
}
</style>