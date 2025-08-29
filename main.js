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
    latitude: -27.639797751605755,
    longitude: -48.667749560555094,
    radius: 100 // metros
};

let locationWatchId = null;
let isGhostSpawned = false;
let currentGhostGPS = null; // Armazena a localização GPS do fantasma gerado
let xrSession = null; // Armazena a sessão WebXR
let xrReferenceSpace = null; // Armazena o espaço de referência WebXR

// --- Funções de Utilidade Geográfica ---
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

function getBearing(startPoint, endPoint) {
    const lat1 = startPoint.latitude * Math.PI / 180;
    const lon1 = startPoint.longitude * Math.PI / 180;
    const lat2 = endPoint.latitude * Math.PI / 180;
    const lon2 = endPoint.longitude * Math.PI / 180;

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;

    return (bearing + 360) % 360; // Normaliza para 0-360
}

function calculateDestinationPoint(startPoint, bearing, distance) {
    const R = 6371e3; // Raio da Terra em metros
    const latRad = startPoint.latitude * Math.PI / 180;
    const lonRad = startPoint.longitude * Math.PI / 180;
    const bearingRad = bearing * Math.PI / 180;

    const latDestRad = Math.asin(
        Math.sin(latRad) * Math.cos(distance / R) +
        Math.cos(latRad) * Math.sin(distance / R) * Math.cos(bearingRad)
    );

    let lonDestRad = lonRad + Math.atan2(
        Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(latRad),
        Math.cos(distance / R) - Math.sin(latRad) * Math.sin(latDestRad)
    );

    // Normaliza a longitude para -180 a +180
    lonDestRad = (lonDestRad + 3 * Math.PI) % (2 * Math.PI) - Math.PI;

    return {
        latitude: latDestRad * 180 / Math.PI,
        longitude: lonDestRad * 180 / Math.PI
    };
}

// --- Elementos da UI ---
const googleLoginBtn = document.getElementById('google-login');
const anonLoginBtn = document.getElementById('anon-login');
const startGameBtn = document.getElementById('start-game-btn');
const protonPackUI = document.getElementById('proton-pack');
const beamBtn = document.getElementById('beam-btn');
const pkeMeterUI = document.getElementById('pke-meter');
const messageContainer = document.getElementById('message-container');
const sceneEl = document.querySelector('a-scene'); // Obtém o elemento da cena A-Frame
const ghostEntity = document.getElementById('ghost-entity'); // Reativado

const logoutBtn = document.createElement('button');
logoutBtn.textContent = 'Logout';
logoutBtn.id = 'logout-btn';
logoutBtn.style.position = 'absolute';
logoutBtn.style.top = '10px';
logoutBtn.style.right = '10px';
document.getElementById('map-screen').appendChild(logoutBtn);

const spawnGhostBtn = document.getElementById('spawn-ghost-btn');

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

spawnGhostBtn.addEventListener('click', async () => {
    if (!xrSession || !xrReferenceSpace) {
        console.error("Sessão WebXR ou espaço de referência não disponível para hit-test.");
        messageContainer.textContent = "Erro: AR não pronto para gerar fantasma.";
        return;
    }

    // Perform hit test from the center of the screen
    // This requires an XRFrame, which is usually obtained in the render loop.
    // For a button click, we can try to get the latest frame.
    // A-Frame's renderer.xr.getFrame() might provide it.
    const frame = sceneEl.renderer.xr.getFrame();

    if (!frame) {
        console.warn("Nenhum XRFrame disponível para hit-test.");
        messageContainer.textContent = "Tente novamente. AR não conseguiu um frame.";
        return;
    }

    // Create a hit test source (can be optimized to create once)
    const hitTestSource = await xrSession.requestHitTestSource({ space: xrReferenceSpace });

    if (!hitTestSource) {
        console.error("Não foi possível criar hit test source.");
        messageContainer.textContent = "Erro: Não foi possível iniciar hit-test.";
        return;
    }

    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length > 0) {
        // Use the first hit result
        spawnGhost({ results: hitTestResults }); // Pass results in an object to match spawnGhost signature
    } else {
        messageContainer.textContent = "Nenhuma superfície detectada para gerar fantasma.";
        console.log("Nenhum hit test result.");
    }

    // Clean up hit test source
    hitTestSource.cancel();
});

function handleAuthError(error) {
    console.error("Erro na autenticação:", error);
    alert(`Erro no login: ${error.message}`);
}

