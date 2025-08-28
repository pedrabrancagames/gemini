// Location and Map Manager
class LocationManager {
    constructor() {
        this.map = null;
        this.currentLocationMarker = null;
        this.selectedLocation = null;
        this.userMarker = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeMap();
    }

    setupEventListeners() {
        document.getElementById('confirm-location').addEventListener('click', () => {
            this.confirmLocation();
        });
    }

    initializeMap() {
        // Wait for the location screen to be visible
        const mapContainer = document.getElementById('map');
        if (!mapContainer || !mapContainer.offsetParent) {
            setTimeout(() => this.initializeMap(), 100);
            return;
        }

        // Initialize Leaflet map
        this.map = L.map('map').setView([
            GAME_CONFIG.testLocation.lat, 
            GAME_CONFIG.testLocation.lng
        ], 15);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add test location marker
        this.addLocationMarker(GAME_CONFIG.testLocation);

        // Set selected location to test location by default
        this.selectedLocation = GAME_CONFIG.testLocation;
        this.updateLocationInfo();

        // Try to show user's current position
        this.showUserPosition();
    }

    addLocationMarker(location) {
        // Create custom icon for game location
        const gameIcon = L.divIcon({
            className: 'game-location-marker',
            html: `
                <div style="
                    width: 40px;
                    height: 40px;
                    background: #00ff00;
                    border: 3px solid #fff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    box-shadow: 0 2px 10px rgba(0,255,0,0.5);
                ">👻</div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        // Add marker
        const marker = L.marker([location.lat, location.lng], { 
            icon: gameIcon 
        }).addTo(this.map);

        // Add circle to show game radius
        const circle = L.circle([location.lat, location.lng], {
            radius: location.radius,
            color: '#00ff00',
            fillColor: '#00ff00',
            fillOpacity: 0.1,
            weight: 2
        }).addTo(this.map);

        // Add popup
        marker.bindPopup(`
            <div style="text-align: center;">
                <h3 style="color: #00ff00; margin: 0 0 10px 0;">${location.name}</h3>
                <p style="margin: 0;">${location.description}</p>
                <button onclick="window.locationManager.selectLocation('${location.name}')" 
                        style="
                            background: #00ff00;
                            color: #000;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 4px;
                            margin-top: 10px;
                            cursor: pointer;
                            font-weight: bold;
                        ">
                    Selecionar
                </button>
            </div>
        `);

        // Click event to select location
        marker.on('click', () => {
            this.selectLocation(location.name);
        });

        return { marker, circle };
    }

    selectLocation(locationName) {
        // For now, we only have the test location
        this.selectedLocation = GAME_CONFIG.testLocation;
        this.updateLocationInfo();
        
        // Close any open popups
        this.map.closePopup();
        
        utils.showToast(`Local selecionado: ${locationName}`, 'success');
    }

    updateLocationInfo() {
        if (this.selectedLocation) {
            document.getElementById('selected-location').textContent = this.selectedLocation.name;
            document.getElementById('location-details').textContent = this.selectedLocation.description;
        }
    }

    async showUserPosition() {
        try {
            const position = await this.getCurrentPosition();
            
            gameState.userPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            };

            // Create user marker
            const userIcon = L.divIcon({
                className: 'user-location-marker',
                html: `
                    <div style="
                        width: 20px;
                        height: 20px;
                        background: #0088ff;
                        border: 3px solid #fff;
                        border-radius: 50%;
                        box-shadow: 0 2px 10px rgba(0,136,255,0.5);
                    "></div>
                `,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            if (this.userMarker) {
                this.map.removeLayer(this.userMarker);
            }

            this.userMarker = L.marker([
                gameState.userPosition.lat, 
                gameState.userPosition.lng
            ], { 
                icon: userIcon 
            }).addTo(this.map);

            this.userMarker.bindPopup('Sua localização atual');

            // Calculate distance to test location
            const distance = utils.calculateDistance(
                gameState.userPosition.lat,
                gameState.userPosition.lng,
                GAME_CONFIG.testLocation.lat,
                GAME_CONFIG.testLocation.lng
            );

            if (distance <= GAME_CONFIG.testLocation.radius) {
                utils.showToast('Você está dentro do raio de jogo!', 'success');
            } else {
                utils.showToast(
                    `Você está a ${utils.formatDistance(distance)} do local de jogo`, 
                    'info'
                );
            }

        } catch (error) {
            console.error('Erro ao obter localização:', error);
            utils.showToast('Não foi possível obter sua localização', 'error');
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalização não suportada'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    confirmLocation() {
        if (!this.selectedLocation) {
            utils.showToast('Nenhum local selecionado', 'error');
            return;
        }

        // Store selected location in game state
        gameState.currentLocation = this.selectedLocation;
        
        utils.showToast('Local confirmado!', 'success');
        
        // Proceed to permission screen
        setTimeout(() => {
            window.app.showScreen('permission');
        }, 1000);
    }

    // Check if user is within game radius
    isUserInRadius() {
        if (!gameState.userPosition || !gameState.currentLocation) {
            return false;
        }

        const distance = utils.calculateDistance(
            gameState.userPosition.lat,
            gameState.userPosition.lng,
            gameState.currentLocation.lat,
            gameState.currentLocation.lng
        );

        return distance <= gameState.currentLocation.radius;
    }

    // Get distance and bearing to game location
    getDistanceToLocation() {
        if (!gameState.userPosition || !gameState.currentLocation) {
            return null;
        }

        const distance = utils.calculateDistance(
            gameState.userPosition.lat,
            gameState.userPosition.lng,
            gameState.currentLocation.lat,
            gameState.currentLocation.lng
        );

        const bearing = utils.calculateBearing(
            gameState.userPosition.lat,
            gameState.userPosition.lng,
            gameState.currentLocation.lat,
            gameState.currentLocation.lng
        );

        return { distance, bearing };
    }

    // Update user position during game
    async updateUserPosition() {
        try {
            const position = await this.getCurrentPosition();
            
            gameState.userPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            };

            // Check if user is still in range
            const inRange = this.isUserInRadius();
            
            if (gameState.isInRange !== inRange) {
                gameState.isInRange = inRange;
                
                if (window.gameManager) {
                    window.gameManager.handleRangeChange(inRange);
                }
            }

            return gameState.userPosition;
            
        } catch (error) {
            console.error('Erro ao atualizar posição:', error);
            return null;
        }
    }

    // Start watching user position
    startLocationWatch() {
        if (!navigator.geolocation) {
            console.error('Geolocalização não suportada');
            return;
        }

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                gameState.userPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };

                // Check range
                const inRange = this.isUserInRadius();
                
                if (gameState.isInRange !== inRange) {
                    gameState.isInRange = inRange;
                    
                    if (window.gameManager) {
                        window.gameManager.handleRangeChange(inRange);
                    }
                }
            },
            (error) => {
                console.error('Erro de geolocalização:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 60000
            }
        );
    }

    // Stop watching user position
    stopLocationWatch() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    // Generate random ghost position within game radius
    generateGhostPosition() {
        if (!gameState.currentLocation) {
            return null;
        }

        return utils.generateRandomPosition(
            gameState.currentLocation.lat,
            gameState.currentLocation.lng,
            gameState.currentLocation.radius
        );
    }

    // Get containment unit QR code for current location
    getContainmentUnitQR() {
        // For now, return the Florianópolis QR code
        return QR_CODES.florianopolis;
    }
}

// Initialize location manager
window.locationManager = new LocationManager();