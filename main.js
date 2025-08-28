// --- Registro do Service Worker ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('Service Worker registrado com sucesso:', registration);
        }).catch(error => {
            console.log('Falha no registro do Service Worker:', error);
        });
    });
}

// Importar dependências do Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

// --- Constantes e Variáveis Globais ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- Registro do Service Worker ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Usa um caminho relativo para ser compatível com o GitHub Pages
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('Service Worker registrado com sucesso:', registration);
        }).catch(error => {
            console.log('Falha no registro do Service Worker:', error);
        });
    });
}

// Importar dependências do Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

// --- Constantes e Variáveis Globais ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const testLocation = {
    latitude: -27.63979808217616,
    longitude: -48.66775914489331,
    radius: 100 // metros
};
let locationWatchId = null;
let isGhostSpawned = false;

// --- Elementos da UI ---
const googleLoginBtn = document.getElementById('google-login');
const anonLoginBtn = document.getElementById('anon-login');
const startGameBtn = document.getElementById('start-game-btn');
const protonPackUI = document.getElementById('proton-pack');
const beamBtn = document.getElementById('beam-btn');
const pkeMeterUI = document.getElementById('pke-meter');
const messageContainer = document.getElementById('message-container');
const ghostEntity = document.getElementById('ghost-entity');

const logoutBtn = document.createElement('button');
logoutBtn.textContent = 'Logout';
logoutBtn.id = 'logout-btn';
logoutBtn.style.position = 'absolute';
logoutBtn.style.top = '10px';
logoutBtn.style.right = '10px';
document.getElementById('map-screen').appendChild(logoutBtn);

// --- Áudio ---
const outsideRadiusAudio = new Audio('assets/audio/outside_radius.mp3');

// --- Gerenciamento de Estado de Autenticação ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Usuário logado:', user.uid);
        showScreen('map-screen');
        if (!document.getElementById('map')._leaflet_id) {
             initializeMap();
        }
    } else {
        console.log('Nenhum usuário logado.');
        showScreen('login-screen');
    }
});

// --- Listeners de Eventos ---
googleLoginBtn.addEventListener('click', () => signInWithPopup(auth, googleProvider).catch(handleAuthError));
anonLoginBtn.addEventListener('click', () => signInAnonymously(auth).catch(handleAuthError));
startGameBtn.addEventListener('click', requestPermissionsAndStart);
logoutBtn.addEventListener('click', () => signOut(auth));

function handleAuthError(error) {
    console.error("Erro na autenticação:", error);
    alert(`Erro no login: ${error.message}`);
}

// --- Lógica de Permissões e Jogo ---
async function requestPermissionsAndStart() {
    console.log("Solicitando permissões...");
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        console.log("Permissão de câmera concedida.");

        await new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error("Geolocalização não suportada."));
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        console.log("Permissão de GPS concedida.");

        showScreen('ar-screen');
    } catch (error) {
        console.error("Permissão negada.", error);
        alert("Permissão de Câmera e GPS são necessárias para jogar.");
    }
}

function handleLocationUpdate(position) {
    const userCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };

    const distance = haversineDistance(userCoords, testLocation);

    if (distance <= testLocation.radius) {
        // Dentro do raio
        protonPackUI.classList.remove('hidden');
        beamBtn.classList.remove('hidden');
        pkeMeterUI.classList.add('hidden');
        messageContainer.textContent = "Você está na área de caça!";

        if (!isGhostSpawned) {
            spawnGhost(userCoords);
        }

    } else {
        // Fora do raio
        protonPackUI.classList.add('hidden');
        beamBtn.classList.add('hidden');
        pkeMeterUI.classList.remove('hidden');
        messageContainer.textContent = `Você está a ${Math.round(distance)} metros da área de caça. Siga o medidor!`;
        outsideRadiusAudio.play().catch(e => console.log("Áudio bloqueado pelo navegador."));
        
        // Esconde o fantasma se o jogador sair da área
        if(isGhostSpawned) {
            ghostEntity.setAttribute('visible', 'false');
            isGhostSpawned = false; // Permite que o fantasma apareça novamente ao reentrar na área
        }
    }
}

