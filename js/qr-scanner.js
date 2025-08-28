// QR Scanner Manager for Containment Units
class QRScannerManager {
    constructor() {
        this.isScanning = false;
        this.scanner = null;
        this.videoElement = null;
        this.stream = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('📱 QR Scanner Manager inicializado');
    }

    setupEventListeners() {
        // Modal close events
        document.querySelectorAll('#qr-scanner-modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.stopScanning();
            });
        });

        // Listen for inventory full to show QR scanner
        document.addEventListener('inventoryFull', () => {
            this.showQRModal();
        });
    }

    showQRModal() {
        const modal = document.getElementById('qr-scanner-modal');
        modal.classList.add('active');
        
        // Start scanning automatically
        setTimeout(() => {
            this.startScanning();
        }, 500);
    }

    hideQRModal() {
        const modal = document.getElementById('qr-scanner-modal');
        modal.classList.remove('active');
        this.stopScanning();
    }

    async startScanning() {
        if (this.isScanning) return;
        
        try {
            console.log('📱 Iniciando scanner QR...');
            this.isScanning = true;
            
            // Get video element
            this.videoElement = document.getElementById('qr-video');
            if (!this.videoElement) {
                throw new Error('Elemento de vídeo não encontrado');
            }

            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            // Set video source
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();

            // Initialize ZXing scanner
            this.scanner = new ZXing.BrowserMultiFormatReader();
            
            // Start scanning
            this.scanner.decodeFromVideoDevice(null, this.videoElement, (result, error) => {
                if (result) {
                    this.onQRCodeDetected(result.text);
                }
                
                if (error && error.name !== 'NotFoundException') {
                    console.error('Erro no scanner:', error);
                }
            });

            utils.showToast('Scanner QR ativo', 'success');

        } catch (error) {
            console.error('❌ Erro ao iniciar scanner:', error);
            this.handleScannerError(error);
        }
    }

    stopScanning() {
        if (!this.isScanning) return;
        
        console.log('🛑 Parando scanner QR...');
        this.isScanning = false;

        // Stop scanner
        if (this.scanner) {
            this.scanner.reset();
            this.scanner = null;
        }

        // Stop video stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Clear video element
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }

        this.hideQRModal();
    }

    onQRCodeDetected(qrText) {
        console.log('📱 QR Code detectado:', qrText);
        
        // Validate QR code
        if (!this.isValidContainmentQR(qrText)) {
            utils.showToast('QR Code inválido para Unidade de Contenção', 'error');
            return;
        }

        // Process containment
        this.processContainment(qrText);
    }

    isValidContainmentQR(qrText) {
        // Check if QR code matches expected format
        const validCodes = Object.values(QR_CODES).map(qr => qr.code);
        return validCodes.includes(qrText);
    }

    async processContainment(qrCode) {
        try {
            console.log('📦 Processando contenção...');
            
            // Stop scanning first
            this.stopScanning();
            
            // Validate inventory has ghosts
            if (gameState.inventory.length === 0) {
                utils.showToast('Inventário vazio!', 'error');
                return;
            }

            // Calculate points and statistics
            const stats = this.calculateContainmentStats();
            
            // Add points to player
            gameState.points += stats.totalPoints;
            gameState.ghostsDeposited += stats.ghostCount;
            
            // Clear inventory
            gameState.inventory = [];
            
            // Save to IndexedDB
            if (window.inventoryManager) {
                await window.inventoryManager.clearInventory();
                await window.inventoryManager.saveGameState();
            }
            
            // Sync with Firebase
            await this.syncContainmentData(stats, qrCode);
            
            // Update UI
            if (window.app) {
                window.app.updateInventoryDisplay();
            }
            
            // Show success message
            this.showContainmentSuccess(stats);
            
            // Check for easter eggs
            this.checkEasterEggs();
            
        } catch (error) {
            console.error('❌ Erro no processamento de contenção:', error);
            utils.showToast('Erro ao processar contenção', 'error');
        }
    }

    calculateContainmentStats() {
        const stats = {
            ghostCount: gameState.inventory.length,
            totalPoints: 0,
            bonusPoints: 0,
            byType: {}
        };

        // Calculate base points
        gameState.inventory.forEach(ghost => {
            const points = ghost.points || 10;
            stats.totalPoints += points;
            
            // Count by type
            stats.byType[ghost.type] = (stats.byType[ghost.type] || 0) + 1;
        });

        // Calculate bonus points
        if (stats.ghostCount >= 10) {
            stats.bonusPoints = Math.floor(stats.totalPoints * 0.1); // 10% bonus for full inventory
            stats.totalPoints += stats.bonusPoints;
        }

        return stats;
    }

    async syncContainmentData(stats, qrCode) {
        if (!gameState.currentUser) return;
        
        try {
            const containmentData = {
                userId: gameState.currentUser.uid,
                qrCode: qrCode,
                timestamp: Date.now(),
                ghostCount: stats.ghostCount,
                pointsEarned: stats.totalPoints,
                bonusPoints: stats.bonusPoints,
                ghostTypes: stats.byType
            };

            // Save to Firebase
            await database.ref(`containments/${gameState.currentUser.uid}`).push(containmentData);
            
            // Update user totals
            await database.ref(`users/${gameState.currentUser.uid}`).update({
                points: gameState.points,
                ghostsDeposited: gameState.ghostsDeposited,
                lastContainment: Date.now()
            });

            console.log('☁️ Dados de contenção sincronizados');
            
        } catch (error) {
            console.error('❌ Erro ao sincronizar contenção:', error);
        }
    }

    showContainmentSuccess(stats) {
        let message = `${stats.ghostCount} fantasmas depositados!\n`;
        message += `+${stats.totalPoints} pontos`;
        
        if (stats.bonusPoints > 0) {
            message += ` (incluindo ${stats.bonusPoints} de bônus!)`;
        }
        
        utils.showToast(message, 'success', 5000);
        
        // Show detailed breakdown
        setTimeout(() => {
            let breakdown = 'Breakdown:\n';
            Object.entries(stats.byType).forEach(([type, count]) => {
                breakdown += `${count}x ${type}\n`;
            });
            console.log(breakdown);
        }, 1000);
    }

    checkEasterEggs() {
        // Check for Ecto-1 easter egg
        if (gameState.ghostsDeposited >= GAME_CONFIG.easterEggs.ecto1.threshold && 
            !gameState.ecto1Unlocked) {
            
            gameState.ecto1Unlocked = true;
            
            if (window.arManager) {
                window.arManager.addEcto1();
            }
            
            utils.showToast('Easter Egg desbloqueado: Ecto-1!', 'success');
        }
        
        // Check for Slimer easter egg
        if (gameState.ghostsDeposited >= GAME_CONFIG.easterEggs.slimer.threshold && 
            !gameState.slimerUnlocked) {
            
            gameState.slimerUnlocked = true;
            
            if (window.arManager) {
                window.arManager.addSlimer();
            }
            
            utils.showToast('Easter Egg desbloqueado: Slimer aliado!', 'success');
        }
    }

    handleScannerError(error) {
        let message = 'Erro no scanner QR';
        
        if (error.name === 'NotAllowedError') {
            message = 'Acesso à câmera negado';
        } else if (error.name === 'NotFoundError') {
            message = 'Câmera não encontrada';
        } else if (error.name === 'NotSupportedError') {
            message = 'Scanner QR não suportado neste dispositivo';
        }
        
        utils.showToast(message, 'error');
        this.stopScanning();
    }

    // Manual QR input as fallback
    showManualInput() {
        const qrInput = prompt('Digite o código da Unidade de Contenção:');
        
        if (qrInput) {
            this.onQRCodeDetected(qrInput.trim().toUpperCase());
        }
    }

    // Test method for development
    testContainment() {
        if (gameState.inventory.length === 0) {
            // Add test ghosts for testing
            for (let i = 0; i < 5; i++) {
                gameState.inventory.push({
                    id: `test-ghost-${i}`,
                    type: 'normal',
                    points: 10,
                    captureTime: Date.now()
                });
            }
        }
        
        // Simulate QR scan
        this.onQRCodeDetected(QR_CODES.florianopolis.code);
    }

    // Get QR scanner status
    getStatus() {
        return {
            isScanning: this.isScanning,
            hasCamera: !!this.stream,
            hasScanner: !!this.scanner
        };
    }
}

// Initialize QR scanner manager
window.qrScannerManager = new QRScannerManager();

// Add manual input button for testing (development only)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', () => {
        const manualBtn = document.createElement('button');
        manualBtn.textContent = 'Manual QR (Dev)';
        manualBtn.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            z-index: 9999;
            background: #ff8800;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
        `;
        manualBtn.addEventListener('click', () => {
            window.qrScannerManager.testContainment();
        });
        document.body.appendChild(manualBtn);
    });
}