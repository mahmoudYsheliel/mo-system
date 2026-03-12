<script setup lang="ts">
import { useRoute } from 'vue-router';
import { getFileLink } from '@/lib/helper-functions';
import { downloadFile } from '@/services/download.service';
import { Image } from 'primevue';
import { ref, watch } from 'vue';
import Button from 'primevue/button';



const props = defineProps<{
    assemblyPics?: string[], assemblyFiles?: string[], projectFiles?: string[]
}>()
const route = useRoute()
const projectId = route.params.id as string
const images = ref<string[]>([])

function getProjectFileLink(fileName: string) {
    return getFileLink('projects', projectId, fileName)
}
function downloadProjectFile(fileName: string) {
    downloadFile('projects', projectId, fileName)
}
function fileNameDivider(fileName: string) {
    const nameSections = fileName.split('.')
    return {
        name: nameSections[0],
        extension: nameSections[nameSections.length - 1]
    }
}
watch(props, () => {
    if (props.assemblyPics) {
        const imagesMap = props.assemblyPics?.map((ap: string) => {
            return getProjectFileLink(ap)
        })
        images.value = imagesMap.filter((imgMap): imgMap is string  =>typeof imgMap === 'string' &&  imgMap.trim() !== "")
    }
})

function openFile(fileName: string) {
    const fileLink = getFileLink('projects', projectId, fileName)
    window.open(fileLink, '_blank')
}


</script>

<template>
    <div id="files-notes-container">
        <h2 id="files-notes-title">Project Files</h2>

        <div id="files-notes-wrapper">

            <div style="grid-area: galleria;" class="project-images" v-show="images.length">
                <h3 id="files-notes-title">Project Images</h3>
                <div class="project-images-container">
                    <Image v-for="image in images" :src="image" preview height="100" />
                </div>
            </div>

            <div style="grid-area: assemblyFiles;" v-show="assemblyFiles?.length">
                <h3 id="files-notes-title">Project Assembly Files</h3>
                <div class="files-container">
                    <div class="file-container" v-for="file in assemblyFiles" :key="file">
                        <div class="info-line">
                            <p>Name:</p>
                            <p>{{ fileNameDivider(file).name }}</p>
                        </div>
                        <div class="info-line">
                            <p>File Type:</p>
                            <p>{{ fileNameDivider(file).extension }}</p>
                        </div>
                        <div class="actions-container">
                            <Button icon="pi pi-download" label="Download" @click="downloadProjectFile(file)" />
                            <Button icon="pi pi-eye" label="Preview" @click="openFile(file)" />
                        </div>
                    </div>
                </div>
            </div>
            <div style="grid-area: projFiles;" v-show="projectFiles?.length">
                <h3 id="files-notes-title">Project Files</h3>
                <div class="files-container">
                    <div class="file-container" v-for="file in projectFiles" :key="file">
                        <div class="info-line">
                            <p>Name:</p>
                            <p>{{ fileNameDivider(file).name }}</p>
                        </div>
                        <div class="info-line">
                            <p>File Type:</p>
                            <p>{{ fileNameDivider(file).extension }}</p>
                        </div>
                        <div class="actions-container">
                            <Button icon="pi pi-download" label="Download" @click="downloadProjectFile(file)" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped>
#files-notes-container {
    padding: 1.5rem;
    box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    background-color: white;
    border-radius: 0.25rem;
}

#files-notes-title {
    opacity: 0.75;
    margin-block: 1rem 0.5rem;
    text-align: center;
}

#files-notes-wrapper {
    gap: 1rem;
    display: flex;
    flex-direction: column;
}

.project-images-container{
    display:  flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}


.info-line {
    display: grid;
    grid-template-columns: 6rem auto;
}

.info-line> :first-child {
    font-weight: 800;
}

.info-line> :last-child {
    min-width: 10ch;
    overflow: hidden;
    text-overflow: ellipsis;
}

.files-container {
    width: 100%;
    display: flex;
    gap: 0.5rem;
}

.file-container {
    padding: 1rem;
    width: 20rem;
    max-width: 40rem;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    box-shadow: 0 0.125rem 0.125rem 0 rgba(0, 0, 0, 0.25);
    border-radius: 0.5rem 1rem 0.5rem 1rem;
}

.actions-container {
    width: 100%;
    display: flex;
    justify-content: end;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.actions-container>button {
    font-size: 0.75rem;
}
</style>