<script setup lang="ts">
import "primeicons/primeicons.css";
import { RouterView } from "vue-router";
import { ConfirmDialog } from "primevue";
</script>

<template>
  <div id="app">
    <ConfirmDialog />
    <RouterView />
  </div>
</template>

<style>
* {
  margin: 0;
}
i {
  position: relative;
}
html,
body {
  margin: 0;
  padding: 0;
  font-family: Inter;
  background-color: #fcfcfc;
}

.p-password,
.p-password-input {
  width: 100%;
}

@media (max-width: 786px) {
  :root {
    font-size: 14px;
  }
}
@media (max-width: 425px) {
  :root {
    font-size: 12px;
  }
}
</style>
