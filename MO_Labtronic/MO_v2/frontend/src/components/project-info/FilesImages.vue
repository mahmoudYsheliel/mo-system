<script setup lang="ts">
import { useRoute } from 'vue-router';
import { getFileLink } from '@/lib/helperFunctions';
import { downloadFile } from '@/services/downloadServices';
import Galleria from 'primevue/galleria';
import { ref, watch } from 'vue';
import Button from 'primevue/button';



const props = defineProps(['assemblyPics', 'assemblyfiles', 'projectFiles'])
const route = useRoute()
const projectId = route.params.id as string
const images = ref<string[]>([])

function getProjectFileLink(fileName: string) {
    return getFileLink('Projects_T', projectId, fileName)
}
function downloadProjectFile(fileName: string) {
    downloadFile('Projects_T', projectId, fileName)
}
function fileNameDivider(fileName: string) {
    const nameSections = fileName.split('.')
    return {
        name: nameSections[0],
        extension: nameSections[nameSections.length - 1]
    }
}
watch(props, () => {
    images.value = props.assemblyPics?.map((ap: string) => {
        return {
            src: getProjectFileLink(ap),
            alt: "Image Not Found"
        }
    })
})

function openFile(fileName: string) {
    const fileLink = getFileLink('Projects_T', projectId, fileName)
    window.open(fileLink, '_blank')
}

const responsiveOptions = ref([
    {
        breakpoint: '1300px',
        numVisible: 4
    },
    {
        breakpoint: '575px',
        numVisible: 1
    }
]);



















</script>

<template>
    <div id="files-notes-container">
        <h2 id="files-notes-title">Project Files</h2>

        <div id="files-notes-wrapper">

            <div style="grid-area: galaria;" class="project-images">
                <h3 id="files-notes-title">Project Images</h3>
                <Galleria :value="images" :numVisible="4" circular :autoPlay="true" :transitionInterval="2000" :showThumbnails="false" :showItemNavigators="true">
                    <template #item="slotProps">
                        <div class="image-container">
                            <img :src="slotProps.item.src" :alt="slotProps.item.alt" style="width: 100%;" />

                        </div>
                    </template>
                    <template #thumbnail="slotProps">
                        <img :src="slotProps.item.src" :alt="slotProps.item.alt" style="width: 80%;" />
                    </template>
                </Galleria>
            </div>

            <div style="grid-area: assemFiles;">
                <h3 id="files-notes-title">Project Assembly Files</h3>
                <div class="files-container">
                    <div class="file-container" v-for="file in assemblyfiles" :key="file">
                        <div class="info-line">
                            <p>Name:</p>
                            <p>{{ fileNameDivider(file).name }}</p>
                        </div>
                        <div class="info-line">
                            <p>File Type:</p>
                            <p>{{ fileNameDivider(file).extension }}</p>
                        </div>
                        <div class="actions-constainer">
                            <Button icon="pi pi-download" label="Download" @click="downloadProjectFile(file)" />
                            <Button icon="pi pi-eye" label="Perview" @click="openFile(file)" />
                        </div>
                    </div>
                </div>
            </div>
            <div style="grid-area: projFiles;">
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
                        <div class="actions-constainer">
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    grid-template-areas:
        "galaria assemFiles"
        "projFiles projFiles";
}


.image-container {
    height: 20rem;
    overflow: hidden;
}

.image-container img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    /* image fits inside container */
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
    padding: 1rem;
}

.file-container {
    padding: 1rem;
    width: fit-content;
    max-width: 40rem;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    box-shadow: 0 0.125rem 0.125rem 0 rgba(0, 0, 0, 0.25);
    border-radius: 0.5rem 1rem 0.5rem 1rem;
}

.actions-constainer {
    width: 100%;
    display: flex;
    justify-content: end;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.actions-constainer>button {
    font-size: 0.75rem;
}

@media screen and (max-width:1200px) {
    #files-notes-wrapper {
        grid-template-columns: 1fr;
        grid-template-areas:
            "galaria"
            "assemFiles"
            "projFiles";
    }

    .files-container {
        padding-block: 0px;
    }
    .file-container{
        width: 100%;
    }
}
</style>