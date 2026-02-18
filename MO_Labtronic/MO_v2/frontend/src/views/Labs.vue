<script setup lang="ts">
import SideBar from '@/components/general/SideBar.vue';
import NavigationBar from '@/components/general/NavigationBar.vue';
import { onMounted, ref, watch, computed, TransitionGroup } from 'vue';
import { apiHandle } from '@/services/apiService';
import { InputText } from 'primevue';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { Searcher } from 'fast-fuzzy';
import Button from 'primevue/button';
import { syncDB } from '@/services/sqlService';
import NewLabDialog from '@/components/dialogs/NewLabDialog.vue';
import LabCard from '@/components/lab/LabCard.vue';

const labs = ref<any[]>([])


const showDialog = ref(false)

onMounted(async () => {
    const labRes = await apiHandle('/api/collections/Lab_View/records', 'GET', true, )

    if (!(labRes && labRes.success))
        return
    labs.value = labRes.data.items as any[]
})
const search = ref('')

const results = computed(() => {
    if (search.value.trim() === '')
        return labs.value
    const searcher = new Searcher(
        labs.value,
        {
            keySelector: (obj) => Object.values(obj).join(' ').toLowerCase(),
            threshold: 0.8
        },
    );
    return searcher.search(search.value)
})



</script>

<template>
    <div id="lab-container">
        <NewLabDialog v-model:visible="showDialog" />
        <SideBar selectedPage="Labs" />
        <div id="lab-main-container">
            <NavigationBar pageName="Labs" />
            <div class="new-lab-action-container">
                <IconField style="width:clamp(12rem,60%,40rem) ;">
                    <InputIcon class="pi pi-search" />
                    <InputText style="width:100%" v-model="search" placeholder="Search" />
                </IconField>
                <Button @click="showDialog = true" label="New Lab" icon="pi pi-plus" style="width: 12rem;" />
            </div>
            <TransitionGroup class="lab-cards-container" tag="div" name="list">
                <LabCard v-for="lab, i in results" :key="i" :lab="lab" />
            </TransitionGroup>

            <div style="position: absolute; bottom: 2rem; right:2rem">
                <Button @click="syncDB" label="Sync DB" />
            </div>
        </div>
    </div>
</template>


<style scoped>
#lab-container {
    display: grid;
    grid-template-columns: max-content auto;
}

#lab-main-container {
    padding-inline: 2rem;
    max-height: 100vh;
    overflow: auto;
}

.new-lab-action-container {
    margin-block: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}

.lab-cards-container {
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
    .lab-cards-container {
        justify-content: center;
    }
}
</style>