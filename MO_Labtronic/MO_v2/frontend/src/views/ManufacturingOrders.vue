<script setup lang="ts">
import SideBar from '@/components/general/SideBar.vue';
import NavigationBar from '@/components/general/NavigationBar.vue';


</script>

<template>
    <div id="mo-container">
        <SideBar selectedPage="Manufacturing Orders" />
        <div id="mo-main-container">
            <NavigationBar pageName="Manufacturing Orders" />
            
        </div>
    </div>
</template>


<style scoped>
#mo-container{
    display: grid;
    grid-template-columns:  max-content auto;

}
#mo-main-container{
    padding-inline: 1rem;
    max-height: 100vh;
    overflow: auto;

}

</style>