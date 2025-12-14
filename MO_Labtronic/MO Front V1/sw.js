// PushAlert Service Worker
// This file should be placed in the root directory of your website

// PushAlert Integration Code
(function() {
    'use strict';
    
    // PushAlert Configuration
    const PUSHALERT_CONFIG = {
        apiKey: '8adf8eea3e77a71a801a8986cf581ce8',
        endpoint: 'https://cdn.pushalert.co'
    };
    
    // Install event
    self.addEventListener('install', function(event) {
        console.log('PushAlert Service Worker installed');
        self.skipWaiting();
    });
    
    // Activate event
    self.addEventListener('activate', function(event) {
        console.log('PushAlert Service Worker activated');
        event.waitUntil(self.clients.claim());
    });
    
    // Push event handler
    self.addEventListener('push', function(event) {
        console.log('PushAlert: Push event received', event);
        
        let notificationData = {
            title: 'New Notification',
            body: 'You have a new notification',
            icon: 'https://mo.lab-tronic.com/logo.png',
            badge: 'https://mo.lab-tronic.com/logo.png',
            data: {
                url: '/dashboard.html'
            }
        };
        
        // Try to parse push data
        if (event.data) {
            try {
                const pushData = event.data.json();
                notificationData = {
                    title: pushData.title || notificationData.title,
                    body: pushData.body || pushData.message || notificationData.body,
                    icon: pushData.icon || notificationData.icon,
                    badge: pushData.badge || notificationData.badge,
                    data: {
                        url: pushData.url || pushData.Link_To_Action || notificationData.data.url,
                        ...pushData
                    }
                };
            } catch (error) {
                console.error('Error parsing push data:', error);
            }
        }
        
        event.waitUntil(
            self.registration.showNotification(notificationData.title, {
                body: notificationData.body,
                icon: notificationData.icon,
                badge: notificationData.badge,
                data: notificationData.data,
                requireInteraction: true,
                actions: [
                    {
                        action: 'view',
                        title: 'View',
                        icon: notificationData.icon
                    },
                    {
                        action: 'close',
                        title: 'Close'
                    }
                ]
            })
        );
    });
    
    // Notification click handler
    self.addEventListener('notificationclick', function(event) {
        console.log('PushAlert: Notification clicked', event);
        
        event.notification.close();
        
        const notificationData = event.notification.data;
        const urlToOpen = notificationData && notificationData.url
                          ? new URL(notificationData.url, self.location.origin).href
                          : new URL('/dashboard.html', self.location.origin).href;
        
        // Handle action clicks
        if (event.action === 'close') {
            return;
        }
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
                // Check if there's already a window/tab open with the target URL
                for (var i = 0; i < clientList.length; i++) {
                    var client = clientList[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If no window/tab is open, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    });
    
    // Notification close handler
    self.addEventListener('notificationclose', function(event) {
        console.log('PushAlert: Notification closed', event);
    });
    
    // Background sync (if supported)
    if ('sync' in self.registration) {
        self.addEventListener('sync', function(event) {
            console.log('PushAlert: Background sync', event);
        });
    }
    
})(); 