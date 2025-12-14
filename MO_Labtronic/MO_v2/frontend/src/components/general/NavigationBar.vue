<script setup lang="ts">
import { Skeleton } from "primevue";
import Button from "primevue/button";
import { onMounted, ref } from "vue";
import { Menu } from "primevue";
import { getNotificationColor, getNotificationIcon } from "@/constants/colors";
import { timeSince } from "@/lib/helperFunctions";
import { useApiHandler } from "@/services/apiService";
async function downloadDB() {
  const { apiHandle, response } = useApiHandler();
  await apiHandle(
    "/api/collections/new_notifications/records",
    "GET",true, "", undefined, "blob"
  );
  console.log(response.value)

  if (response.value?.data) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(response.value?.data);
    a.download = "downloaded_db";
    a.click();
  }
}

defineProps(["pageName"]);
const allowNotificationComputed = ref(Notification.permission === "granted");
const menu = ref();
const toggle = (event: MouseEvent) => {
  menu.value.toggle(event);
};
async function requestAllowNotification() {
  const perm = await Notification.requestPermission();
  allowNotificationComputed.value = perm === "granted";
}

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
    is_read: true,
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
    is_read: true,
    navigation_url: "/mo/125",
    extra_data: { mo_id: 125 },
  },
  {
    receiver: "user4",
    sender: "system",
    title: "New Note Added",
    body: "A note has been added to the manufacturing order.",
    type: "mo_note",
    time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_read: true,
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
    is_read: true,
    navigation_url: "/mo/127",
    extra_data: { mo_id: 127, reason: "Insufficient quality" },
  },
]);
</script>

<template>
  <Button label="download db" @click="downloadDB()" />
  <div id="navigation-bar-container">
    <Skeleton v-if="!pageName" style="width: 10rem; height: 2rem" />
    <div id="navigation-bar" v-else>
      <div id="navigation-bar-left-options"></div>
      <h1 id="navigation-bar-title">{{ pageName }}</h1>
      <div id="navigation-bar-right-options">
        <div v-if="allowNotificationComputed">
          <i
            class="pi pi-bell"
            @click="toggle"
            aria-haspopup="true"
            aria-controls="overlay_menu"
          ></i>
          <Menu
            ref="menu"
            :model="items"
            popup
            style="
              max-height: 20rem;
              overflow-y: auto;
              max-width: 20rem;
              -ms-overflow-style: none;
              scrollbar-width: none;
            "
          >
            <template #item="{ item, props }">
              <div
                class="notification-container"
                :style="{
                  opacity: item.is_read ? 0.75 : 1,
                  backgroundColor: `rgba(from ${getNotificationColor(
                    item.type,
                    item.is_read
                  )} r g b / 0.1)`,
                  borderLeft: `0.25rem solid ${getNotificationColor(
                    item.type,
                    item.is_read
                  )}`,
                }"
              >
                <div
                  class="notification-icon"
                  :style="{
                    backgroundColor: getNotificationColor(
                      item.type,
                      item.is_read
                    ),
                  }"
                >
                  <i :class="getNotificationIcon(item.type)" />
                </div>
                <div class="notification-message">
                  <p
                    class="notification-title"
                    :style="{
                      color: getNotificationColor(item.type, item.is_read),
                    }"
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
            </template>
          </Menu>
        </div>

        <i
          v-else
          class="pi pi-bell-slash"
          @click="requestAllowNotification()"
          style="color: #9ca3af"
        ></i>

        <i class="pi pi-user"></i>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1 {
  margin: 0;
  font-size: 1.5rem;
}
#navigation-bar-container {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  background-color: var(--color-background);
  padding: 1rem;
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);
  color: var(--color-muted-foreground);
  height: 4rem;
}
#navigation-bar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
i {
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  color: white;
  border-radius: 100%;
}
.pi-user {
  color: #e0f0ff;
  background-color: #1e90ff;
}
.pi-bell {
  color: #d4edda;
  background-color: #28a745;
}
.pi-bell-slash {
  color: #f8d7da;
  background-color: #dc3545;
}
#navigation-bar-right-options,
#navigation-bar-left-options {
  display: flex;
  gap: 1rem;
}

.notification-container {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  position: relative;
  overflow: auto;
}
.notification-message {
  display: flex;
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
  padding: 0.25rem;
  border-radius: 100%;
}
</style>
