<script setup lang="ts">
import SideBar from "@/components/general/SideBar.vue";
import NavigationBar from "@/components/general/NavigationBar.vue";
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { getUserNotification, type ExpandedMONotification } from "@/services/apis/mo-notification.service";
import NotificationCard from "@/components/notification/NotificationCard.vue";

const items = ref<ExpandedMONotification[]>([])

const router = useRouter();

onMounted(async () => {
    const notificationRes = await getUserNotification()
    if (notificationRes.data?.items) items.value = notificationRes.data.items
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
</style>
