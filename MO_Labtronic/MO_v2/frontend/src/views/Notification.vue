<script setup lang="ts">
import SideBar from "@/components/general/SideBar.vue";
import NavigationBar from "@/components/general/NavigationBar.vue";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { timeSince } from "@/lib/helperFunctions";
import { getNotificationColor,getNotificationIcon } from "@/constants/colors";

const items = ref([
  {
    receiver: "user1", // single user ID or username
    sender: "system", // sender ID or name
    title: "MO Creation",
    body: "A new manufacturing order has been assigned to you.",
    type: "mo_created",
    time: new Date().toISOString(), // timestamp
    is_read: true, // read status
    navigation_url: "/mo/123", // URL to navigate when clicked
    extra_data: { mo_id: 123, priority: "high" }, // additional info
  },
  {
    receiver: "user2",
    sender: "system",
    title: "MO Edit",
    body: "The manufacturing order has been edited. Check the details.",
    type: "mo_edited",
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    is_read: false,
    navigation_url: "/mo/124",
    extra_data: { mo_id: 124, edited_by: "user2" },
  },
  {
    receiver: "user3",
    sender: "system",
    title: "MO Completed",
    body: "The manufacturing order has been successfully completed.",
    type: "mo_completed",
    time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    is_read: false,
    navigation_url: "/mo/125",
    extra_data: { mo_id: 125 },
  },
  {
    receiver: "user4",
    sender: "system",
    title: "New Note Added",
    body: "A note has been added to the manufacturing order.",
    type: "mo_note",
    time: new Date(Date.now() - 30*5* 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_read: false,
    navigation_url: "/mo/126/notes",
    extra_data: { mo_id: 126, note_id: 55 },
  },
  {
    receiver: "user5",
    sender: "system",
    title: "Process Rejected",
    body: "The manufacturing order has been rejected. Action required!",
    type: "process_rejected",
    time: new Date().toISOString(),
    is_read: false,
    navigation_url: "/mo/127",
    extra_data: { mo_id: 127, reason: "Insufficient quality" },
  },
]);

const router = useRouter();


</script>

<template>
  <div id="notification-container">
    <SideBar selectedPage="Notifications" />
    <div id="notification-main-container">
      <NavigationBar pageName="Notification" />
      <div id="notifications-container">
        <div
          v-for="item in items"
          class="notification-container"
          :style="{
            opacity:item.is_read ? 0.75 : 1,
            backgroundColor: `rgba(from ${getNotificationColor(item.type,item.is_read)} r g b / 0.1)`,
            borderLeft: `0.25rem solid ${getNotificationColor(item.type,item.is_read)}`,
          }"
        >
          <div
            class="notification-icon"
            :style="{ backgroundColor: getNotificationColor(item.type,item.is_read) }"
          >
            <i :class="getNotificationIcon(item.type)" />
          </div>
          <div class="notification-message">
            <p
              class="notification-title"
              :style="{ color: getNotificationColor(item.type,item.is_read) }"
            >
              {{ item.title }}
            </p>
            <p class="notification-body">{{ item.body }}</p>

            <div class="notification-tail">
              <p class="notification-sender">
                {{ item.sender }}
              </p>
              <p class="notification-time">
                {{ timeSince(item.time) }}
              </p>
            </div>
          </div>
        </div>
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
#notifications-container{
    display: grid;
    width: clamp( 20rem, 90% ,75rem);
    margin-inline: auto;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    padding: 2rem 1rem;
    
}
.notification-container {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem 2rem;
  border-radius: 0.25rem;
  cursor: pointer;
  position: relative;
  width: clamp(16rem,100%,30rem);
  overflow: auto;
  
}
.notification-message {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 0.5rem;
  color: #2f3032;
}
.notification-title {
  font-size: 1.125rem;
  font-weight: 600;
}
.notification-body {
  font-size: 0.875rem;
  font-weight: 400;
}
.notification-tail {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 600;
}
.notification-icon {
  padding: 0.5rem;
  border-radius: 100%;
  color: white;
}
</style>
