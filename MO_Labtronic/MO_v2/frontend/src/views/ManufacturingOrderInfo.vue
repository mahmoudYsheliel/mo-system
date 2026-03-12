<script lang="ts" setup>
import Notes from "@/components/manufacturing-order-info/Notes.vue";
import NavigationBar from "@/components/general/NavigationBar.vue";
import MODates from "@/components/manufacturing-order-info/MODates.vue";
import BreadCrumbNavigator from "@/components/general/BreadCrumbNavigator.vue";
import Chip from "@/components/general/Chip.vue";
import MOParts from "@/components/manufacturing-order-info/MOParts.vue";
import MOFiles from "@/components/manufacturing-order-info/MOFiles.vue";
import SideBar from "@/components/general/SideBar.vue";
import {
    MOTypeColors,
    priorityColor,
    MORepresentativeColors,
    moStatusColorMap,
} from "@/constants/colors";

import type { MODate, MOType } from "@/types/mo-order";
import type { BreadCrumb } from "@/types/bread-crumb";
import Button from "primevue/button";
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import SelectPEngDialog from "@/components/dialogs/SelectPEngDialog.vue";
import SetEndDateDialog from "@/components/dialogs/SetEndDateDialog.vue";
import { getMO, markMoSeen } from "@/services/apis/mo.service";
import { getUser } from "@/services/user.service";
import { type DeepExpandedMO } from "@/services/apis/mo.service";
import { createNotification } from "@/services/apis/mo-notification.service";
import type { ProcessModel } from "@/models/process.model";

const route = useRoute();
const router = useRouter();

const breadCrumbData = ref<BreadCrumb[]>([]);

const MODatesObj = ref<MODate>({});

const selectPEngDialog = ref(false)
const setEndDateDialog = ref(false)

const currentUser = getUser()

const isDesigner = currentUser?.roles?.includes('Design Engineer')
const isMoProduction = ref(false)
const mo = ref<DeepExpandedMO>()
onMounted(async () => {
    const moId = route.params.id as string
    const res = await getMO(moId)
    const moData = res.data

    if (!moData) return;
    mo.value = moData
    await markMoSeen(moData)

    const uniData = moData.expand?.projectId?.expand?.universityId
    const labData = moData.expand?.projectId?.expand?.labId
    const projectData = moData.expand?.projectId

    breadCrumbData.value?.push({ name: uniData?.name || '', command: () => { router.push(`/university-info/${uniData?.id}`) } });
    breadCrumbData.value?.push({ name: labData?.name || '', command: () => { router.push(`/lab-info/${labData?.id}`) } });
    breadCrumbData.value?.push({ name: projectData?.name || '', command: () => { router.push(`/project-info/${projectData?.id}`) } });
    breadCrumbData.value?.push({ name: moData.name || '', command: () => { } });

    MODatesObj.value.start = moData.created ? new Date(moData.created) : undefined
    MODatesObj.value.estimated = moData.estDeadline ? new Date(moData.estDeadline) : undefined
    MODatesObj.value.finish = moData.finDeadline ? new Date(moData.finDeadline) : undefined

    isMoProduction.value = (mo.value.productionEngineer === currentUser?.id)
    // show set end date dialog if Est_Deadline is undefined and the current user is the production engineer for the mo
    setEndDateDialog.value = !(!!moData.estDeadline) && isMoProduction.value;

});
async function reloadMo(note?: string) {
    const moId = route.params.id as string
    const res = await getMO(moId)
    const expandedMo = res.data
    if (!expandedMo) return;
    if (note) {
        createNotification({ mo: expandedMo, notificationType: 'mo_note', addedNote: note })
        return
    }
    const newProcesses = expandedMo.expand?.parts_via_moId?.flatMap(part => part.expand?.processes_via_partId || []) ?? [];
    if (checkProcessRejectionUpdate(newProcesses)) {
        createNotification({ mo: expandedMo, notificationType: 'process_rejected' })
        mo.value = expandedMo
        return
    }

    if (expandedMo.completionPercentage === 100 && mo.value?.completionPercentage!=100) {
        createNotification({ mo: expandedMo, notificationType: 'mo_completed' })
        mo.value = expandedMo
        return
    }

}
function checkProcessRejectionUpdate(newProcesses: ProcessModel[]): Boolean {
    const oldProcesses = mo.value?.expand?.parts_via_moId?.flatMap(part => part.expand?.processes_via_partId || []) ?? []
    for (const oldP of oldProcesses) {
        if (oldP.status == 'Rejected') continue
        const newStatus = newProcesses.find(newP => newP.id === oldP.id)?.status
        if (newStatus == 'Rejected') return true
    }
    return false
}


