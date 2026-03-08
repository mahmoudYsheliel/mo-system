<script setup lang="ts">
import { Skeleton } from "primevue";
import NotificationMenu from "../navigation-bar/NotificationMenu.vue";
import UserMenu from "../navigation-bar/UserMenu.vue";


defineProps(["pageName"]);
</script>

<template>
    <div id="navigation-bar-container">
        <Skeleton v-if="!pageName" style="width: 10rem; height: 2rem" />
        <div id="navigation-bar" v-else>
            <div id="navigation-bar-left-options"></div>
            <h1 id="navigation-bar-title">{{ pageName }}</h1>
            <div id="navigation-bar-right-options">
                <NotificationMenu />
                <UserMenu />
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
    background-color: white;
    padding: 1rem;
    border-bottom: 2px solid rgba(0, 0, 0, 0.1);
    color: #757575;
    height: 4rem;
}

#navigation-bar {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
}



#navigation-bar-right-options,
#navigation-bar-left-options {
    display: flex;
    gap: 1rem;
}


</style>
