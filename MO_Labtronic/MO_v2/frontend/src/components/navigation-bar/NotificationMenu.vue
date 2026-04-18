<script setup lang="ts">
import { getUserNotification, type ExpandedMONotification } from '@/services/apis/mo-notification.service';
import { onMounted, ref } from 'vue';
import OverlayBadge from 'primevue/overlaybadge';
import Popover from 'primevue/popover';
import { Button } from 'primevue';
import NotificationCardSmall from '../notification/NotificationCardSmall.vue';
import { useRouter } from 'vue-router';
import { batchMarkNotificationsRead } from '@/services/apis/mo-notification.service';
import { getUser } from '@/services/user.service';
import { subscribeToPushAlert } from '@/services/pushalert.service';
import { SearchCriteriaModel } from '@/models/search-criteria.model';

const allowNotificationComputed = ref<Boolean>(Notification.permission === "granted" && !!getUser()?.pushAlertSubscriberId);
const notificationPopover = ref();
const notReadNotificationsCount = ref<number | undefined>()
const toggleNotification = (event: MouseEvent) => {
    notificationPopover.value.toggle(event);
};
async function requestAllowNotification() {
    subscribeToPushAlert((inp) => {
        console.log(1)
        console.log(inp)
    })
    const perm = await Notification.requestPermission();
    allowNotificationComputed.value = (perm === "granted" && !!getUser()?.pushAlertSubscriberId)
}
const items = ref<ExpandedMONotification[]>([])

onMounted(async () => {
    const notificationRes = await getUserNotification(new SearchCriteriaModel({perPage:5}))
    if (notificationRes.data?.items) {
        items.value = notificationRes.data.items
        notReadNotificationsCount.value = notificationRes.data?.items.filter(notification => !notification.isRead).length
    }
})


const router = useRouter()
function notificationNavigate() {
    router.push('/notification')
}
async function markAllRead() {
    await batchMarkNotificationsRead()
    window.location.reload()
}


</script>


<template>
    <div v-if="allowNotificationComputed">
        <OverlayBadge v-if="notReadNotificationsCount" :value="notReadNotificationsCount" severity="warn" size="small">
            <i class="pi pi-bell" @click="toggleNotification" aria-haspopup="true" aria-controls="overlay_menu"></i>
        </OverlayBadge>
        <i v-else class="pi pi-bell" @click="toggleNotification" aria-haspopup="true" aria-controls="overlay_menu"></i>

        <Popover ref="notificationPopover">
            <div class="main-menu">
                <div style="margin-bottom: 0.5rem;" v-for="item in items">
                    <NotificationCardSmall :notification="item" />
                </div>
            </div>
            <div class="notification-menu-end">
                <Button label="Mark All Read" size="small" @click="markAllRead()" />
                <Button label="See All" size="small" @click="notificationNavigate();" />
            </div>

        </Popover>

    </div>

    <i v-else class="pi pi-bell-slash" @click="requestAllowNotification()" style="color: #9ca3af"></i>

</template>


<style scoped>
.pi-bell {
    color: #d4edda;
    background-color: #28a745;
}

.main-menu {
    max-height: 20rem;
    overflow-y: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
    width: fit-content;
}

.notification-menu-end {
    display: flex;
    justify-content: end;
    margin-top: 0.5rem;
    gap: 0.5rem;
}

i {
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.25rem;
    color: white;
    border-radius: 100%;
}

.pi-bell-slash {
    color: #f8d7da;
    background-color: #dc3545;
}
</style>