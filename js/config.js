// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8DE4F6mU9oyRw8cLU5vcfxOp5RxLcgHA",
  authDomain: "ghostbusters-ar-game.firebaseapp.com",
  databaseURL: "https://ghostbusters-ar-game-default-rtdb.firebaseio.com",
  projectId: "ghostbusters-ar-game",
  storageBucket: "ghostbusters-ar-game.firebasestorage.app",
  messagingSenderId: "4705887791",
  appId: "1:4705887791:web:67af874ce318dcc2be08da"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Game Configuration
const GAME_CONFIG = {
    // Test location - Florianópolis, SC
    testLocation: {
        lat: -27.63979808217616,
        lng: -48.66775914489331,
        radius: 100, // meters
        name: "Local Teste - Florianópolis, SC",
        description: "Raio: 100 metros"
    },
    
    // Game settings
    inventory: {
        initialSlots: 10,
        bonusSlots: 5,
        bonusThreshold: 20
    },
    
    capture: {
        duration: 5000, // 5 seconds
        checkInterval: 100 // Check every 100ms
    },
    
    ghosts: {
        spawnRadius: 100, // meters
        minDistance: 5, // minimum distance between ghosts
        maxGhosts: 5, // maximum ghosts at once
        respawnTime: 30000 // 30 seconds
    },
    
    // Easter eggs
    easterEggs: {
        ecto1: {
            threshold: 5, // ghosts deposited
            position: { x: 0, y: 0, z: -10 }
        },
        slimer: {
            threshold: 10, // ghosts deposited
            bonusMultiplier: 2
        }
    },
    
    // Audio settings
    audio: {
        enabled: true,
        volume: 0.7
    },
    
    // AR settings
    ar: {
        maxDistance: 50, // maximum rendering distance
        ghostScale: 1.0,
        animationSpeed: 1.0
    }
};

// Game state
let gameState = {
    currentUser: null,
    currentLocation: null,
    userPosition: null,
    inventory: [],
    points: 0,
    level: 1,
    ghostsDeposited: 0,
    isInRange: true,
    isCapturing: false,
    currentGhosts: [],
    soundEnabled: true,
    notificationsEnabled: true
};

// QR Codes for Containment Units
const QR_CODES = {
    florianopolis: {
        code: "CONTAINMENT_UNIT_FLORIPA_001",
        position: {
            lat: -27.63979808217616,
            lng: -48.66775914489331
        }
    }
};

// Audio files
const AUDIO_FILES = {
    protonBeam: 'assets/audio/proton-beam.mp3',
    inventoryFull: 'assets/audio/inventory_full.mp3',
    outsideRadius: 'assets/audio/outside_radius.mp3'
};

// Utility functions
const utils = {
    // Calculate distance between two coordinates using Haversine formula
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distance in meters
    },

    // Calculate bearing between two coordinates
    calculateBearing(lat1, lon1, lat2, lon2) {
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ) - 
                Math.sin(φ1) * Math.cos(φ2);

        const θ = Math.atan2(y, x);
        return (θ * 180/Math.PI + 360) % 360; // Bearing in degrees
    },

    // Generate random position within radius
    generateRandomPosition(centerLat, centerLng, radiusMeters) {
        const r = radiusMeters / 111300; // Convert meters to degrees (approximately)
        const y0 = centerLat;
        const x0 = centerLng;
        const u = Math.random();
        const v = Math.random();
        const w = r * Math.sqrt(u);
        const t = 2 * Math.PI * v;
        const x = w * Math.cos(t);
        const y1 = w * Math.sin(t);
        const x1 = x / Math.cos(y0);

        return {
            lat: y0 + y1,
            lng: x0 + x1
        };
    },

    // Format distance for display
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        } else {
            return `${(meters / 1000).toFixed(1)}km`;
        }
    },

    // Play audio with volume control
    playAudio(audioFile, volume = null) {
        if (!gameState.soundEnabled) return;
        
        const audio = new Audio(audioFile);
        audio.volume = volume || GAME_CONFIG.audio.volume;
        audio.play().catch(console.error);
    },

    // Save game state to localStorage
    saveGameState() {
        try {
            localStorage.setItem('ghostbusters-ar-state', JSON.stringify({
                inventory: gameState.inventory,
                points: gameState.points,
                level: gameState.level,
                ghostsDeposited: gameState.ghostsDeposited,
                soundEnabled: gameState.soundEnabled,
                notificationsEnabled: gameState.notificationsEnabled
            }));
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    },

    // Load game state from localStorage
    loadGameState() {
        try {
            const saved = localStorage.getItem('ghostbusters-ar-state');
            if (saved) {
                const state = JSON.parse(saved);
                gameState.inventory = state.inventory || [];
                gameState.points = state.points || 0;
                gameState.level = state.level || 1;
                gameState.ghostsDeposited = state.ghostsDeposited || 0;
                gameState.soundEnabled = state.soundEnabled !== false;
                gameState.notificationsEnabled = state.notificationsEnabled !== false;
            }
        } catch (error) {
            console.error('Error loading game state:', error);
        }
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Show toast notification
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : '#0088ff'};
            color: ${type === 'success' ? '#000' : '#fff'};
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: toastSlide 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlide 0.3s ease reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
};

// Add toast animation CSS
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    @keyframes toastSlide {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
`;
document.head.appendChild(toastStyle);