<script setup lang="ts">
import "primeicons/primeicons.css";
import { RouterView } from "vue-router";
import Toast from "./components/general/Toast.vue";
import { ConfirmDialog } from "primevue";
</script>

<template>
  <div id="app">
    <ConfirmDialog />
    <Toast />
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
  background-color: var(--color-card);
}

.p-password,
.p-password-input {
  width: 100%;
}

/* Geist Design System - Light Mode */
:root {
  /* Colors */
  --color-background: #ffffff;
  --color-foreground: #000000;
  --color-card: #fcfcfc;
  --color-card-foreground: #000000;
  --color-popover: #f6f6f6;
  --color-popover-foreground: #000000;
  --color-primary: #122e7c;
  --color-primary-foreground: #ffffff;
  --color-secondary: #ebebeb;
  --color-secondary-foreground: #122e7c;
  --color-muted: #f5f5f5;
  --color-muted-foreground: #757575;
  --color-accent: #ebebeb;
  --color-accent-foreground: #000000;
  --color-destructive: #e54b4f;
  --color-destructive-foreground: #ffffff;
  --color-border: #e4e4e4;
  --color-input: #ebebeb;
  --color-ring: #000000;

  /* Charts */
  --color-chart-1: #ffae04;
  --color-chart-2: #2d62ef;
  --color-chart-3: #a4a4a4;
  --color-chart-4: #e4e4e4;
  --color-chart-5: #747474;

  /* Sidebar */
  --color-sidebar: #fcfcfc;
  --color-sidebar-foreground: #000000;
  --color-sidebar-primary: #000000;
  --color-sidebar-primary-foreground: #ffffff;
  --color-sidebar-accent: #ebebeb;
  --color-sidebar-accent-foreground: #000000;
  --color-sidebar-border: #ebebeb;
  --color-sidebar-ring: #000000;

  /* Typography */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: "Geist Mono", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono",
    Consolas, "Courier New", monospace;

  /* Spacing */
  --radius-base: 0.5rem;
  --radius-sm: calc(0.5rem - 4px);
  --radius-md: calc(0.5rem - 2px);
  --radius-lg: 0.5rem;
  --radius-xl: calc(0.5rem + 4px);

  /* Shadows */
  --shadow-2xs: 0px 1px 2px 0px hsl(0 0% 0% / 0.09);
  --shadow-xs: 0px 1px 2px 0px hsl(0 0% 0% / 0.09);
  --shadow-sm: 0px 1px 2px 0px hsl(0 0% 0% / 0.18),
    0px 1px 2px -1px hsl(0 0% 0% / 0.18);
  --shadow-default: 0px 1px 2px 0px hsl(0 0% 0% / 0.18),
    0px 1px 2px -1px hsl(0 0% 0% / 0.18);
  --shadow-md: 0px 1px 2px 0px hsl(0 0% 0% / 0.18),
    0px 2px 4px -1px hsl(0 0% 0% / 0.18);
  --shadow-lg: 0px 1px 2px 0px hsl(0 0% 0% / 0.18),
    0px 4px 6px -1px hsl(0 0% 0% / 0.18);
  --shadow-xl: 0px 1px 2px 0px hsl(0 0% 0% / 0.18),
    0px 8px 10px -1px hsl(0 0% 0% / 0.18);
  --shadow-2xl: 0px 1px 2px 0px hsl(0 0% 0% / 0.45);
}

/* Dark Mode */
.dark {
  --color-background: #000000;
  --color-foreground: #ffffff;
  --color-card: #090909;
  --color-card-foreground: #ffffff;
  --color-popover: #121212;
  --color-popover-foreground: #ffffff;
  --color-primary: #ffffff;
  --color-primary-foreground: #000000;
  --color-secondary: #222222;
  --color-secondary-foreground: #ffffff;
  --color-muted: #1d1d1d;
  --color-muted-foreground: #a4a4a4;
  --color-accent: #333333;
  --color-accent-foreground: #ffffff;
  --color-destructive: #ff5b5b;
  --color-destructive-foreground: #000000;
  --color-border: #242424;
  --color-input: #333333;
  --color-ring: #a4a4a4;

  --color-chart-1: #ffae04;
  --color-chart-2: #2671f4;
  --color-chart-3: #747474;
  --color-chart-4: #525252;
  --color-chart-5: #e4e4e4;

  --color-sidebar: #121212;
  --color-sidebar-foreground: #ffffff;
  --color-sidebar-primary: #ffffff;
  --color-sidebar-primary-foreground: #000000;
  --color-sidebar-accent: #333333;
  --color-sidebar-accent-foreground: #ffffff;
  --color-sidebar-border: #333333;
  --color-sidebar-ring: #a4a4a4;
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
