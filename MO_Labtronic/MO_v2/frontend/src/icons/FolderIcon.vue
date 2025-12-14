<script setup lang="ts">
defineProps(['fillColor'])
</script>

<template>
    <main class="svg-wrapper">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        preserveAspectRatio="xMidYMid meet"
        class="svg-box"
        :fill="fillColor"
      >
        <rect
          x="1"
          y="1"
          width="22"
          height="22"
          rx="3"
          ry="3"
          stroke="currentColor"
          stroke-width="1.5"
          fill="none"
        />
      </svg>
    </main>
  </template>
  
  <style scoped>
  .svg-wrapper {
    width: 100%;
    height: 100%;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(8px);
  }
  
  /* SVG scales proportionally */
  .svg-box {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  </style>
  