<script setup lang="ts">
import SideBar from '@/components/general/SideBar.vue';
import NavigationBar from '@/components/general/NavigationBar.vue';
import SummaryCard from '@/components/dashboard/SummaryCard.vue';
import MOCard from '@/components/dashboard/MOCard.vue';
import { useRouter } from 'vue-router';
import { onMounted, ref, shallowRef, watch, computed, TransitionGroup } from 'vue';
import { useApiHandler } from '@/services/apiService';
import { type MOSummaryStatus } from '@/types/mo-order';
import { summaryCardsConf } from '@/constants/summaraCardData';

import { Skeleton } from 'primevue';

const router = useRouter()
const summaryData = shallowRef(summaryCardsConf)
const MOs = ref<any[]>([])
const selectedMOStatus = ref<MOSummaryStatus>('Total')

const { response:MOViewResponse, isLoading:isMOViewLoading, apiHandle:MOViewsAPIHandler } = useApiHandler()
onMounted(async () => {
    await MOViewsAPIHandler('/api/collections/MO_View/records', 'GET')
})
watch((MOViewResponse), (newRes) => {
    if (!(newRes && newRes.success && newRes.data && newRes.data.items))
        return

    MOs.value = newRes.data.items as any[]
    const MOStatusesCounts: Record<MOSummaryStatus, number> = { 'Not Started': 0, 'Active': 0, 'Completed': 0, 'Total': MOs.value.length }
    MOs.value.forEach(MO => { MOStatusesCounts[MO.MO_Status as MOSummaryStatus]++ })
    Object.entries(MOStatusesCounts).forEach(([k, v]) => summaryData.value[k as MOSummaryStatus].count = v)
})
const moShowList = computed(() => {
    return MOs.value.filter((mo) => { return (selectedMOStatus.value == 'Total' || selectedMOStatus.value == mo.MO_Status) })
})

</script>

<template>
    <div id="dashboard-container">
        <SideBar selectedPage="Dashboard" />
        <div id="dashboard-main-container">
            <NavigationBar pageName="Dashboard" />
            <div id="summary-cards-container">
                <SummaryCard v-for="(summaryCard, title) in summaryData" :key="title" :summaryData="summaryCard" :isLoading="isMOViewLoading" :isSelected="selectedMOStatus == title" :title="title" @selectedSummaryType="s => selectedMOStatus = s" />
            </div>
            <div  class="mo-cards-container">
                <Skeleton style="width: 24rem;height: 10rem;" v-if="isMOViewLoading" />
                <Skeleton style="width: 24rem;height: 10rem;" v-if="isMOViewLoading" />
                <Skeleton style="width: 24rem;height: 10rem;" v-if="isMOViewLoading" />
            </div>
            <TransitionGroup class="mo-cards-container" tag="MOCard" name="list">

                <MOCard v-if="!isMOViewLoading" v-for="mo, i in moShowList" :key="i" :MOData="mo" @click="router.push(`/manufacturing-order-info/${mo.id}`)" />
            </TransitionGroup>
        </div>
    </div>
</template>


<style scoped>
#dashboard-container {
    display: grid;
    grid-template-columns: max-content auto;

}

#dashboard-main-container {
    padding-inline: 1rem;
    max-height: 100vh;
    overflow: auto;
}

#summary-cards-container {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    margin-inline: auto;
    max-width: 80rem;
    margin-block: 2rem 4rem;
}

.mo-cards-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
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
</style>