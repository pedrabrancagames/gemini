// Game Manager - Core game logic
class GameManager {
    constructor() {
        this.isGameActive = false;
        this.isPaused = false;
        this.isCapturing = false;
        this.captureStartTime = 0;
        this.captureTarget = null;
        this.ghostUpdateInterval = null;
        this.positionUpdateInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('🎮 Game Manager inicializado');
    }

    setupEventListeners() {
        // Fire button events
        const fireBtn = document.getElementById('fire-btn');
        
        fireBtn.addEventListener('mousedown', (e) => this.startCapture(e));
        fireBtn.addEventListener('touchstart', (e) => this.startCapture(e));
        
        fireBtn.addEventListener('mouseup', (e) => this.stopCapture(e));
        fireBtn.addEventListener('touchend', (e) => this.stopCapture(e));
        
        fireBtn.addEventListener('mouseleave', (e) => this.stopCapture(e));
        fireBtn.addEventListener('touchcancel', (e) => this.stopCapture(e));
    }

    start() {
        if (this.isGameActive) return;
        
        console.log('🚀 Iniciando jogo...');
        this.isGameActive = true;
        this.isPaused = false;
        
        // Start location tracking
        if (window.locationManager) {
            window.locationManager.startLocationWatch();
        }
        
        // Start ghost spawning
        this.startGhostSpawning();
        
        // Start position monitoring
        this.startPositionMonitoring();
        
        // Initialize UI
        this.updateUI();
        
        utils.showToast('Jogo iniciado! Procure por fantasmas!', 'success');
    }

    pause() {
        if (!this.isGameActive || this.isPaused) return;
        
        console.log('⏸️ Pausando jogo...');
        this.isPaused = true;
        
        // Stop capture if in progress
        this.stopCapture();
        
        // Clear intervals
        if (this.ghostUpdateInterval) {
            clearInterval(this.ghostUpdateInterval);
        }
        
        if (this.positionUpdateInterval) {
            clearInterval(this.positionUpdateInterval);
        }
    }

    resume() {
        if (!this.isGameActive || !this.isPaused) return;
        
        console.log('▶️ Resumindo jogo...');
        this.isPaused = false;
        
        // Restart intervals
        this.startGhostSpawning();
        this.startPositionMonitoring();
    }

    stop() {
        console.log('🛑 Parando jogo...');
        this.isGameActive = false;
        this.isPaused = false;
        
        // Stop capture
        this.stopCapture();
        
        // Clear intervals
        if (this.ghostUpdateInterval) {
            clearInterval(this.ghostUpdateInterval);
        }
        
        if (this.positionUpdateInterval) {
            clearInterval(this.positionUpdateInterval);
        }
        
        // Stop location tracking
        if (window.locationManager) {
            window.locationManager.stopLocationWatch();
        }
        
        // Clear ghosts
        this.clearAllGhosts();
    }

    startGhostSpawning() {
        // Spawn initial ghosts
        this.spawnGhosts();
        
        // Set up respawn timer
        this.ghostUpdateInterval = setInterval(() => {
            if (!this.isPaused && gameState.isInRange) {
                this.spawnGhosts();
            }
        }, GAME_CONFIG.ghosts.respawnTime);
    }

    startPositionMonitoring() {
        this.positionUpdateInterval = setInterval(() => {
            if (!this.isPaused && window.locationManager) {
                window.locationManager.updateUserPosition();
            }
        }, 5000); // Update every 5 seconds
    }

    spawnGhosts() {
        // Don't spawn if at max capacity
        if (gameState.currentGhosts.length >= GAME_CONFIG.ghosts.maxGhosts) {
            return;
        }
        
        // Don't spawn if user is out of range
        if (!gameState.isInRange) {
            return;
        }
        
        const numToSpawn = Math.min(
            GAME_CONFIG.ghosts.maxGhosts - gameState.currentGhosts.length,
            Math.floor(Math.random() * 3) + 1 // Spawn 1-3 ghosts
        );
        
        for (let i = 0; i < numToSpawn; i++) {
            this.spawnGhost();
        }
    }

