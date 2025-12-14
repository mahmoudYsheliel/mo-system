// In service-worker.js
self.addEventListener('push', event => {
    const data = event.data.json();
    const title = data.title || 'New Notification';
    const options = {
        body: data.body || 'You have a new message!',
        icon: data.icon || '/images/icon.png',
        data: data.customData // Optional: custom data to be accessed on click
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event.notification);
    event.notification.close();
    // Handle notification click, e.g., open a URL
    event.waitUntil(
        clients.openWindow('http://localhost:5173/')
    );
});

self.addEventListener("install", (event) => {
    self.skipWaiting(); // immediately move new SW to waiting -> activate
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim()); // take control of all clients immediately
});