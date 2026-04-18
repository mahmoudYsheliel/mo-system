<script setup lang="ts">
import "primeicons/primeicons.css";
import { RouterView } from "vue-router";
import { ConfirmDialog } from "primevue";
import { onMounted } from "vue";
import type { PushalertOnSuccessModel } from "./models/pushalert-onsuccess.model";
import { checkSubscriberId } from "./services/apis/account.service";
import { refreshToken, setPushAlertSubscriberId, isTokenValid } from "./services/user.service";
import { getToken } from "./services/user.service";


onMounted(() => {
    const token = getToken()
    if (token && isTokenValid(token)) {
        refreshToken()
    }
    if (!(window as any).pushalertbyiw) { console.log('no web push'); return }
    (window as any).pushalertbyiw.push(['onSuccess', function (result: any) {
        const res = result as PushalertOnSuccessModel
        console.log({ res })
        if (res.success) {
            setPushAlertSubscriberId(res.subscriber_id)
            checkSubscriberId(res.subscriber_id)
        }
    }]);
})



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
    scroll-behavior: smooth;
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
