// Main Application Controller
class App {
    constructor() {
        this.currentScreen = 'loading';
        this.assetsLoaded = false;
        this.permissionsGranted = false;
        this.init();
    }

    async init() {
        console.log('🎮 Inicializando Ghostbusters AR...');
        
        // Show loading screen first
        this.showScreen('loading');
        
        // Start loading assets
        await this.loadAssets();
        
        // Initialize managers
        this.initializeManagers();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check if user is already logged in
        if (authManager.isAuthenticated()) {
            this.showScreen('location');
        } else {
            this.showScreen('login');
        }
    }

    async loadAssets() {
        const assets = [
            // Images
            'assets/images/logo.png',
            'assets/images/proton_pack.png',
            'assets/images/ghost_trap.png',
            'assets/images/pke_meter.png',
            
            // 3D Models
            'assets/models/ghost.glb',
            
            // Audio files
            'assets/audio/proton-beam.mp3',
            'assets/audio/inventory_full.mp3',
            'assets/audio/outside_radius.mp3'
        ];

        let loaded = 0;
        const total = assets.length;

        const updateProgress = () => {
            const progress = (loaded / total) * 100;
            document.getElementById('loading-progress').style.width = `${progress}%`;
            document.getElementById('loading-percentage').textContent = `${Math.round(progress)}%`;
        };

        const loadPromises = assets.map(asset => {
            return new Promise((resolve, reject) => {
                if (asset.endsWith('.glb')) {
                    // Load 3D model
                    const loader = new THREE.GLTFLoader();
                    loader.load(asset, 
                        () => {
                            loaded++;
                            updateProgress();
                            resolve();
                        },
                        undefined,
                        reject
                    );
                } else if (asset.endsWith('.mp3')) {
                    // Load audio
                    const audio = new Audio(asset);
                    audio.addEventListener('canplaythrough', () => {
                        loaded++;
                        updateProgress();
                        resolve();
                    });
                    audio.addEventListener('error', reject);
                    audio.load();
                } else {
                    // Load image
                    const img = new Image();
                    img.onload = () => {
                        loaded++;
                        updateProgress();
                        resolve();
                    };
                    img.onerror = reject;
                    img.src = asset;
                }
            });
        });

        try {
            document.getElementById('loading-text').textContent = 'Carregando assets...';
            await Promise.all(loadPromises);
            
            document.getElementById('loading-text').textContent = 'Assets carregados!';
            this.assetsLoaded = true;
            
            // Simulate a brief pause to show completion
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error('Erro ao carregar assets:', error);
            document.getElementById('loading-text').textContent = 'Erro ao carregar assets';
            utils.showToast('Erro ao carregar recursos do jogo', 'error');
        }
    }

    initializeManagers() {
        // Managers are initialized in their respective files
        // This method is for any additional setup
        console.log('🔧 Managers inicializados');
    }

