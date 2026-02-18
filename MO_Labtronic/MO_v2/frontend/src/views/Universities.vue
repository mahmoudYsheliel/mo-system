<script setup lang="ts">
import SideBar from '@/components/general/SideBar.vue';
import NavigationBar from '@/components/general/NavigationBar.vue';
import { useRouter } from 'vue-router';
import { onMounted, ref, watch, computed, TransitionGroup } from 'vue';
import { apiHandle } from '@/services/apiService';
import { InputText } from 'primevue';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { Searcher } from 'fast-fuzzy';
import Button from 'primevue/button';
import { syncDB } from '@/services/sqlService';
import NewUniDialog from '@/components/dialogs/NewUniDialog.vue';
import UniCard from '@/components/university/UniCard.vue';

const router = useRouter()
const unis = ref<any[]>([])


const showDialog = ref(false)

onMounted(async () => {
    const uniPromise = apiHandle('/api/collections/Uni_View/records', 'GET', true,)

    const [uniRes] = await Promise.all([

        uniPromise,
    ]);
    if (!(uniRes && uniRes.success))
        return
    unis.value = uniRes.data.items as any[]
})
const search = ref('')

const results = computed(() => {
    if (search.value.trim() === '')
        return unis.value
    const searcher = new Searcher(
        unis.value,
        {
            keySelector: (obj) => Object.values(obj).join(' ').toLowerCase(),
            threshold: 0.8
        },
    );
    return searcher.search(search.value)
})



</script>

<template>
    <div id="uni-container">
        <NewUniDialog v-model:visible="showDialog" />
        <SideBar selectedPage="Universities" />
        <div id="uni-main-container">
            <NavigationBar pageName="Universities" />
            <div class="new-uni-action-container">
                <IconField style="width:clamp(12rem,60%,40rem) ;">
                    <InputIcon class="pi pi-search" />
                    <InputText style="width:100%" v-model="search" placeholder="Search" />
                </IconField>
                <Button @click="showDialog = true" label="New University" icon="pi pi-plus" style="width: 12rem;" />
            </div>
            <TransitionGroup class="uni-cards-container" tag="div" name="list">
                <UniCard v-for="uni, i in results" :key="i" :uni="uni" />

            </TransitionGroup>

            <div style="position: absolute; bottom: 2rem; right:2rem">
                <Button @click="syncDB" label="Sync DB" />
            </div>
        </div>
    </div>
</template>


<style scoped>
#uni-container {
    display: grid;
    grid-template-columns: max-content auto;
}

#uni-main-container {
    padding-inline: 2rem;
    max-height: 100vh;
    overflow: auto;
}

.new-uni-action-container {
    margin-block: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}

.uni-cards-container {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;

}

.list-enter-active,
.list-leave-active {
    transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}

@media screen and (max-width:1100px) {
    .uni-cards-container {
        justify-content: center;
    }
}
</style>