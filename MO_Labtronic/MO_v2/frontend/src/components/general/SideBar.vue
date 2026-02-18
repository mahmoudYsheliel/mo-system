<script setup lang="ts">
import { createSideBarActions, createSideBarmMinItems } from '@/lib/buildSidebar';
import { type UserType } from '@/types/user';
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router';
import { useAuth } from '@/stores/auth';
import 'primeicons/primeicons.css'
import { getFileLink } from '@/lib/helperFunctions';

const router = useRouter()
const auth = useAuth()
const sideBarmMinItems = createSideBarmMinItems(router)
const sideBarActions = createSideBarActions(router)
const showTitle = ref(false)
const name = ref("")
const title = ref("")
const img = ref("")

function update() {
    showTitle.value = window.innerWidth < 800
}


function getAvatar() {
    const user = auth.user
    return getFileLink(user.collectionId, user.id, user.Avatar) || ""
}

onMounted(() => {
    update()
    window.addEventListener('resize', update)
    name.value = auth.user?.Account_Name || ""
    title.value = auth.user?.Role[0] || ""
    img.value = auth.user?.Avatar || ""
})

onUnmounted(() => {
    window.removeEventListener('resize', update)

})

const userType: UserType = 'Design Engineer'

const barItems = computed(() => {
    const res = sideBarmMinItems.filter(item => item.accessedBy.includes(userType))
    return res
})


defineProps(['selectedPage'])


</script>


<template>
    <div id="side-bar-container">
        <div id="side-bar-header">
            <div id="side-bar-avatar">
                <img v-if="img" :src="getAvatar()" alt="">
                    <i v-else class="pi pi-user"></i>
            </div>
            <div id="side-bar-name-title">
                <p id="side-bar-title"> {{ title }}</p>
                <p id="side-bar-name">{{ name }}</p>
            </div>
        </div>
        <div class="side-bar-items-container">
            <div class="side-bar-item-container" v-for="item in barItems">
                <div class="side-bar-item" :class="{ selected_item: (selectedPage == item.name) }" @click="item.command()">
                    <component :title="showTitle ? item.name : ''" class="side-bar-item-icon" :is="item.icon" fillColor="currentColor" />
                    <p class="side-bar-item-name">{{ item.name }}</p>
                </div>
            </div>
        </div>
        <div style="flex-grow: 1;"></div>
        <div class="side-bar-items-container">
            <div class="side-bar-item-container" v-for="item in sideBarActions">
                <div class="side-bar-item" @click="item.command()">
                    <component :title="showTitle ? item.name : ''" class="side-bar-item-icon" :is="item.icon" fillColor="currentColor" />
                    <p class="side-bar-item-name">{{ item.name }}</p>
                </div>
            </div>
        </div>

    </div>
</template>


<style scoped>
#side-bar-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: fit-content;
    padding: 2rem 1rem;
    border-right: 2px solid rgba(0, 0, 0, 0.1);
    border-bottom-right-radius: 0.75rem;
    border-top-right-radius: 0.75rem;
    height: 100vh;
    background-color: var(--color-background);
}

i {
    font-size: 1.5rem;
    border-radius: 100%;
    padding: 0.25rem;
    color: var(--color-muted-foreground);
    color: white;
    background-color: #aaa;
}

#side-bar-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-bottom: 2rem;
    border-bottom: var(--color-muted) solid 2px;
    position: relative;
}

#side-bar-name-title>* {
    margin: 0;
    padding: 0;
    font-weight: 600;
}

#side-bar-title {
    color: var(--color-muted-foreground);
    font-size: 0.75rem;
    letter-spacing: 0.4px;
    text-transform: uppercase;
}

#side-bar-name {
    font-size: 1.25rem;
}

#side-bar-avatar>img {
    width: 2rem;
    height: 2rem;
    border-radius: 100%;
    box-shadow: rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px;
}

.side-bar-items-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.side-bar-item {
    display: flex;
    justify-content: start;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    width: 100%;
    padding: 0.5rem;
    border-radius: 0.5rem;
    color: var(--color-muted-foreground);
    font-weight: 500;

}

.side-bar-item:hover {
    background-color: var(--color-popover);
    color: var(--color-popover-foreground);
}

.selected_item {
    background-color: var(--color-popover);
    color: var(--color-popover-foreground);
}

.side-bar-item-icon {
    width: 1rem;
    color: inherit;
}

.side-bar-item-name {
    margin: 0;
    padding: 0;
}

@media (max-width : 768px) {
    #side-bar-name-title {
        display: none;
    }

    .side-bar-item-name {
        display: none;
    }
}
</style>