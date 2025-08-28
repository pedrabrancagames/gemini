// Authentication Module
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            if (user) {
                gameState.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || 'Caçador Anônimo',
                    isAnonymous: user.isAnonymous
                };
                
                this.onLoginSuccess();
            } else {
                gameState.currentUser = null;
                this.showLoginScreen();
            }
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Google login
        document.getElementById('google-login').addEventListener('click', () => {
            this.loginWithGoogle();
        });

        // Email login
        document.getElementById('email-login').addEventListener('click', () => {
            this.showEmailModal();
        });

        // Anonymous login
        document.getElementById('anonymous-login').addEventListener('click', () => {
            this.loginAnonymously();
        });

        // Email form
        document.getElementById('email-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEmailLogin();
        });

        // Register button
        document.getElementById('register-btn').addEventListener('click', () => {
            this.handleEmailRegister();
        });

        // Close modal
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            const result = await auth.signInWithPopup(provider);
            utils.showToast('Login realizado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Google login error:', error);
            this.handleAuthError(error);
        }
    }

    async loginAnonymously() {
        try {
            await auth.signInAnonymously();
            utils.showToast('Entrando como jogador anônimo...', 'info');
            
        } catch (error) {
            console.error('Anonymous login error:', error);
            this.handleAuthError(error);
        }
    }

    showEmailModal() {
        document.getElementById('email-modal').classList.add('active');
    }

    async handleEmailLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            utils.showToast('Por favor, preencha todos os campos', 'error');
            return;
        }

        try {
            await auth.signInWithEmailAndPassword(email, password);
            document.getElementById('email-modal').classList.remove('active');
            utils.showToast('Login realizado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Email login error:', error);
            this.handleAuthError(error);
        }
    }

    async handleEmailRegister() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            utils.showToast('Por favor, preencha todos os campos', 'error');
            return;
        }

        if (password.length < 6) {
            utils.showToast('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        try {
            await auth.createUserWithEmailAndPassword(email, password);
            document.getElementById('email-modal').classList.remove('active');
            utils.showToast('Conta criada com sucesso!', 'success');
            
        } catch (error) {
            console.error('Email register error:', error);
            this.handleAuthError(error);
        }
    }

    async logout() {
        try {
            await auth.signOut();
            utils.showToast('Logout realizado com sucesso!', 'info');
            
            // Clear game state
            gameState.inventory = [];
            gameState.points = 0;
            gameState.level = 1;
            gameState.ghostsDeposited = 0;
            gameState.currentGhosts = [];
            
            // Clear local storage
            localStorage.removeItem('ghostbusters-ar-state');
            
            // Hide settings modal
            document.getElementById('settings-modal').classList.remove('active');
            
        } catch (error) {
            console.error('Logout error:', error);
            utils.showToast('Erro ao fazer logout', 'error');
        }
    }

    onLoginSuccess() {
        // Load saved game state
        utils.loadGameState();
        
        // Update UI settings
        document.getElementById('sound-toggle').checked = gameState.soundEnabled;
        document.getElementById('notifications-toggle').checked = gameState.notificationsEnabled;
        
        // Sync user data with Firebase
        this.syncUserData();
        
        // Hide login screen and show location selection
        this.showLocationScreen();
    }

    async syncUserData() {
        try {
            const userRef = database.ref(`users/${gameState.currentUser.uid}`);
            
            // Get existing data
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();
            
            if (userData) {
                // Merge server data with local data
                gameState.points = Math.max(gameState.points, userData.points || 0);
                gameState.level = Math.max(gameState.level, userData.level || 1);
                gameState.ghostsDeposited = Math.max(gameState.ghostsDeposited, userData.ghostsDeposited || 0);
            }
            
            // Update server with current data
            await userRef.update({
                displayName: gameState.currentUser.displayName,
                email: gameState.currentUser.email,
                points: gameState.points,
                level: gameState.level,
                ghostsDeposited: gameState.ghostsDeposited,
                lastLogin: firebase.database.ServerValue.TIMESTAMP
            });
            
            utils.saveGameState();
            
        } catch (error) {
            console.error('Sync error:', error);
        }
    }

    showLoginScreen() {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show login screen
        document.getElementById('login-screen').classList.add('active');
    }

    showLocationScreen() {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show location screen
        document.getElementById('location-screen').classList.add('active');
        
        // Initialize location selection
        if (window.locationManager) {
            window.locationManager.init();
        }
    }

    handleAuthError(error) {
        let message = 'Erro de autenticação';
        
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'Usuário não encontrado';
                break;
            case 'auth/wrong-password':
                message = 'Senha incorreta';
                break;
            case 'auth/email-already-in-use':
                message = 'Este email já está em uso';
                break;
            case 'auth/weak-password':
                message = 'Senha muito fraca';
                break;
            case 'auth/invalid-email':
                message = 'Email inválido';
                break;
            case 'auth/popup-closed-by-user':
                message = 'Login cancelado pelo usuário';
                break;
            case 'auth/popup-blocked':
                message = 'Popup bloqueado pelo navegador';
                break;
            case 'auth/operation-not-allowed':
                message = 'Método de login não permitido';
                break;
            case 'auth/network-request-failed':
                message = 'Erro de conexão. Verifique sua internet';
                break;
            default:
                message = error.message || 'Erro desconhecido';
        }
        
        utils.showToast(message, 'error');
    }

    // Get current user info for display
    getCurrentUserInfo() {
        if (!gameState.currentUser) return null;
        
        return {
            name: gameState.currentUser.displayName,
            email: gameState.currentUser.email,
            isAnonymous: gameState.currentUser.isAnonymous,
            points: gameState.points,
            level: gameState.level,
            ghostsDeposited: gameState.ghostsDeposited
        };
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!gameState.currentUser;
    }

    // Get user's Firebase UID
    getUserId() {
        return gameState.currentUser?.uid || null;
    }
}

// Initialize auth manager
const authManager = new AuthManager();