</script>

<template>
    <SelectPEngDialog v-model:visible="selectPEngDialog" />
    <SetEndDateDialog v-model:visible="setEndDateDialog" />
    <div id="mo-info-container">
        <SideBar />
        <div id="mo-info-main">
            <NavigationBar :pageName="mo?.name" />
            <div id="mo-info-main-body">
                <BreadCrumbNavigator :breadCrumbElements="breadCrumbData" style="margin-top: 1rem" />
                <div class="chip-line-container">
                    <Chip v-if="mo?.type" :bg="MOTypeColors[mo.type as MOType]" :label="mo.type" />
                    <Chip v-if="mo?.priority" :bg="priorityColor[mo.priority]" :label="mo.priority" />
                    <Chip v-if="mo?.status" :bg="moStatusColorMap[mo.status]" :label="mo.status" />

                    <Chip v-if="mo?.expand?.projectId?.expand?.projectManagerId?.userName" :label="mo?.expand?.projectId?.expand?.projectManagerId?.userName" :bg="MORepresentativeColors['Project Manager']" />

                    <Chip v-if="mo?.expand?.projectId?.expand?.designEngineersId?.[0]" :label="mo.expand.projectId.expand.designEngineersId[0].userName" :bg="MORepresentativeColors['Design Engineer']" />

                    <Chip v-if="mo?.expand?.productionEngineer" :label="mo?.expand?.productionEngineer.userName" :bg="MORepresentativeColors['Production Engineer']" />

                </div>

                <MODates :startDate="MODatesObj.start" :estDate="MODatesObj.estimated" :finDate="MODatesObj.finish" id="mo-dates" />
                <div class="mo-info-section-container">
                    <Notes :notes="mo?.expand?.notes_via_moId" @noteSent="(note) => reloadMo(note)" :moId="mo?.id" />
                </div>
                <div class="mo-info-section-container" v-show="mo?.expand?.mo_files_via_moId">
                    <MOFiles :projectName="mo?.expand?.projectId?.name" :MOName="mo?.name" :MOId="mo?.id" :files="mo?.expand?.mo_files_via_moId" />
                </div>
                <div class="mo-info-section-container">
                    <MOParts :originalParts="mo?.expand?.parts_via_moId" @updateProcesses="reloadMo()" />
                </div>
            </div>
        </div>
        <Button v-if="isDesigner || isMoProduction" @click="selectPEngDialog = !selectPEngDialog;" class="change-eng-btn" label="Change Production Eng" />
    </div>

</template>

<style scoped>
#mo-info-container {
    display: grid;
    grid-template-columns: max-content auto;
}

#mo-info-main {
    display: grid;
    max-height: 100vh;
    grid-template-rows: max-content 1fr;
}

#mo-info-main-body {
    padding-inline: 2rem;
    max-height: 100%;
    overflow-y: auto;
}

.chip-line-container {
    margin-top: 1rem;
    display: flex;
    gap: 1rem;
    width: 100%;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    scrollbar-width: thin;
    scrollbar-color: #aaa transparent;
}

.mo-info-section-container {
    margin-block: 1rem;
}

.change-eng-btn {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    font-size: 0.75rem;
}
</style>
