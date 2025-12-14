<script lang="ts" setup>
import { useApiHandler } from '@/services/apiService';
import { onMounted, ref, watch, type PropType } from 'vue';
import { InputText, Menu } from 'primevue';
import 'primeicons/primeicons.css'
import type { Note,FetchedNote } from '@/types/note';
import { mapFetchedNotestoNotes,mapNotesToFetchedNoted } from '@/lib/mapNote';
import { useAuth } from '@/stores/auth';
import { useRoute } from 'vue-router';
import { postEvent } from '@/utils/mediator';
import useUsersNames from '@/stores/usersNames';


const route = useRoute()
const preparedNotes = ref<Note[]>([])
const props = defineProps({ fetchedNotes: { type: Array as PropType<FetchedNote[]> } })
const auth = useAuth()
const noteInput = ref('')
const userNamesStore = useUsersNames()
const users = ref<any[]>([])
userNamesStore.getUsers().then(res => {
    users.value = res || []
})
const editedNoteIndex = ref(-1)
const noteInputRef = ref<HTMLInputElement>()
const menus = ref<any[]>([])

function menuItems(index: number, note: Note | undefined) {
    return [
        {
            label: 'Edit',
            icon: 'pi pi-pencil',
            class: 'edit',
            command: () => { editedNoteIndex.value = index; noteInput.value = note?.content || '' }
        },
        {
            label: 'Delete',
            icon: 'pi pi-trash',
            class: 'delete',
            command: () => { deleteNote(index) }
        }
    ]
}

function showMenu(event: MouseEvent, index: number) {
    menus.value[index]?.toggle(event)
}
const { apiHandle: updateNotesAPIHandle } = useApiHandler()


watch(([props, users]), () => {
    preparedNotes.value = mapFetchedNotestoNotes(props.fetchedNotes, users.value, auth.user.id)
})
watch(editedNoteIndex, val => {
    if (val > -1) noteInputRef.value?.focus
})

async function sendNote() {
    const d = new Date()
    const fetchedNotes = mapNotesToFetchedNoted(preparedNotes.value, users.value)
    const newFetchedNote: FetchedNote = { content: noteInput.value, created: d.toString(), user_id: auth.user.id }
    if (editedNoteIndex.value !== -1) {
        fetchedNotes[editedNoteIndex.value] = newFetchedNote
    }
    else {
        fetchedNotes.push(newFetchedNote)
    }
    await updateNotesAPIHandle(`/api/collections/MO_T/records/${route.params.id}`, 'PATCH', true, undefined, { Notes: JSON.stringify(fetchedNotes) })
    editedNoteIndex.value = -1
    noteInput.value = ''
    preparedNotes.value = mapFetchedNotestoNotes(fetchedNotes, users.value, auth.user?.id)
}


async function deleteNote(index: number) {
    preparedNotes.value = preparedNotes.value.filter((_, i) => { return i !== index })
    const notes = mapNotesToFetchedNoted(preparedNotes.value, users.value)
    await updateNotesAPIHandle(`/api/collections/MO_T/records/${route.params.id}`, 'PATCH', true, undefined, { Notes: JSON.stringify(notes) })
    postEvent('add_toast', {
        severity: 'success',
        summary: 'Message Deleted',
        detail: 'Your message has been deleted successfully',
        life: 3000
    })
}


function editableNoteOpacity(noteIndex: number) {
    if (editedNoteIndex.value !== noteIndex && editedNoteIndex.value !== -1)
        return 0.5
    return 1
}



</script>


<template>
    <div id="mo-notes-container">
        <h2 id="mo-notes-title">Notes</h2>
        <div id="mo-notes-wrapper">

            <div class="mo-note" v-for="note, i in preparedNotes" :class="note.noteClass" :style="{ opacity: editableNoteOpacity(i) }">
                <div class="note-sender-date">
                    <p class="note-sender"> {{ note.sender }}</p>
                    <i @click="showMenu($event, i)" style="cursor: pointer;" class="pi pi-angle-down"></i>
                    <Menu :model="menuItems(i, note)" popup ref="menus">
                        <template #item="{ item }">
                            <div :class="item.class" style="display: flex; gap: 0.5rem;padding: 0.25rem 0.5rem;cursor: pointer;">
                                <i :class="item.icon"></i>
                                <p>{{ item.label }}</p>
                            </div>
                        </template>
                    </Menu>
                </div>
                <p class="note-content">{{ note.content }}</p>
                <p class="note-time"> {{ note.date }} , {{ note.time }}</p>
            </div>
        </div>
        <div id="mo-note-input-container">
            <InputText ref="noteInputRef" v-model="noteInput" id="mo-input" />
            <i class="pi pi-send mo-note-send" @click="sendNote()" ></i>
        </div>
    </div>

</template>

<style scoped>
#mo-notes-container {
    padding: 1.5rem;
    box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    background-color: white;
    border-radius: 0.25rem;
}

#mo-notes-title {
    opacity: 0.75;
    margin-bottom: 1rem;
    text-align: center;
}

#mo-notes-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.mo-note {
    width: fit-content;
    max-width: 75%;
    padding: 0.75rem;
    border-radius: 1rem;
    box-shadow: 0 0.125rem 0.25rem 0 rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    position: relative;
}

.note-sender-date {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.note-sender {
    opacity: 0.5;
    font-weight: bold;
}

.note-date,
.note-time {
    opacity: 0.5;
    font-weight: lighter;
    font-size: 0.625rem;
}

.note-time {
    opacity: 0.5;
    text-align: right;
}

.note-first-user {
    border-bottom-left-radius: 0;
    align-self: flex-start;
    background-color: #FFF7C2;
}

.note-second-user {
    border-bottom-right-radius: 0;
    align-self: flex-end;
    background-color: #B9DFF2;
}

.note-edit-delete-icons-wrapper {
    position: absolute;
    right: 0;
    transform: translateX(100%);
    padding-inline: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.note-edit-delete-icons-wrapper>* {
    cursor: pointer;
}

#mo-note-input-container {
    margin-top: 2rem;
    display: flex;
    gap: 1rem;
    align-items: center;
    position: relative;
}

#mo-input {
    flex-grow: 1;
}

.mo-note-send {
    position: relative;
    font-weight: lighter;
    font-size: 1.25rem;
    color: var(--color-primary);
    cursor: pointer;
}

.edit {
    color: #2196F3;

}

.delete {
    color: #F44336;
}
</style>