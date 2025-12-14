<script setup lang="ts">

async function register(group: string) {
    if (!navigator.serviceWorker) return
    if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission()
        if (permission != "granted")
            return console.log("permission rejected")
    }

    const registration = navigator.serviceWorker.register("/sw.js")
    console.log(0)
    await navigator.serviceWorker.ready
    const pubicKey = await fetch('http://localhost:3000/vapid_key').then(res => res.text())
    const sub = await (await registration).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pubicKey)
    })
    console.log(sub)

    await fetch("http://localhost:3000/sub", {
        method: "POSt",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group, sub })
    })
}
function urlBase64ToUint8Array(base64:string) {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
    console.log(base64Safe)
    const raw = atob(base64Safe);
    console.log(raw)
    return Uint8Array.from([...raw].map(ch => ch.charCodeAt(0)));
}





function subscribe(group: string) {
    register(group);
}

async function send(group: string) {
    await fetch("http://localhost:3000/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            group,
            title: `Message to ${group}`,
            body: "This is a test notification"
        })
    });
}
</script>


<template>


    <div>
        <h1>Web Push Example</h1>

        <button @click="subscribe('admins')">Subscribe as Admin</button>
        <button @click="subscribe('clients')">Subscribe as Client</button>

        <hr>

        <button @click="send('admins')">Notify Admins</button>
        <button @click="send('clients')">Notify Clients</button>
    </div>

</template>

<style scoped></style>
