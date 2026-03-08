<script lang="ts" setup>
import { ref, shallowRef } from "vue";
import { Menu } from "primevue";
import { getProfileOptions } from "@/lib/build-profile-options";
import { useRouter } from "vue-router";
const router = useRouter()



const userMenu = ref()

const toggleUser = (event: MouseEvent) => {
    userMenu.value.toggle(event);
};

const userActions = shallowRef(getProfileOptions(router))
</script>


<template>
    <i class="pi pi-user" @click="toggleUser" aria-haspopup="true" aria-controls="overlay_menu"></i>
    <Menu ref="userMenu" :model="userActions" popup class="menu-icon ">
        <template #item="{ item, props }">
            <div class="menu-element" @click="item.userCommand()">
                <component :style="{ fill: item.fill }" :is="item.iconComp" style="width: 1.5rem;" />
                <p>{{ item.label }}</p>
            </div>

        </template>
    </Menu>
</template>


<style scoped>
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
.menu-icon {
    max-height: 20rem;
    overflow-y: auto;
    max-width: 20rem;
    -ms-overflow-style: none;
    scrollbar-width: none;
}
.menu-element {
    display: flex;
    color: #334155;
    gap: 0.5rem;
    font-size: 1.125rem;
    font-weight: 500;
    padding: 0.5rem;
    cursor: pointer;
}

</style>