<script setup lang="ts">
import { createSideBarActions, createSideBarmMinItems } from '@/lib/build-sidebar';
import { type UserType } from '@/types/user';
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router';
import { getUser } from '@/services/user.service';
import 'primeicons/primeicons.css'
import { getFileLink } from '@/lib/helper-functions';

const router = useRouter()
const sideBarmMinItems = createSideBarmMinItems(router)
const sideBarActions = createSideBarActions(router)
const showTitle = ref(false)
const name = ref("")
const title = ref("")
const img = ref("")
const user = getUser()
function update() {
    showTitle.value = window.innerWidth < 800
}


function getAvatar() {
    if (!user) return 
    return getFileLink(user.collectionId, user.id, user.avatar) || ""
}

onMounted(() => {
    update()
    window.addEventListener('resize', update)
    name.value = user?.userName || ""
    const roles = user?.roles
    title.value = (roles && roles[0]) ? roles[0] :  ""
    img.value = user?.avatar || ""
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
    background-color: white;
}

i {
    font-size: 1.5rem;
    border-radius: 100%;
    padding: 0.25rem;
    color: #757575;
    color: white;
    background-color: #aaa;
}

#side-bar-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-bottom: 2rem;
    border-bottom: #f5f5f5 solid 2px;
    position: relative;
}

#side-bar-name-title>* {
    margin: 0;
    padding: 0;
    font-weight: 600;
}

#side-bar-title {
    color: #757575;
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
    color: #757575;
    font-weight: 500;

}

.side-bar-item:hover {
    background-color: #f6f6f6;
    color:black;
}

.selected_item {
    background-color: #f6f6f6;
    color:black;
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