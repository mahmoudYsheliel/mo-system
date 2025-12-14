<script setup lang="ts">
import Menu from "primevue/menu";
import { ref,onMounted,watch } from "vue";
import { processColorsMap } from "@/constants/colors";
import { processMenueOptions } from "@/constants/processMenuOptions";
import type { ProcessStatus } from "@/types/process";


const props = defineProps(["statusProp"]);
const emits= defineEmits(["newStatus"]);
const status = ref()
const menu = ref();
const menueOptions = ref(processMenueOptions())
const toggle = (event: Event) => {
  menu.value.toggle(event);
};
onMounted(()=>{
    status.value = props.statusProp
})
watch(props,()=>{
    status.value = props.statusProp
})

</script>

<template>
  <div
    class="process-status-constainer"
    @click="toggle($event)"
    :style="{background:processColorsMap[status as ProcessStatus]}"
  >
    <p class="process-status">{{ status }}</p>
    <i
      type="button"
      class="pi pi-chevron-down"
      aria-haspopup="true"
      aria-controls="overlay_menu"
    />
    <Menu ref="menu" id="overlay_menu" :model="menueOptions" :popup="true">
      <template #item="{ item, props }">
        <p
          @click="$emit('newStatus', item.label);status=item.label"
          :style="{background:processColorsMap[item.label as ProcessStatus]}"
          class="menue-item"
        >
          {{ item.label }}
        </p>
      </template>
    </Menu>
  </div>
</template>

<style scoped>
.process-status-constainer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 8rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.5rem;
  color: white;
}

.process-status {
  padding: 0.125rem 0.5rem;
}
.menue-item {
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
}
</style>