function spawnGhost(userCoords) {
    console.log("Gerando fantasma...");
    const spawnRadius = 10; // Raio de 10m para teste
    const randomDistance = Math.random() * spawnRadius; // Distância aleatória até 10m
    const randomAngle = Math.random() * 360; // Ângulo aleatório

    const ghostPosition = calculateDestinationPoint(userCoords, randomAngle, randomDistance);

    ghostEntity.setAttribute('gps-entity-place', `latitude: ${ghostPosition.latitude}; longitude: ${ghostPosition.longitude};`);
    ghostEntity.setAttribute('visible', 'true');
    isGhostSpawned = true;
    messageContainer.textContent = "Um fantasma apareceu!";
    console.log(`Fantasma gerado em: lat ${ghostPosition.latitude}, lon ${ghostPosition.longitude}`);
}

function locationError(error) {
    console.error("Erro de geolocalização:", error);
    messageContainer.textContent = "Não foi possível obter sua localização.";
}

// --- Funções Auxiliares ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    if (screenId === 'ar-screen') {
        if (!locationWatchId) {
            locationWatchId = navigator.geolocation.watchPosition(handleLocationUpdate, locationError, { enableHighAccuracy: true });
        }
    } else {
        if (locationWatchId) {
            navigator.geolocation.clearWatch(locationWatchId);
            locationWatchId = null;
        }
    }
}

function initializeMap() {
    const map = L.map('map').setView([testLocation.latitude, testLocation.longitude], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    
    // CORREÇÃO: Criar o círculo, adicioná-lo ao mapa e DEPOIS usar seus limites
    const huntingAreaCircle = L.circle([testLocation.latitude, testLocation.longitude], {
        radius: testLocation.radius,
        color: 'yellow',
        fillColor: '#f0ad4e'
    }).addTo(map);

    map.fitBounds(huntingAreaCircle.getBounds());
    
    // Agora esta linha será executada sem erros
    startGameBtn.disabled = false;
}

function haversineDistance(coords1, coords2) {
    const R = 6371e3; // Raio da Terra em metros
    const lat1 = coords1.latitude * Math.PI / 180;
    const lat2 = coords2.latitude * Math.PI / 180;
    const deltaLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
    const deltaLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function calculateDestinationPoint(startPoint, bearing, distance) {
    const R = 6371e3; // Raio da Terra em metros
    const d = distance;

    const lat1 = startPoint.latitude * Math.PI / 180;
    const lon1 = startPoint.longitude * Math.PI / 180;
    const brng = bearing * Math.PI / 180;

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R) + Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));
    const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1), Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2));

    return {
        latitude: lat2 * 180 / Math.PI,
        longitude: (lon2 * 180 / Math.PI + 540) % 360 - 180 // Normaliza para -180 a +180
    };
}

let locationWatchId = null;
let isGhostSpawned = false;

// --- Elementos da UI ---
const googleLoginBtn = document.getElementById('google-login');
const anonLoginBtn = document.getElementById('anon-login');
const startGameBtn = document.getElementById('start-game-btn');
const protonPackUI = document.getElementById('proton-pack');
const beamBtn = document.getElementById('beam-btn');
const pkeMeterUI = document.getElementById('pke-meter');
const messageContainer = document.getElementById('message-container');
const ghostEntity = document.getElementById('ghost-entity');

const logoutBtn = document.createElement('button');
logoutBtn.textContent = 'Logout';
logoutBtn.id = 'logout-btn';
logoutBtn.style.position = 'absolute';
logoutBtn.style.top = '10px';
logoutBtn.style.right = '10px';
document.getElementById('map-screen').appendChild(logoutBtn);

// --- Áudio ---
const outsideRadiusAudio = new Audio('assets/audio/outside_radius.mp3');

// --- Gerenciamento de Estado de Autenticação ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Usuário logado:', user.uid);
        showScreen('map-screen');
        if (!document.getElementById('map')._leaflet_id) {
             initializeMap();
        }
    } else {
        console.log('Nenhum usuário logado.');
        showScreen('login-screen');
    }
});

// --- Listeners de Eventos ---
googleLoginBtn.addEventListener('click', () => signInWithPopup(auth, googleProvider).catch(handleAuthError));
anonLoginBtn.addEventListener('click', () => signInAnonymously(auth).catch(handleAuthError));
startGameBtn.addEventListener('click', requestPermissionsAndStart);
logoutBtn.addEventListener('click', () => signOut(auth));