    spawnGhost() {
        if (!window.locationManager) return;
        
        const position = window.locationManager.generateGhostPosition();
        if (!position) return;
        
        const ghost = {
            id: utils.generateId(),
            position: position,
            arPosition: this.worldToARPosition(position),
            type: 'normal', // Could be 'normal', 'strong', etc.
            health: 100,
            captured: false,
            spawnTime: Date.now()
        };
        
        gameState.currentGhosts.push(ghost);
        
        // Add to AR scene
        if (window.arManager) {
            window.arManager.addGhost(ghost);
        }
        
        console.log('👻 Fantasma spawned:', ghost.id);
    }

    worldToARPosition(worldPos) {
        // Convert world coordinates to AR coordinates
        // This is a simplified conversion - in a real implementation,
        // you'd use proper AR coordinate transformation
        
        if (!gameState.userPosition || !gameState.currentLocation) {
            return { x: 0, y: 0, z: -10 };
        }
        
        // Calculate relative position
        const deltaLat = worldPos.lat - gameState.userPosition.lat;
        const deltaLng = worldPos.lng - gameState.userPosition.lng;
        
        // Convert to meters (approximate)
        const x = deltaLng * 111320 * Math.cos(gameState.userPosition.lat * Math.PI / 180);
        const z = -deltaLat * 110540; // Negative Z for forward direction
        const y = Math.random() * 3 + 1; // Random height between 1-4 meters
        
        return { x, y, z };
    }

    startCapture(event) {
        event.preventDefault();
        
        if (this.isCapturing || this.isPaused || !gameState.isInRange) {
            return;
        }
        
        // Find target ghost (closest to center of screen)
        const target = this.findTargetGhost();
        if (!target) {
            utils.showToast('Nenhum fantasma na mira!', 'error');
            return;
        }
        
        console.log('🎯 Iniciando captura do fantasma:', target.id);
        
        this.isCapturing = true;
        this.captureStartTime = Date.now();
        this.captureTarget = target;
        
        // Show capture UI
        document.getElementById('capture-progress').classList.remove('hidden');
        
        // Play proton beam sound
        utils.playAudio(AUDIO_FILES.protonBeam);
        
        // Start capture progress
        this.updateCaptureProgress();
    }

    stopCapture(event) {
        if (event) {
            event.preventDefault();
        }
        
        if (!this.isCapturing) return;
        
        console.log('🛑 Parando captura');
        
        this.isCapturing = false;
        this.captureTarget = null;
        
        // Hide capture UI
        document.getElementById('capture-progress').classList.add('hidden');
    }

    updateCaptureProgress() {
        if (!this.isCapturing || !this.captureTarget) {
            return;
        }
        
        const elapsed = Date.now() - this.captureStartTime;
        const progress = Math.min(elapsed / GAME_CONFIG.capture.duration, 1);
        
        // Update progress ring
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            const rotation = progress * 360;
            progressFill.style.transform = `rotate(${rotation}deg)`;
        }
        
        // Check if capture is complete
        if (progress >= 1) {
            this.completeCapture();
            return;
        }
        
