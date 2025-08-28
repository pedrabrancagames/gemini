// Service Worker for Ghostbusters AR
const CACHE_NAME = 'ghostbusters-ar-v1.0.0';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './manifest.json',
    './favicon.ico',
    
    // JavaScript files
    './js/config.js',
    './js/auth.js',
    './js/app.js',
    './js/location.js',
    './js/game.js',
    './js/ar.js',
    './js/inventory.js',
    './js/qr-scanner.js',
    
    // Assets
    './assets/images/logo.png',
    './assets/images/proton_pack.png',
    './assets/images/ghost_trap.png',
    './assets/images/pke_meter.png',
    './assets/models/ghost.glb',
    './assets/audio/proton-beam.mp3',
    './assets/audio/inventory_full.mp3',
    './assets/audio/outside_radius.mp3'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Install');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('❌ Service Worker: Cache failed', error);
            })
    );
    
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Activate');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Claim control of all clients
    self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip Firebase requests - these need to be online
    if (event.request.url.includes('firebase') || 
        event.request.url.includes('firebaseio.com') ||
        event.request.url.includes('googleapis.com')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }
                
                // Clone the request
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then(
                    (response) => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        // Cache the fetched resource
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    }
                ).catch(() => {
                    // Return offline page for HTML requests
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('🔄 Service Worker: Background sync');
        event.waitUntil(syncGameData());
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    console.log('📬 Service Worker: Push received');
    
    const options = {
        body: 'Novos fantasmas foram avistados na sua região!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Caçar Agora',
                icon: '/assets/images/proton_pack.png'
            },
            {
                action: 'close',
                title: 'Depois',
                icon: '/assets/images/ghost_trap.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Ghostbusters AR', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        // Open the app and navigate to game
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SYNC_GAME_DATA') {
        console.log('💾 Service Worker: Sync game data requested');
        syncGameData();
    }
});

// Sync game data function
async function syncGameData() {
    try {
        // Get stored game data
        const gameData = await getStoredGameData();
        
        if (gameData && gameData.pendingSync) {
            // Send data to Firebase when online
            const response = await fetch('/api/sync-game-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gameData)
            });
            
            if (response.ok) {
                // Clear pending sync flag
                await clearPendingSyncData();
                console.log('✅ Service Worker: Game data synced');
            }
        }
    } catch (error) {
        console.error('❌ Service Worker: Sync failed', error);
    }
}

// Helper function to get stored game data
function getStoredGameData() {
    return new Promise((resolve) => {
        // This would interact with IndexedDB to get pending sync data
        // For now, just resolve with null
        resolve(null);
    });
}

// Helper function to clear pending sync data
function clearPendingSyncData() {
    return new Promise((resolve) => {
        // This would clear the pending sync flag in IndexedDB
        resolve();
    });
}

// Error handling
self.addEventListener('error', (event) => {
    console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Service Worker unhandled rejection:', event.reason);
});