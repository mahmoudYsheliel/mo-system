<script setup lang="ts">
import { partDataIcon } from "@/constants/partIconMap";
import StatusMenue from "./StatusMenue.vue";
import { computed, ref } from "vue";
import type { PartData } from "@/types/part";
import "primeicons/primeicons.css";
import { getFileLink } from "@/lib/helperFunctions";
import Image from 'primevue/image';

function getImage() {
  return (
    getFileLink("Parts_T", props?.part?.id, organizedPart.value.Image) || ""
  );
}

const props = defineProps({
  part: { default: null, type: Object },
  selectedColor: { default: null, type: String },
  selectedMaterial: { default: null, type: String },
  selectedProcess: { default: null, type: String },
});

const emits = defineEmits(["newPartStatus"]);
const organizedPart = computed(() => {
  if (!props.part) return {};
  const pp = props.part;
  const Processes = pp.processes;
  return {
    Code: pp.P_Code,
    Name: pp.P_Name,
    Quantity: pp.P_Quantity,
    Material: pp.P_Material,
    Thickness: pp.P_Thickness,
    Color: pp.P_Color,
    Image: pp.P_Pic,
    Processes,
  };
});

const partsInfoTypes: PartData[] = [
  "Code",
  "Quantity",
  "Material",
  "Thickness",
  "Color",
];
const dataObject = partsInfoTypes.map((t) => {
  return { type: t, com: partDataIcon[t], val: organizedPart.value[t] };
});

function checkVisibility() {
  const op = organizedPart.value;
  const com = {
    sm: props.selectedMaterial,
    sc: props.selectedColor,
    sp: props.selectedProcess,
  };
  if (!com.sc && !com.sm && !com.sp) return true;

  const con1 = com.sc && com.sc == op.Color;
  const con2 =
    com.sm &&
    op.Material == com.sm.split("-")[0] &&
    op.Thickness === com.sm.split("-")[1];

  const con3 = com.sp && Object.keys(op.Processes).includes(com.sp);

  return con1 || con2 || con3;
}
</script>

<template>
  <div class="part-container" v-if="checkVisibility()">
    <h3 class="part-name">{{ organizedPart.Name }}</h3>
    <div class="part-info-wrapper" v-for="data in dataObject">
      <div class="part-info-type">
        <component style="width: 1rem" :is="data.com" />
        <p class="info-type">{{ data.type }}:</p>
      </div>
      <p class="part-info-value">
        {{ data.val }} {{ data.type == "Thickness" ? "mm" : null }}
      </p>
    </div>
    <p class="peocess-text">Process</p>
    <div class="process-container">
      <div
        class="process-name-status"
        v-for="(status, name) in organizedPart.Processes"
        :key="name"
      >
        <p class="process-name">{{ name }}</p>
        <StatusMenue
          @newStatus="
            (ns) => {
              organizedPart.Processes[name] = ns;
              $emit('newPartStatus', organizedPart.Processes);
            }
          "
          :statusProp="status"
        />
      </div>
    </div>
    <div class="part-img">
      <Image :src="getImage()" alt="Image" preview width="100%" height="100%" />
    </div>
  </div>
</template>

<style scoped>
.part-container {
  box-shadow: 0 0.125rem 0.25rem 0 rgba(0, 0, 0, 0.25);
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  height: 100%;
}

.part-name {
  text-align: center;
  opacity: 0.75;
  margin-bottom: 1rem;
  border-bottom: solid 1px #bdbdbd;
}

.part-info-wrapper {
  display: grid;
  grid-template-columns: 10rem 10rem;
}

.part-info-type {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: #444;
  fill: #444;
}

.part-info-value {
  font-weight: 500;
  color: #2c2c2c;
}

.part-img {
  width: 8rem;
  aspect-ratio: 1/1;
  display: block;
  margin-inline: auto;
  display: flex;
  justify-content: center;
}
.peocess-text {
  margin-block: 0.5rem 0.25rem;
  color: #444;
}
.process-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.process-name-status {
  display: grid;
  grid-template-columns: 9rem 9rem;
  align-items: center;
  margin-bottom: 0.25rem;
}
</style>