        // Continue updating
        setTimeout(() => this.updateCaptureProgress(), GAME_CONFIG.capture.checkInterval);
    }

    completeCapture() {
        if (!this.captureTarget) return;
        
        const ghost = this.captureTarget;
        console.log('✅ Fantasma capturado:', ghost.id);
        
        // Check inventory space
        const maxSlots = GAME_CONFIG.inventory.initialSlots + 
            Math.floor(gameState.ghostsDeposited / GAME_CONFIG.inventory.bonusThreshold) * 
            GAME_CONFIG.inventory.bonusSlots;
        
        if (gameState.inventory.length >= maxSlots) {
            utils.showToast('Inventário cheio! Vá até a Unidade de Contenção!', 'error');
            utils.playAudio(AUDIO_FILES.inventoryFull);
            this.stopCapture();
            return;
        }
        
        // Add to inventory
        gameState.inventory.push({
            id: ghost.id,
            type: ghost.type,
            captureTime: Date.now(),
            points: this.calculateGhostPoints(ghost)
        });
        
        // Add points
        const points = this.calculateGhostPoints(ghost);
        gameState.points += points;
        
        // Remove from active ghosts
        gameState.currentGhosts = gameState.currentGhosts.filter(g => g.id !== ghost.id);
        
        // Remove from AR scene
        if (window.arManager) {
            window.arManager.removeGhost(ghost.id);
        }
        
        // Update UI
        this.updateUI();
        
        // Save state
        utils.saveGameState();
        
        // Show success message
        utils.showToast(`Fantasma capturado! +${points} pontos`, 'success');
        
        // Stop capture
        this.stopCapture();
    }

    findTargetGhost() {
        // For now, just return the first available ghost
        // In a real implementation, you'd use raycasting to find the ghost
        // the user is pointing at with their camera
        return gameState.currentGhosts.find(ghost => !ghost.captured);
    }

    calculateGhostPoints(ghost) {
        let basePoints = 10;
        
        // Bonus for ghost type
        if (ghost.type === 'strong') {
            basePoints = 25;
        }
        
        // Bonus for player level
        const levelBonus = gameState.level * 2;
        
        return basePoints + levelBonus;
    }

    clearAllGhosts() {
        gameState.currentGhosts = [];
        
        if (window.arManager) {
            window.arManager.clearAllGhosts();
        }
    }

    handleRangeChange(inRange) {
        gameState.isInRange = inRange;
        
        if (inRange) {
            // User entered range
            document.getElementById('out-of-range').classList.add('hidden');
            document.getElementById('proton-pack').style.display = 'block';
            
            utils.showToast('De volta ao raio de caça!', 'success');
            
            // Resume ghost spawning
            if (this.isGameActive && !this.isPaused) {
                this.spawnGhosts();
            }
            
        } else {
            // User left range
            document.getElementById('out-of-range').classList.remove('hidden');
            document.getElementById('proton-pack').style.display = 'none';
            
            // Stop any capture in progress
            this.stopCapture();
            
            // Play warning audio
            utils.playAudio(AUDIO_FILES.outsideRadius);
            
            // Clear ghosts
            this.clearAllGhosts();
            
            // Update distance indicator
            this.updateDistanceIndicator();
        }
    }

    updateDistanceIndicator() {
        if (!window.locationManager) return;
        
        const distanceInfo = window.locationManager.getDistanceToLocation();
        if (!distanceInfo) return;
        
        const distanceText = document.getElementById('distance-text');
        const directionArrow = document.getElementById('direction-arrow');
        
        if (distanceText) {
            distanceText.textContent = utils.formatDistance(distanceInfo.distance);
        }
        
        if (directionArrow) {
            // Convert bearing to arrow direction
            const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
            const index = Math.round(distanceInfo.bearing / 45) % 8;
            directionArrow.textContent = arrows[index];
        }
    }

    updateUI() {
        // Update inventory counter
        if (window.app) {
            window.app.updateInventoryDisplay();
        }
        
        // Update any other UI elements
        this.updatePlayerLevel();
    }

    updatePlayerLevel() {
        // Simple level system based on points
        const newLevel = Math.floor(gameState.points / 100) + 1;
        
        if (newLevel > gameState.level) {
            gameState.level = newLevel;
            utils.showToast(`Level Up! Agora você é nível ${gameState.level}!`, 'success');
            utils.saveGameState();
        }
    }

    // Public methods for other modules
    getGameState() {
        return {
            isActive: this.isGameActive,
            isPaused: this.isPaused,
            isCapturing: this.isCapturing,
            ghostCount: gameState.currentGhosts.length
        };
    }

    getCurrentGhosts() {
        return gameState.currentGhosts;
    }

    isGameReady() {
        return this.isGameActive && gameState.isInRange && !this.isPaused;
    }
}

// Initialize game manager
window.gameManager = new GameManager();