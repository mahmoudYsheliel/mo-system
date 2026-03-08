<script lang="ts" setup>
import { getNotificationColor, getNotificationIcon } from '@/constants/colors';
import { timeSince } from '@/lib/helper-functions';
import { markNotificationSeen, type ExpandedMONotification } from '@/services/apis/mo-notification.service';
import { useRouter } from 'vue-router';

const router = useRouter()
const props = defineProps<{ notification: ExpandedMONotification,scale?:number }>()
async function openNotification(){
    await markNotificationSeen(props.notification)
    router.push(`/manufacturing-order-info/${props.notification.moId}`)
}
</script>


<template>

    <div  class="notification-container"
    @click="openNotification()"
    :style="{
        opacity: notification.isRead ? 0.75 : 1,
        backgroundColor: `rgba(from ${getNotificationColor(notification.type, notification.isRead)} r g b / 0.1)`,
        borderLeft: `0.2rem solid ${getNotificationColor(notification.type, notification.isRead)}`,
    }">
        <div class="notification-icon" :style="{ backgroundColor: getNotificationColor(notification.type, notification.isRead) }">
            <i :class="getNotificationIcon(notification.type)" />
        </div>
        <div class="notification-message">
            <p class="notification-title" :style="{ color: getNotificationColor(notification.type, notification.isRead) }">
                {{ notification.title }}
            </p>
            <p class="notification-body">{{ notification.body }}</p>

            <div class="notification-tail">
                <p class="notification-sender">
                    {{ notification.expand?.senderId?.userName }}
                </p>
                <p class="notification-time" v-if="notification.created">
                    {{ timeSince(notification.created) }}
                </p>
            </div>
        </div>
    </div>


</template>


<style scoped>

.notification-container {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem;
    border-radius: 0.25rem;
    cursor: pointer;
    position: relative;
    overflow: auto;
    min-width: 15rem;
    max-width: 20rem;
}
.notification-message {
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 0.25rem;
    color: #2f3032;
}

.notification-title {
    font-size: 1rem;
    font-weight: 600;
}
.notification-tail {
    display: flex;
    justify-content: space-between;
    font-size: 0.6rem;
    font-weight: 600;
}
.notification-body {
    font-size: 0.75rem;
    font-weight: 400;
}
.notification-icon {
    padding: 0.5rem;
    border-radius: 100%;
    color: white;
    font-size: 0.75rem;
}


</style>