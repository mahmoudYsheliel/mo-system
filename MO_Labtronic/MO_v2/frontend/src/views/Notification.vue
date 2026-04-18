<script setup lang="ts">
import SideBar from "@/components/general/SideBar.vue";
import NavigationBar from "@/components/general/NavigationBar.vue";
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { getUserNotification, type ExpandedMONotification } from "@/services/apis/mo-notification.service";
import NotificationCard from "@/components/notification/NotificationCard.vue";
import Paginator, { type PageState } from 'primevue/paginator';
import { SearchCriteriaModel } from "@/models/search-criteria.model";

const items = ref<ExpandedMONotification[]>([])

const page = ref(0)
const perPage = ref(10)
const totalRecords = ref(0)

function updatePageParams(params: Partial<PageState>) {
    page.value = params.page ?? 1
    perPage.value = params.rows ?? 10
    getNotificationsData()
}

async function getNotificationsData() {
    const searchCriteria = new SearchCriteriaModel({ page: page.value + 1, perPage: perPage.value })
    const notificationRes = await getUserNotification(searchCriteria)
    if (notificationRes.data) {
        items.value = notificationRes.data.items
        totalRecords.value = notificationRes.data.totalItems
    }

    document.getElementById('notification-main-container')?.scroll({
        top: 0,
        behavior: 'smooth'
    });

}

onMounted(async () => {
    getNotificationsData()
})
</script>

<template>
    <div id="notification-container">
        <SideBar selectedPage="Notifications" />
        <div id="notification-main-container">
            <NavigationBar pageName="Notification" />
            <div id="notifications-container">
                <NotificationCard v-for="item in items" :notification="item" />
            </div>
            <Paginator class="paginator" @page="e => updatePageParams(e)" :totalRecords="totalRecords" :rows="perPage" :rowsPerPageOptions="[2, 5, 10, 20, 30]" />

        </div>
    </div>
</template>

<style scoped>
#notification-container {
    display: grid;
    grid-template-columns: max-content auto;
}

#notification-main-container {
    padding-inline: 1rem;
    max-height: 100vh;
    overflow: auto;
}

#notifications-container {
    display: grid;
    width: clamp(20rem, 90%, 75rem);
    margin-inline: auto;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    padding: 2rem 1rem;
}

.paginator {
    margin-top: 1rem;
    margin-bottom: 2rem;
}
</style>
