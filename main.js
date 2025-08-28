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

// Adiciona um botão de logout na tela do mapa para teste
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
        // Usuário está logado
        console.log('Usuário logado:', user.uid);
        showScreen('map-screen');
        // Garante que o mapa seja inicializado apenas uma vez
        if (!document.getElementById('map')._leaflet_id) {
             initializeMap();
        }
    } else {
        // Usuário está deslogado
        console.log('Nenhum usuário logado.');
        showScreen('login-screen');
    }
});

// --- Listeners de Eventos ---
googleLoginBtn.addEventListener('click', () => {
    signInWithPopup(auth, googleProvider)
        .catch((error) => {
            console.error("Erro no login com Google:", error);
            alert(`Erro no login: ${error.message}`);
        });
});

anonLoginBtn.addEventListener('click', () => {
    signInAnonymously(auth)
        .catch((error) => {
            console.error("Erro no login anônimo:", error);
            alert(`Erro no login: ${error.message}`);
        });
});

startGameBtn.addEventListener('click', () => {
    showScreen('ar-screen');
    // Futura lógica para iniciar o jogo AR
});

logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

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

    // Habilita o botão de iniciar (a lógica de geolocalização será adicionada depois)
    document.getElementById('start-game-btn').disabled = false;
}
