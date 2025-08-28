// AR Manager - Handles 3D rendering and AR functionality
class ARManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.isInitialized = false;
        this.ghosts = new Map();
        this.init();
    }

    init() {
        console.log('🥽 AR Manager inicializado');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Wait for A-Frame to be ready
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                this.initializeAR();
            }, 1000);
        });
    }

    initializeAR() {
        this.scene = document.getElementById('ar-scene');
        this.camera = document.getElementById('ar-camera');
        
        if (!this.scene || !this.camera) {
            console.error('❌ AR Scene ou Camera não encontrados');
            return;
        }
        
        // Wait for A-Frame to initialize
        this.scene.addEventListener('loaded', () => {
            this.onSceneLoaded();
        });
        
        // If already loaded
        if (this.scene.hasLoaded) {
            this.onSceneLoaded();
        }
    }

    onSceneLoaded() {
        console.log('📡 AR Scene carregada');
        this.isInitialized = true;
        
        // Setup AR-specific configurations
        this.setupARConfiguration();
    }

    setupARConfiguration() {
        // Configure AR.js settings
        if (this.scene.systems.arjs) {
            const arjsSystem = this.scene.systems.arjs;
            
            // Set tracking parameters
            arjsSystem.data.detectionMode = 'mono_and_matrix';
            arjsSystem.data.matrixCodeType = '3x3';
            arjsSystem.data.debugUIEnabled = false;
        }
        
        // Add ambient lighting
        this.addLighting();
        
        // Setup camera controls
        this.setupCameraControls();
    }

    addLighting() {
        // Add directional light for ghost visibility
        const directionalLight = document.createElement('a-light');
        directionalLight.setAttribute('type', 'directional');
        directionalLight.setAttribute('position', '0 5 5');
        directionalLight.setAttribute('color', '#ffffff');
        directionalLight.setAttribute('intensity', '0.8');
        this.scene.appendChild(directionalLight);
        
        // Add ambient light
        const ambientLight = document.createElement('a-light');
        ambientLight.setAttribute('type', 'ambient');
        ambientLight.setAttribute('color', '#404040');
        ambientLight.setAttribute('intensity', '0.4');
        this.scene.appendChild(ambientLight);
    }

    setupCameraControls() {
        if (!this.camera) return;
        
        // Disable default controls for AR
        this.camera.setAttribute('look-controls', 'enabled: false');
        this.camera.setAttribute('wasd-controls', 'enabled: false');
        
        // Setup raycaster for ghost interaction
        this.camera.setAttribute('cursor', 'rayOrigin: mouse');
        this.camera.setAttribute('raycaster', 'objects: .ghost; far: 100');
    }

    start() {
        if (!this.isInitialized) {
            console.log('⏳ AR não inicializado ainda');
            return;
        }
        
        console.log('🎯 Iniciando AR...');
        
        // Start AR camera
        this.startARCamera();
        
        // Show AR scene
        this.scene.style.display = 'block';
    }

    async startARCamera() {
        // AR.js handles camera initialization automatically via a-scene component
        console.log('📸 Câmera AR será iniciada pelo AR.js');
    }

    addGhost(ghost) {
        if (!this.isInitialized || !this.scene) {
            console.log('⏳ AR não pronto para adicionar fantasma');
            return;
        }
        
        // Create ghost entity
        const ghostEntity = document.createElement('a-entity');
        ghostEntity.setAttribute('id', `ghost-${ghost.id}`);
        ghostEntity.setAttribute('class', 'ghost raycastable');
        
        // Load 3D model
        ghostEntity.setAttribute('gltf-model', '#ghost-model');
        
        // Set position
        ghostEntity.setAttribute('position', `${ghost.arPosition.x} ${ghost.arPosition.y} ${ghost.arPosition.z}`);
        
        // Set scale
        ghostEntity.setAttribute('scale', `${GAME_CONFIG.ar.ghostScale} ${GAME_CONFIG.ar.ghostScale} ${GAME_CONFIG.ar.ghostScale}`);
        
        // Add floating animation
        ghostEntity.setAttribute('animation', {
            property: 'position',
            to: `${ghost.arPosition.x} ${ghost.arPosition.y + 0.5} ${ghost.arPosition.z}`,
            dur: 2000,
            easing: 'easeInOutSine',
            loop: true,
            dir: 'alternate'
        });
        
        // Add rotation animation
        ghostEntity.setAttribute('animation__rotation', {
            property: 'rotation',
            to: '0 360 0',
            dur: 8000,
            easing: 'linear',
            loop: true
        });
        
        // Add glow effect
        ghostEntity.setAttribute('material', {
            transparent: true,
            opacity: 0.9
        });
        
        // Add click handler for debugging
        ghostEntity.addEventListener('click', () => {
            console.log('👻 Fantasma clicado:', ghost.id);
        });
        
        // Add to scene
        this.scene.appendChild(ghostEntity);
        
        // Store reference
        this.ghosts.set(ghost.id, ghostEntity);
        
        console.log('👻 Fantasma adicionado à cena AR:', ghost.id);
    }

    removeGhost(ghostId) {
        const ghostEntity = this.ghosts.get(ghostId);
        
        if (ghostEntity && ghostEntity.parentNode) {
            // Add disappearing animation
            ghostEntity.setAttribute('animation__fadeout', {
                property: 'material.opacity',
                to: 0,
                dur: 500,
                easing: 'easeInQuad'
            });
            
            // Add scale down animation
            ghostEntity.setAttribute('animation__scaledown', {
                property: 'scale',
                to: '0 0 0',
                dur: 500,
                easing: 'easeInQuad'
            });
            
            // Remove after animation
            setTimeout(() => {
                if (ghostEntity.parentNode) {
                    ghostEntity.parentNode.removeChild(ghostEntity);
                }
                this.ghosts.delete(ghostId);
            }, 500);
            
            console.log('💨 Fantasma removido da cena AR:', ghostId);
        }
    }

    clearAllGhosts() {
        console.log('🧹 Limpando todos os fantasmas da cena AR');
        
        this.ghosts.forEach((ghostEntity, ghostId) => {
            if (ghostEntity.parentNode) {
                ghostEntity.parentNode.removeChild(ghostEntity);
            }
        });
        
        this.ghosts.clear();
    }

    updateGhostPosition(ghostId, newPosition) {
        const ghostEntity = this.ghosts.get(ghostId);
        
        if (ghostEntity) {
            ghostEntity.setAttribute('position', 
                `${newPosition.x} ${newPosition.y} ${newPosition.z}`
            );
        }
    }

    // Get ghost entity for interaction
    getGhost(ghostId) {
        return this.ghosts.get(ghostId);
    }

    // Raycast to find ghost under cursor
    raycastGhosts() {
        if (!this.camera) return null;
        
        const raycaster = this.camera.components.raycaster;
        if (!raycaster) return null;
        
        const intersections = raycaster.intersectedEls;
        
        // Find closest ghost
        let closestGhost = null;
        let closestDistance = Infinity;
        
        intersections.forEach(el => {
            if (el.classList.contains('ghost')) {
                const distance = el.getAttribute('distance') || 0;
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestGhost = el;
                }
            }
        });
        
        return closestGhost;
    }

    // Handle orientation change
    handleOrientationChange() {
        if (!this.scene) return;
        
        // Force scene resize
        setTimeout(() => {
            const canvas = this.scene.canvas;
            if (canvas) {
                canvas.style.width = '100vw';
                canvas.style.height = '100vh';
            }
            
            // Trigger resize event
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }

    // Add visual effects
    addProtonBeamEffect(fromPosition, toPosition) {
        const beam = document.createElement('a-entity');
        beam.setAttribute('id', 'proton-beam');
        
        // Create beam geometry
        beam.setAttribute('geometry', {
            primitive: 'cylinder',
            radius: 0.05,
            height: this.calculateDistance3D(fromPosition, toPosition)
        });
        
        // Beam material with glow
        beam.setAttribute('material', {
            color: '#00ff00',
            emissive: '#00ff00',
            transparent: true,
            opacity: 0.8
        });
        
        // Position beam
        const midPoint = {
            x: (fromPosition.x + toPosition.x) / 2,
            y: (fromPosition.y + toPosition.y) / 2,
            z: (fromPosition.z + toPosition.z) / 2
        };
        
        beam.setAttribute('position', `${midPoint.x} ${midPoint.y} ${midPoint.z}`);
        
        // Rotate beam to point from start to end
        const rotation = this.calculateBeamRotation(fromPosition, toPosition);
        beam.setAttribute('rotation', `${rotation.x} ${rotation.y} ${rotation.z}`);
        
        // Add to scene
        this.scene.appendChild(beam);
        
        // Remove after short duration
        setTimeout(() => {
            if (beam.parentNode) {
                beam.parentNode.removeChild(beam);
            }
        }, 200);
    }

    calculateDistance3D(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dz = pos2.z - pos1.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    calculateBeamRotation(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dz = to.z - from.z;
        
        const yaw = Math.atan2(dx, dz) * 180 / Math.PI;
        const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * 180 / Math.PI;
        
        return { x: pitch, y: yaw, z: 0 };
    }

    // Performance monitoring
    getPerformanceStats() {
        if (!this.scene || !this.scene.renderer) {
            return null;
        }
        
        const renderer = this.scene.renderer;
        return {
            fps: this.scene.time ? Math.round(1000 / this.scene.time) : 0,
            drawCalls: renderer.info ? renderer.info.render.calls : 0,
            triangles: renderer.info ? renderer.info.render.triangles : 0,
            ghostCount: this.ghosts.size
        };
    }

    // Easter egg methods
    addEcto1() {
        // Add Ecto-1 model as easter egg
        const ecto1 = document.createElement('a-entity');
        ecto1.setAttribute('id', 'ecto1');
        ecto1.setAttribute('position', '10 0 -15');
        ecto1.setAttribute('scale', '2 2 2');
        
        // Use a placeholder box for now (would be replaced with actual model)
        ecto1.setAttribute('geometry', 'primitive: box; width: 4; height: 2; depth: 8');
        ecto1.setAttribute('material', 'color: white');
        
        this.scene.appendChild(ecto1);
        
        utils.showToast('Ecto-1 apareceu!', 'success');
    }

    addSlimer() {
        // Add Slimer as floating companion
        const slimer = document.createElement('a-entity');
        slimer.setAttribute('id', 'slimer');
        slimer.setAttribute('position', '2 2 -3');
        slimer.setAttribute('scale', '0.5 0.5 0.5');
        
        // Use a placeholder sphere for now
        slimer.setAttribute('geometry', 'primitive: sphere; radius: 1');
        slimer.setAttribute('material', 'color: green; transparent: true; opacity: 0.8');
        
        // Add floating animation
        slimer.setAttribute('animation', {
            property: 'position',
            to: '2 3 -3',
            dur: 1500,
            easing: 'easeInOutSine',
            loop: true,
            dir: 'alternate'
        });
        
        this.scene.appendChild(slimer);
        
        utils.showToast('Slimer é seu aliado agora!', 'success');
    }
}

// Initialize AR manager
window.arManager = new ARManager();