    setupEventListeners() {
        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.add('active');
        });

        // Sound toggle
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            gameState.soundEnabled = e.target.checked;
            utils.saveGameState();
        });

        // Notifications toggle
        document.getElementById('notifications-toggle').addEventListener('change', (e) => {
            gameState.notificationsEnabled = e.target.checked;
            utils.saveGameState();
        });

        // Inventory button
        document.getElementById('inventory-btn').addEventListener('click', () => {
            this.showInventory();
        });

        // Handle back button
        window.addEventListener('popstate', (e) => {
            if (document.querySelector('.modal.active')) {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle visibility change (app backgrounding)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onAppHidden();
            } else {
                this.onAppVisible();
            }
        });
    }

    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show requested screen
        const screen = document.getElementById(`${screenName}-screen`);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenName;
            console.log(`📱 Tela ativa: ${screenName}`);
        }
    }

    async requestPermissions() {
        try {
            document.getElementById('grant-permissions').textContent = 'Solicitando...';
            
            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            // Stop the stream immediately as we just needed permission
            stream.getTracks().forEach(track => track.stop());
            
            // Request location permission
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                });
            });

            gameState.userPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            };

            this.permissionsGranted = true;
            utils.showToast('Permissões concedidas!', 'success');
            
            // Start the game
            this.startGame();
            
        } catch (error) {
            console.error('Erro ao solicitar permissões:', error);
            
            let message = 'Erro ao solicitar permissões';
            if (error.name === 'NotAllowedError') {
                message = 'Permissões negadas. Habilite câmera e localização nas configurações do navegador.';
            } else if (error.name === 'NotFoundError') {
                message = 'Câmera não encontrada no dispositivo.';
            } else if (error.code === 1) {
                message = 'Localização negada. Habilite GPS nas configurações.';
            }
            
            utils.showToast(message, 'error');
            document.getElementById('grant-permissions').textContent = 'Tentar Novamente';
        }
    }

    startGame() {
        if (!this.assetsLoaded) {
            utils.showToast('Assets ainda carregando...', 'error');
            return;
        }

        if (!this.permissionsGranted) {
            utils.showToast('Permissões necessárias não concedidas', 'error');
            return;
        }

        console.log('🎯 Iniciando jogo...');
        this.showScreen('game');
        
        // Initialize game systems
        if (window.gameManager) {
            window.gameManager.start();
        }
        
        if (window.arManager) {
            window.arManager.start();
        }
    }

    showInventory() {
        const modal = document.getElementById('inventory-modal');
        const ghostList = document.getElementById('ghost-list');
        const slotsInfo = document.getElementById('slots-info');
        
        // Clear existing items
        ghostList.innerHTML = '';
        
        // Update slots info
        const maxSlots = GAME_CONFIG.inventory.initialSlots + 
            Math.floor(gameState.ghostsDeposited / GAME_CONFIG.inventory.bonusThreshold) * 
            GAME_CONFIG.inventory.bonusSlots;
        
        slotsInfo.textContent = `${gameState.inventory.length}/${maxSlots}`;
        
        // Populate ghost items
        gameState.inventory.forEach((ghost, index) => {
            const ghostItem = document.createElement('div');
            ghostItem.className = 'ghost-item';
            ghostItem.innerHTML = `
                <img src="assets/images/ghost_trap.png" alt="Fantasma ${index + 1}">
            `;
            ghostList.appendChild(ghostItem);
        });
        
        // Fill empty slots
        const emptySlots = maxSlots - gameState.inventory.length;
        for (let i = 0; i < emptySlots; i++) {
            const emptySlot = document.createElement('div');
            emptySlot.className = 'ghost-item';
            emptySlot.style.background = '#1a1a1a';
            emptySlot.style.borderStyle = 'dashed';
            ghostList.appendChild(emptySlot);
        }
        
        modal.classList.add('active');
    }

    handleOrientationChange() {
        // Handle orientation changes for AR
        if (this.currentScreen === 'game' && window.arManager) {
            window.arManager.handleOrientationChange();
        }
    }

    onAppHidden() {
        // Pause game when app goes to background
        if (this.currentScreen === 'game') {
            console.log('📱 App em background - pausando jogo');
            if (window.gameManager) {
                window.gameManager.pause();
            }
        }
    }

    onAppVisible() {
        // Resume game when app becomes visible
        if (this.currentScreen === 'game') {
            console.log('📱 App em foreground - resumindo jogo');
            if (window.gameManager) {
                window.gameManager.resume();
            }
        }
    }

    // Public methods for other modules
    getCurrentScreen() {
        return this.currentScreen;
    }

    isGameActive() {
        return this.currentScreen === 'game' && this.permissionsGranted;
    }

    getGameState() {
        return gameState;
    }

    updateInventoryDisplay() {
        const counter = document.getElementById('inventory-count');
        const maxSlots = GAME_CONFIG.inventory.initialSlots + 
            Math.floor(gameState.ghostsDeposited / GAME_CONFIG.inventory.bonusThreshold) * 
            GAME_CONFIG.inventory.bonusSlots;
        
        counter.textContent = `${gameState.inventory.length}/${maxSlots}`;
        
        // Show inventory full warning if needed
        if (gameState.inventory.length >= maxSlots) {
            document.getElementById('inventory-full').classList.remove('hidden');
            utils.playAudio(AUDIO_FILES.inventoryFull);
        } else {
            document.getElementById('inventory-full').classList.add('hidden');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Handle permission requests
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('grant-permissions').addEventListener('click', () => {
        window.app.requestPermissions();
    });
});