<script lang="ts" setup>
import { ref, watch } from 'vue';
import { InputText, Menu } from 'primevue';
import 'primeicons/primeicons.css'
import type { ExpandedNote } from '@/services/apis/mo.service';
import { deleteNote, updateNote, addNote } from '@/services/apis/note.service';
import { Toast, useToast } from 'primevue';
import { getUser } from '@/services/user.service';
import type { NoteModel } from '@/models/note.model';
import { getDate, getTime } from '@/lib/helper-functions';


const props = defineProps<{ notes?: ExpandedNote[], moId?: string, projectId?: string }>()
const emits = defineEmits(['noteSent'])
const noteInput = ref('')
const toast = useToast()

const editedNote = ref<NoteModel | undefined>()
const menus = ref<any[]>([])
const currentUserId = getUser()?.id

function menuItems(note: ExpandedNote) {
    return [
        {
            label: 'Edit',
            icon: 'pi pi-pencil',
            class: 'edit',
            command: () => {
                noteInput.value = note?.note || ''
                editedNote.value = note
            }
        },
        {
            label: 'Delete',
            icon: 'pi pi-trash',
            class: 'delete',
            command: () => { if (note.id) delNote(note.id) }
        }
    ]
}

function showMenu(event: MouseEvent, index: number) {
    menus.value[index]?.toggle(event)
}

async function delNote(noteId: string) {
    const noteRes = await deleteNote(noteId)
    if (noteRes.success) {
        toast.add({
            severity: 'success',
            summary: 'Message Deleted',
            detail: 'Your message has been deleted successfully',
            life: 3000
        })
        emits('noteSent')
    }
    else {
        toast.add({
            severity: 'error',
            summary: 'Message Deleted Failed',
            detail: 'Failed to delete the message',
            life: 3000
        })
    }

}
function editableNoteOpacity(note: NoteModel) {
    if (editedNote.value?.id === note.id)
        return 0.5
    return 1
}

function sendNote() {
    if (editedNote.value?.id)
        updateNote(editedNote.value?.id, { note: noteInput.value });
    else {
        const note: NoteModel = {
            note: noteInput.value,
            userId:currentUserId,
            projectId: props.projectId,
            moId: props.moId
        }
        addNote(note)
    }
    emits('noteSent', noteInput.value)
    noteInput.value = ''
    editedNote.value = undefined
}

function getNoteClass(note: NoteModel) {
    return note.userId !== currentUserId ? 'note-first-user' : 'note-second-user'
}

</script>


<template>
    <Toast />
    <div id="mo-notes-container">
        <h2 id="mo-notes-title">Notes</h2>
        <div id="mo-notes-wrapper">
            <div class="mo-note" v-for="note, i in notes" :class="getNoteClass(note)"
                :style="{ opacity: editableNoteOpacity(note) }">
                <div class="note-sender-date">
                    <p class="note-sender"> {{ note.expand?.userId?.userName }}</p>
                    <i @click="showMenu($event, i)" style="cursor: pointer;" class="pi pi-angle-down" v-if="currentUserId==note.userId"></i>
                    <Menu :model="menuItems(note)" popup ref="menus">
                        <template #item="{ item }">
                            <div :class="item.class"
                                style="display: flex; gap: 0.5rem;padding: 0.25rem 0.5rem;cursor: pointer;">
                                <i :class="item.icon"></i>
                                <p>{{ item.label }}</p>
                            </div>
                        </template>
                    </Menu>
                </div>
                <p class="note-content">{{ note.note }}</p>
                <p class="note-time" v-if="note.created"> {{ getDate(new Date(note.created)) }} , {{ getTime(new
                    Date(note.created)) }}
                </p>
            </div>
        </div>
        <div id="mo-note-input-container">
            <InputText v-model="noteInput" id="mo-input" />
            <i class="pi pi-send mo-note-send" @click="sendNote()"></i>
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
    color: #122e7c;
    cursor: pointer;
}

.edit {
    color: #2196F3;

}

.delete {
    color: #F44336;
}
</style>