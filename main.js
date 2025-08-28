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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- Elementos da UI ---
const googleLoginBtn = document.getElementById('google-login');
const anonLoginBtn = document.getElementById('anon-login');
const startGameBtn = document.getElementById('start-game-btn');

const logoutBtn = document.createElement('button');
logoutBtn.textContent = 'Logout';
logoutBtn.id = 'logout-btn';
logoutBtn.style.position = 'absolute';
logoutBtn.style.top = '10px';
logoutBtn.style.right = '10px';
document.getElementById('map-screen').appendChild(logoutBtn);

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
googleLoginBtn.addEventListener('click', () => {
    signInWithPopup(auth, googleProvider).catch((error) => {
        console.error("Erro no login com Google:", error);
        alert(`Erro no login: ${error.message}`);
    });
});

anonLoginBtn.addEventListener('click', () => {
    signInAnonymously(auth).catch((error) => {
        console.error("Erro no login anônimo:", error);
        alert(`Erro no login: ${error.message}`);
    });
});

startGameBtn.addEventListener('click', requestPermissionsAndStart);

logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// --- Lógica de Permissões e Início do Jogo ---
async function requestPermissionsAndStart() {
    console.log("Solicitando permissões...");
    try {
        // 1. Solicitar permissão da Câmera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Boa prática: parar a trilha se só precisamos da permissão
        console.log("Permissão de câmera concedida.");

        // 2. Solicitar permissão de GPS
        await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocalização não é suportada pelo navegador."));
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log("Permissão de GPS concedida:", position);
                    resolve(position);
                },
                (error) => {
                    reject(error);
                }
            );
        });

        // 3. Se ambas as permissões foram concedidas, iniciar o jogo
        console.log("Todas as permissões concedidas. Iniciando o jogo.");
        showScreen('ar-screen');

    } catch (error) {
        console.error("Uma ou mais permissões foram negadas.", error);
        alert("Permissão de Câmera e GPS são necessárias para jogar. Por favor, habilite-as nas configurações do seu navegador e recarregue a página.");
    }
}

// --- Funções Auxiliares ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function initializeMap() {
    const testLocation = {
        lat: -27.63979808217616,
        lng: -48.66775914489331,
        radius: 100 // metros
    };

    const map = L.map('map').setView([testLocation.lat, testLocation.lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const circle = L.circle([testLocation.lat, testLocation.lng], {
        color: 'yellow',
        fillColor: '#f0ad4e',
        fillOpacity: 0.5,
        radius: testLocation.radius
    }).addTo(map);

    map.fitBounds(circle.getBounds());

    document.getElementById('start-game-btn').disabled = false;
}
