<script lang="ts" setup>
import type { BreadCrumb } from '@/types/breadCrumb';
import  {type PropType } from 'vue'
import { Skeleton } from 'primevue';

const props = defineProps({breadCrumbElements:{type:Array as PropType<BreadCrumb[]>}})

</script>



<template>
    <div class="bread-crumb-container" >
        <Skeleton v-if="!breadCrumbElements?.length"  style="width: 15rem;border-radius: 0.25rem;"/>

        <p class="bread-crumb-element" v-for="e in breadCrumbElements" @click="e.command()">{{ e.name }}</p>
    </div>
</template>



<style scoped>
.bread-crumb-container{
    display: flex;
    gap: 0.25rem;
}
.bread-crumb-element{
    font-weight: 500;
    color: #555555;
}
.bread-crumb-element:hover{
    text-decoration: underline;
    color: #1565C0;
    cursor: pointer;
}
.bread-crumb-element::after{
    content: '>';
    display: inline-block;
    margin-left: 0.25rem;
    color: #BDBDBD;
}
.bread-crumb-element:last-child{
    color: black;
}
.bread-crumb-element:last-child:after{
    content: '';
}
p{
    margin: 0;
}

</style>