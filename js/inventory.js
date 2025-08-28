// Inventory Manager
class InventoryManager {
    constructor() {
        this.dbName = 'GhostbustersAR';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        await this.initIndexedDB();
        await this.loadInventoryFromDB();
        console.log('📦 Inventory Manager inicializado');
    }

    initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('ghosts')) {
                    const ghostStore = db.createObjectStore('ghosts', { keyPath: 'id' });
                    ghostStore.createIndex('captureTime', 'captureTime');
                    ghostStore.createIndex('type', 'type');
                }
                
                if (!db.objectStoreNames.contains('gameState')) {
                    db.createObjectStore('gameState', { keyPath: 'key' });
                }
            };
        });
    }

    async addGhost(ghost) {
        if (!this.db) {
            console.error('❌ IndexedDB não inicializado');
            return false;
        }
        
        try {
            const transaction = this.db.transaction(['ghosts'], 'readwrite');
            const store = transaction.objectStore('ghosts');
            
            const ghostData = {
                id: ghost.id,
                type: ghost.type || 'normal',
                captureTime: ghost.captureTime || Date.now(),
                points: ghost.points || 10,
                userId: gameState.currentUser?.uid || 'anonymous'
            };
            
            await new Promise((resolve, reject) => {
                const request = store.add(ghostData);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
            console.log('👻 Fantasma adicionado ao inventário:', ghost.id);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao adicionar fantasma:', error);
            return false;
        }
    }

    async removeGhost(ghostId) {
        if (!this.db) return false;
        
        try {
            const transaction = this.db.transaction(['ghosts'], 'readwrite');
            const store = transaction.objectStore('ghosts');
            
            await new Promise((resolve, reject) => {
                const request = store.delete(ghostId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
            console.log('🗑️ Fantasma removido do inventário:', ghostId);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao remover fantasma:', error);
            return false;
        }
    }

    async loadInventoryFromDB() {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['ghosts'], 'readonly');
            const store = transaction.objectStore('ghosts');
            
            const ghosts = await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            // Filter ghosts for current user
            const userGhosts = ghosts.filter(ghost => 
                ghost.userId === (gameState.currentUser?.uid || 'anonymous')
            );
            
            gameState.inventory = userGhosts;
            console.log(`📦 ${userGhosts.length} fantasmas carregados do banco`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar inventário:', error);
        }
    }

    async clearInventory() {
        if (!this.db) return false;
        
        try {
            const transaction = this.db.transaction(['ghosts'], 'readwrite');
            const store = transaction.objectStore('ghosts');
            
            // Get all ghosts for current user
            const userGhosts = gameState.inventory;
            
            // Delete each ghost
            for (const ghost of userGhosts) {
                await new Promise((resolve, reject) => {
                    const request = store.delete(ghost.id);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }
            
            // Clear from game state
            gameState.inventory = [];
            
            console.log('🧹 Inventário limpo');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao limpar inventário:', error);
            return false;
        }
    }

    getInventoryCount() {
        return gameState.inventory.length;
    }

    getMaxSlots() {
        return GAME_CONFIG.inventory.initialSlots + 
            Math.floor(gameState.ghostsDeposited / GAME_CONFIG.inventory.bonusThreshold) * 
            GAME_CONFIG.inventory.bonusSlots;
    }

    isFull() {
        return this.getInventoryCount() >= this.getMaxSlots();
    }

    getAvailableSlots() {
        return this.getMaxSlots() - this.getInventoryCount();
    }

    // Get inventory statistics
    getStats() {
        const inventory = gameState.inventory;
        const stats = {
            total: inventory.length,
            byType: {},
            totalPoints: 0,
            averagePoints: 0
        };
        
        inventory.forEach(ghost => {
            // Count by type
            stats.byType[ghost.type] = (stats.byType[ghost.type] || 0) + 1;
            
            // Sum points
            stats.totalPoints += ghost.points || 0;
        });
        
        // Calculate average
        if (stats.total > 0) {
            stats.averagePoints = Math.round(stats.totalPoints / stats.total);
        }
        
        return stats;
    }

    // Sort inventory by different criteria
    sortInventory(criteria = 'captureTime') {
        gameState.inventory.sort((a, b) => {
            switch (criteria) {
                case 'captureTime':
                    return b.captureTime - a.captureTime; // Newest first
                case 'points':
                    return b.points - a.points; // Highest points first
                case 'type':
                    return a.type.localeCompare(b.type); // Alphabetical
                default:
                    return 0;
            }
        });
    }

    // Export inventory data for sync
    exportForSync() {
        return {
            ghosts: gameState.inventory,
            timestamp: Date.now(),
            userId: gameState.currentUser?.uid || 'anonymous'
        };
    }

    // Import inventory data from sync
    async importFromSync(syncData) {
        if (!syncData || !syncData.ghosts) return false;
        
        try {
            // Clear current inventory
            await this.clearInventory();
            
            // Add synced ghosts
            for (const ghost of syncData.ghosts) {
                await this.addGhost(ghost);
                gameState.inventory.push(ghost);
            }
            
            console.log(`📥 ${syncData.ghosts.length} fantasmas importados do sync`);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao importar inventory:', error);
            return false;
        }
    }

    // Save game state to IndexedDB
    async saveGameState() {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['gameState'], 'readwrite');
            const store = transaction.objectStore('gameState');
            
            const stateData = {
                key: 'main',
                points: gameState.points,
                level: gameState.level,
                ghostsDeposited: gameState.ghostsDeposited,
                soundEnabled: gameState.soundEnabled,
                notificationsEnabled: gameState.notificationsEnabled,
                lastSaved: Date.now()
            };
            
            await new Promise((resolve, reject) => {
                const request = store.put(stateData);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
        } catch (error) {
            console.error('❌ Erro ao salvar estado:', error);
        }
    }

    // Load game state from IndexedDB
    async loadGameState() {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['gameState'], 'readonly');
            const store = transaction.objectStore('gameState');
            
            const stateData = await new Promise((resolve, reject) => {
                const request = store.get('main');
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            if (stateData) {
                gameState.points = stateData.points || 0;
                gameState.level = stateData.level || 1;
                gameState.ghostsDeposited = stateData.ghostsDeposited || 0;
                gameState.soundEnabled = stateData.soundEnabled !== false;
                gameState.notificationsEnabled = stateData.notificationsEnabled !== false;
                
                console.log('💾 Estado do jogo carregado');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar estado:', error);
        }
    }
}

// Initialize inventory manager
window.inventoryManager = new InventoryManager();