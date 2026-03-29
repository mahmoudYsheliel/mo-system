<script setup lang="ts">
import SideBar from '@/components/general/SideBar.vue';
import NavigationBar from '@/components/general/NavigationBar.vue';
import SummaryCard from '@/components/dashboard/SummaryCard.vue';
import MOCard from '@/components/dashboard/MOCard.vue';
import { useRouter } from 'vue-router';
import { onMounted, ref, shallowRef, TransitionGroup, watch } from 'vue';
import { type MOSummaryStatus } from '@/types/mo-order';
import { summaryCardsConf } from '@/lib/build-summary-card-data';
import { getMOs, getMyMOs } from '@/services/apis/mo.service';
import { Skeleton } from 'primevue';
import type { DeepExpandedMO } from '@/services/apis/mo.service';
import SelectButton from 'primevue/selectbutton';

const moFilterType = ref(['All MOs', 'My MOs'])
const selectedMoFilterType = ref<string | undefined>(undefined)


const router = useRouter()
const summaryData = shallowRef(summaryCardsConf)
const mos = ref<Record<MOSummaryStatus, DeepExpandedMO[]>>({ 'Not Started': [], 'Active': [], 'Completed': [], 'Total': [] })
const selectedMOStatus = ref<MOSummaryStatus>('Total')
const isMOViewLoading = ref(true)
onMounted(async () => {
    selectedMoFilterType.value = 'All MOs'
})

watch(selectedMoFilterType, async () => {
    isMOViewLoading.value = true
    mos.value = { 'Not Started': [], 'Active': [], 'Completed': [], 'Total': [] }
    const moRes = await (selectedMoFilterType.value === 'All MOs' ? getMOs() : getMyMOs())
    if (!moRes.data)
        return


    const expandedMos = moRes.data.items
    expandedMos.forEach(mo => {
        mos.value['Total'].push(mo)
        switch (mo.status) {
            case 'Active': mos.value['Active'].push(mo); break;
            case 'Completed': mos.value['Completed'].push(mo); break;
            case 'Not Started': mos.value['Not Started'].push(mo); break;
        }
    })

    summaryData.value.Active.count = mos.value.Active.length
    summaryData.value.Completed.count = mos.value.Completed.length
    summaryData.value['Not Started'].count = mos.value['Not Started'].length
    summaryData.value.Total.count = mos.value.Total.length
    isMOViewLoading.value = false

})


</script>

<template>
    <div id="dashboard-container">
        <SideBar selectedPage="Dashboard" />
        <div id="dashboard-main-container">
            <NavigationBar pageName="Dashboard" />
            <div id="dashboard-select-button-container">
                <SelectButton v-model="selectedMoFilterType" :options="moFilterType" />

            </div>

            <div id="summary-cards-container">
                <SummaryCard v-for="(summaryCard, title) in summaryData" :key="title" :summaryData="summaryCard"
                    :isLoading="isMOViewLoading" :isSelected="selectedMOStatus == title" :title="title"
                    @selectedSummaryType="s => selectedMOStatus = s" />
            </div>
            <div class="mo-cards-container">
                <Skeleton style="width: 24rem;height: 10rem;" v-if="isMOViewLoading" />
                <Skeleton style="width: 24rem;height: 10rem;" v-if="isMOViewLoading" />
                <Skeleton style="width: 24rem;height: 10rem;" v-if="isMOViewLoading" />
            </div>
            <TransitionGroup class="mo-cards-container" tag="MOCard" name="list">
                <MOCard v-if="!isMOViewLoading" v-for="mo, i in mos[selectedMOStatus]" :key="i" :MOData="mo"
                    @click="router.push(`/manufacturing-order-info/${mo.id}`)" />
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

#dashboard-select-button-container {
    width: 100%;
    margin-block: 0.5rem;
    display: flex;
    justify-content: center;
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
    transition: all 0.25s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}
</style>