function handleAuthError(error) {
    console.error("Erro na autenticação:", error);
    alert(`Erro no login: ${error.message}`);
}

// --- Lógica de Permissões e Jogo ---
async function requestPermissionsAndStart() {
    console.log("Solicitando permissões...");
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        console.log("Permissão de câmera concedida.");

        await new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error("Geolocalização não suportada."));
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        console.log("Permissão de GPS concedida.");

        showScreen('ar-screen');
    } catch (error) {
        console.error("Permissão negada.", error);
        alert("Permissão de Câmera e GPS são necessárias para jogar.");
    }
}

function handleLocationUpdate(position) {
    const userCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };

    const distance = haversineDistance(userCoords, testLocation);

    if (distance <= testLocation.radius) {
        // Dentro do raio
        protonPackUI.classList.remove('hidden');
        beamBtn.classList.remove('hidden');
        pkeMeterUI.classList.add('hidden');
        messageContainer.textContent = "Você está na área de caça!";

        if (!isGhostSpawned) {
            spawnGhost(userCoords);
        }

    } else {
        // Fora do raio
        protonPackUI.classList.add('hidden');
        beamBtn.classList.add('hidden');
        pkeMeterUI.classList.remove('hidden');
        messageContainer.textContent = `Você está a ${Math.round(distance)} metros da área de caça. Siga o medidor!`;
        outsideRadiusAudio.play().catch(e => console.log("Áudio bloqueado pelo navegador."));
        
        // Esconde o fantasma se o jogador sair da área
        if(isGhostSpawned) {
            ghostEntity.setAttribute('visible', 'false');
            isGhostSpawned = false; // Permite que o fantasma apareça novamente ao reentrar na área
        }
    }
}

function spawnGhost(userCoords) {
    console.log("Gerando fantasma...");
    const spawnRadius = 10; // Raio de 10m para teste
    const randomDistance = Math.random() * spawnRadius; // Distância aleatória até 10m
    const randomAngle = Math.random() * 360; // Ângulo aleatório

    const ghostPosition = calculateDestinationPoint(userCoords, randomAngle, randomDistance);

    ghostEntity.setAttribute('gps-entity-place', `latitude: ${ghostPosition.latitude}; longitude: ${ghostPosition.longitude};`);
    ghostEntity.setAttribute('visible', 'true');
    isGhostSpawned = true;
    messageContainer.textContent = "Um fantasma apareceu!";
    console.log(`Fantasma gerado em: lat ${ghostPosition.latitude}, lon ${ghostPosition.longitude}`);
}

function locationError(error) {
    console.error("Erro de geolocalização:", error);
    messageContainer.textContent = "Não foi possível obter sua localização.";
}

// --- Funções Auxiliares ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    if (screenId === 'ar-screen') {
        if (!locationWatchId) {
            locationWatchId = navigator.geolocation.watchPosition(handleLocationUpdate, locationError, { enableHighAccuracy: true });
        }
    } else {
        if (locationWatchId) {
            navigator.geolocation.clearWatch(locationWatchId);
            locationWatchId = null;
        }
    }
}

function initializeMap() {
    const map = L.map('map').setView([testLocation.latitude, testLocation.longitude], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    L.circle([testLocation.latitude, testLocation.longitude], { radius: testLocation.radius, color: 'yellow', fillColor: '#f0ad4e' }).addTo(map);
    map.fitBounds(L.circle([testLocation.latitude, testLocation.longitude], { radius: testLocation.radius }).getBounds());
    startGameBtn.disabled = false;
}

function haversineDistance(coords1, coords2) {
    const R = 6371e3; // Raio da Terra em metros
    const lat1 = coords1.latitude * Math.PI / 180;
    const lat2 = coords2.latitude * Math.PI / 180;
    const deltaLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
    const deltaLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function calculateDestinationPoint(startPoint, bearing, distance) {
    const R = 6371e3; // Raio da Terra em metros
    const d = distance;

    const lat1 = startPoint.latitude * Math.PI / 180;
    const lon1 = startPoint.longitude * Math.PI / 180;
    const brng = bearing * Math.PI / 180;

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R) + Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));
    const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1), Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2));

    return {
        latitude: lat2 * 180 / Math.PI,
        longitude: (lon2 * 180 / Math.PI + 540) % 360 - 180 // Normaliza para -180 a +180
    };
}
