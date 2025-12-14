// Application ID
// 1449758811824062476
// Public Key
// 33354089191de1ba54d8bafcdd52bb0c6bf7770cb95df9c80804485a74fe827b




// In service-worker.js
// self.addEventListener("push", (event) => {
//   const data = event.data.json();
//   const title = data.title || "New Notification";
//   const options = {
//     body: data.body,
//     icon: data.icon,
//     data: data.customData, // Optional: custom data to be accessed on click
//   };

//   event.waitUntil(self.registration.showNotification(title, options));
// });

// self.addEventListener("notificationclick", (event) => {
//   console.log("Notification clicked:", event.notification);
//   event.notification.close();
//   // Handle notification click, e.g., open a URL
//   event.waitUntil(clients.openWindow("http://localhost:5173/"));
// });

self.addEventListener("install", (event) => {
  //  console.log("install");
  // while (true) {
  //   const data = {};
  //   const title = data.title || "New Notification install";
  //   const options = {
  //     body: data.body,
  //     icon: data.icon,
  //     data: data.customData, // Optional: custom data to be accessed on click
  //   };
  //   await new Promise(resolve=>{setTimeout(()=>{resolve()},5000)})
  //   console.log(55)
  //   event.waitUntil(self.registration.showNotification(title, options));
  // }
  console.log("install");
  setInterval(() => {
    console.log('entered')
    const data = {};
    const title = data.title || "New Notification install";
    const options = {
      body: data.body,
      icon: data.icon,
      data: data.customData, // Optional: custom data to be accessed on click
    };
      event.waitUntil(self.registration.showNotification(title, options));
  }, 1000 * 5);
});

// self.addEventListener("sync", (event) => {
//   console.log("sync");
//   setInterval(() => {
//     const data = {};
//     const title = data.title || "New Notification sync";
//     const options = {
//       body: data.body,
//       icon: data.icon,
//       data: data.customData, // Optional: custom data to be accessed on click
//     };
//   }, 1000 * 5);
//   event.waitUntil(self.registration.showNotification(title, options));
// });

// self.addEventListener("activate", (event) => {
//   console.log("activate");
//   setInterval(() => {
//     const data = {};
//     const title = data.title || "New Notification activate";
//     const options = {
//       body: data.body,
//       icon: data.icon,
//       data: data.customData, // Optional: custom data to be accessed on click
//     };
//   }, 1000 * 5);
//   event.waitUntil(self.registration.showNotification(title, options));
// });

// self.addEventListener("periodicsync", (event) => {
//   if (event.tag === "poll-api") {
//     event.waitUntil(pollServer());
//   }
// });

// async function pollServer() {
//   console.log(1);
//   // store in IndexedDB or show notification
// }
