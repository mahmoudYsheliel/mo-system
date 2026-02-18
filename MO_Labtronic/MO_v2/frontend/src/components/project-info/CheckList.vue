<script lang="ts" setup>
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import { apiHandle } from '@/services/apiService';
import { postEvent } from '@/utils/mediator';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';


type CheckListItem = {
    label?: string;
    isChecked?: boolean;
};

const items = ref<CheckListItem[]>([])
const originalState = ref('')
const route = useRoute()
const props = defineProps<{ checkListString: string; }>();

watch(props, () => {
    items.value = props['checkListString'].split(',')
        .map(s => s.trim())
        .map(entry => {
            const [label, value] = entry.split(' - ').map(v => v.trim());
            return {
                label,
                isChecked: value?.toLowerCase() === 'true'
            };
        });
    originalState.value = JSON.stringify(items.value)
})


const hasChanges = computed(() => {
    if (!originalState.value || !items.value) return false
    return JSON.stringify(items.value) !== originalState.value;
});

async function updateCheckList() {
    let sentNotes: any[] = []
    for (const note of items.value) {
        sentNotes.push(note.label + ' - ' + String(note.isChecked))
    }
    const res = await apiHandle(`/api/collections/Projects_T/records/${route.params.id}`, 'PATCH', true, '', { CheckList: sentNotes.join(' , ') })

    if(res.success){
        postEvent('add_toast', {
            severity: 'success',
            summary: 'Updates',
            detail: 'Check list was successfully'
        })
        originalState.value = JSON.stringify(items.value)
    }
}


</script>

<template>
    <div id="checklist-notes-container">
        <h2 id="checklist-notes-title">Check List</h2>
        <div id="checklist-notes-wrapper">
            <div class="checklist-item" v-for="item, i in items" :key="i">
                <Checkbox v-model="item.isChecked" :inputId="'item' + i" binary />
                <label :for="'item' + i"> {{ item.label }} </label>
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