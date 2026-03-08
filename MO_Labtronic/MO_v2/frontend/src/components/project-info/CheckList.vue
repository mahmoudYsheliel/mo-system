<script lang="ts" setup>
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import { computed, ref, watch } from 'vue';
import { Toast,useToast } from 'primevue';
import { type ProjectCheckListModel } from '@/models/project-check-list.model';
import { batchUpdateCheckList } from '@/services/apis/project-checklist.service';
const toast = useToast()

const items = ref<ProjectCheckListModel[]>([])
const originalState = ref('')
const props = defineProps<{ checkList?: ProjectCheckListModel[]; }>();

watch(props, () => {
    items.value = props.checkList || []
    originalState.value = JSON.stringify(props.checkList)
})


const hasChanges = computed(() => {
    if (!originalState.value || !items.value) return false
    return JSON.stringify(items.value) !== originalState.value;
});

async function updateCheckList() {

    const res = await batchUpdateCheckList(items.value)
    
    if(res.success){
        toast.add( {
            severity: 'success',
            summary: 'Updates',
            detail: 'Check list was successfully',
            life:3000
        })
        originalState.value = JSON.stringify(items.value)
    }
}


</script>

<template>
    <Toast />
    <div id="checklist-notes-container">
        <h2 id="checklist-notes-title">Check List</h2>
        <div id="checklist-notes-wrapper">
            <div class="checklist-item" v-for="item, i in items" :key="i">
                <Checkbox v-model="item.isDone" :inputId="'item' + i" binary />
                <label :for="'item' + i"> {{ item.item }} </label>
            </div>

        </div>
        <div class="checklist-btn-container">
            <Button v-if="hasChanges" label="Update Check List" @click="updateCheckList" />
        </div>
    </div>

</template>


<style scoped>
#checklist-notes-container {
    padding: 1.5rem;
    box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    background-color: white;
    border-radius: 0.25rem;
}

#checklist-notes-title {
    opacity: 0.75;
    margin-bottom: 1rem;
    text-align: center;
}

#checklist-notes-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.checklist-item {
    cursor: pointer;
    display: flex;
    gap: 0.5rem;
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
}

.checklist-btn-container {
    display: flex;
    justify-content: end;
}
button{
    font-size: 0.75rem;
}
</style>