// --- Lógica de Permissões e Jogo (WebXR) ---
async function requestPermissionsAndStart() {
    console.log("Solicitando permissões e iniciando WebXR...");
    try {
        // 1. Solicitar permissão de GPS
        await new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error("Geolocalização não suportada."));
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        console.log("Permissão de GPS concedida.");

        // 2. Verificar suporte a WebXR e iniciar sessão AR
        if (navigator.xr) {
            const isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
            if (!isARSupported) {
                throw new Error('AR imersivo não é suportado neste dispositivo.');
            }
            console.log("WebXR imersivo suportado.");

            // Entrar na sessão AR (A-Frame cuidará da câmera)
            await sceneEl.enterAR();
            console.log("Sessão AR iniciada.");
            showScreen('ar-screen'); // Mostra a tela AR após o início da sessão

        } else {
            throw new Error('WebXR não é suportado neste navegador.');
        }

    } catch (error) {
        console.error("Erro ao iniciar AR/obter permissões:", error);
        alert(`Erro: ${error.message || "Permissões e/ou suporte a AR são necessários para jogar."}`);
    }
}

// --- WebXR Session Event Listeners ---
sceneEl.addEventListener('enter-vr', async () => {
    console.log('Evento enter-vr disparado (iniciando AR)');
    // Este evento é disparado quando o A-Frame entra com sucesso no modo AR
    // Agora podemos iniciar o rastreamento de localização e o gerenciamento de fantasmas
    if (!locationWatchId) {
        locationWatchId = navigator.geolocation.watchPosition(handleLocationUpdate, locationError, { enableHighAccuracy: true });
    }

    // Obter a sessão WebXR e o espaço de referência
    xrSession = sceneEl.renderer.xr.getSession();
    if (xrSession) {
        xrReferenceSpace = await xrSession.requestReferenceSpace('local-floor');
        console.log('Sessão WebXR e espaço de referência obtidos.');
    } else {
        console.error('Sessão WebXR não disponível.');
    }
});

sceneEl.addEventListener('exit-vr', () => {
    console.log('Saindo do modo AR.');
    // Limpa o rastreamento de localização ao sair do AR
    if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
    }
    // Esconde o fantasma se ele foi gerado
    ghostEntity.setAttribute('visible', 'false'); // Reativado
    isGhostSpawned = false;
    showScreen('map-screen'); // Volta para a tela do mapa
});


function handleLocationUpdate(position) {
    const userCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };

    const distanceToHuntingArea = haversineDistance(userCoords, testLocation);

    if (distanceToHuntingArea <= testLocation.radius) {
        // Dentro do raio de caça
        protonPackUI.classList.remove('hidden');
        beamBtn.classList.remove('hidden');
        pkeMeterUI.classList.add('hidden');
        
        if (currentGhostGPS) { // Se o fantasma já foi gerado, mostra a distância até ele
            const distanceToGhost = haversineDistance(userCoords, currentGhostGPS);
            messageContainer.textContent = `Fantasma a ${Math.round(distanceToGhost)} metros!`;
        } else {
            messageContainer.textContent = "Você está na área de caça!";
        }

    } else {
        // Fora do raio de caça
        protonPackUI.classList.add('hidden');
        beamBtn.classList.add('hidden');
        pkeMeterUI.classList.remove('hidden');
        messageContainer.textContent = `Você está a ${Math.round(distanceToHuntingArea)} metros da área de caça. Siga o medidor!`;
        outsideRadiusAudio.play().catch(e => console.log("Áudio bloqueado pelo navegador."));
        
        // Esconde o fantasma se o jogador sair da área
        if(isGhostSpawned) {
            ghostEntity.setAttribute('visible', 'false');
            isGhostSpawned = false;
            currentGhostGPS = null;
        }
    }
}

async function spawnGhost(hitResult) {
    console.log("Gerando fantasma via WebXR hit-test...");

    // Use the pose from the hitResult to position the ghost
    const pose = hitResult.results[0].pose; // Assuming at least one hit result

    // Set position and rotation based on the hit test result
    ghostEntity.object3D.position.copy(pose.transform.position);
    ghostEntity.object3D.quaternion.copy(pose.transform.orientation);

    // Adjust height if necessary (e.g., if model origin is not at base)
    ghostEntity.object3D.position.y += 0.8; // Example adjustment

    ghostEntity.setAttribute('visible', 'true');
    isGhostSpawned = true;
    messageContainer.textContent = `Fantasma gerado!`; // Message will be updated by distance later
    console.log(`Fantasma gerado em: x ${ghostEntity.object3D.position.x.toFixed(2)}, y ${ghostEntity.object3D.position.y.toFixed(2)}, z ${ghostEntity.object3D.position.z.toFixed(2)}`);
}

function locationError(error) {
    console.error("Erro de geolocalização:", error);
    messageContainer.textContent = "Não foi possível obter sua localização.";
}

// --- Funções Auxiliares ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    // Não gerencia mais watchPosition aqui, é gerenciado pelos eventos enter-vr/exit-vr
}

function initializeMap() {
    const map = L.map('map').setView([testLocation.latitude, testLocation.longitude], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    
    const huntingAreaCircle = L.circle([testLocation.latitude, testLocation.longitude], {
        radius: testLocation.radius,
        color: 'yellow',
        fillColor: '#f0ad4e'
    }).addTo(map);

    map.fitBounds(huntingAreaCircle.getBounds());
    
    startGameBtn.disabled = false;
}