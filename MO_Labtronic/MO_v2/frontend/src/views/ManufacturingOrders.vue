<script setup lang="ts">
import SideBar from '@/components/general/SideBar.vue';
import NavigationBar from '@/components/general/NavigationBar.vue';
import MOCard from '@/components/dashboard/MOCard.vue';
import { useRouter } from 'vue-router';
import { onMounted, ref, watch, computed, TransitionGroup } from 'vue';
import { InputText } from 'primevue';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { Searcher } from 'fast-fuzzy';
import Button from 'primevue/button';
import NewMODialog from '@/components/dialogs/NewMODialog.vue';
import { syncDB } from '@/services/sql.service';
import { getMOs, type DeepExpandedMO } from '@/services/apis/mo.service';
import Paginator, { type PageState } from 'primevue/paginator';
import { SearchCriteriaModel } from '@/models/search-criteria.model';

const router = useRouter()
const MOs = ref<DeepExpandedMO[]>([])
const showDialog = ref(false)
const isMOViewLoading = ref(true)


const page = ref(0)
const perPage = ref(10)
const totalRecords = ref(0)

onMounted( () => {
    getMosData()
})


const search = ref('')

const results = computed(() => {
    if (search.value.trim() === '')
        return MOs.value
    const searcher = new Searcher(
        MOs.value,
        {
            keySelector: (obj) => Object.values(obj).join(' ').toLowerCase(),
            threshold: 0.8
        },
    );
    return searcher.search(search.value)
})

async function getMosData(){
    const searchCriteria = new SearchCriteriaModel({ page: page.value + 1, perPage: perPage.value })

    const res = await getMOs(searchCriteria)
    if (!(res && res.success && res.data && res.data.items))
        return
    MOs.value = res.data.items 
    isMOViewLoading.value = false
    totalRecords.value = res.data.totalItems

    document.getElementById('mo-main-container')?.scroll({
        top: 0,
        behavior: 'smooth'
    });
}

function updatePageParams(params: Partial<PageState>) {
    page.value = params.page ?? 1
    perPage.value = params.rows ?? 10
    getMosData()
}


</script>

<template>
    <div id="mo-container">
        <NewMODialog v-model:visible="showDialog" />
        <SideBar selectedPage="Manufacturing Orders" />
        <div id="mo-main-container">
            <NavigationBar pageName="Manufacturing Orders" />
            <div class="new-mo-action-container">
                <IconField style="width:clamp(12rem,60%,40rem) ;">
                    <InputIcon class="pi pi-search" />
                    <InputText style="width:100%" v-model="search" placeholder="Search" />
                </IconField>
                <Button @click="showDialog = true" label="New MO" icon="pi pi-plus" style="width: 12rem;" />
            </div>
            <TransitionGroup class="mo-cards-container" tag="MOCard" name="list">
                <MOCard v-if="!isMOViewLoading" v-for="mo, i in results" :key="i" :MOData="mo" @click="router.push(`/manufacturing-order-info/${mo.id}`)" />
            </TransitionGroup>
            <div style="position: absolute; bottom: 2rem; right:2rem">
                <Button @click="syncDB" label="Sync DB" />
            </div>
            <Paginator class="paginator" @page="e => updatePageParams(e)" :totalRecords="totalRecords" :rows="perPage" :rowsPerPageOptions="[2, 5, 10, 20, 30]" />

        </div>
    </div>
</template>


<style scoped>
#mo-container {
    display: grid;
    grid-template-columns: max-content auto;

}

#mo-main-container {
    padding-inline: 1rem;
    max-height: 100vh;
    overflow: auto;
}

.new-mo-action-container {
    margin-block: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;

}

.mo-cards-container {
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

.paginator {
    margin-top: 1rem;
    margin-bottom: 2rem;
}
@media screen and (max-width:1100px) {
    .mo-cards-container {
        justify-content: center;
    }
}
</style>