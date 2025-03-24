export default {
    template: `
        <nav class="navbar">
            <div class="container">
                <div class="navbar-header">
                    <span class="navbar-brand">
                        Quiz Masters
                        
                    </span>
                    <button class="navbar-toggle" @click="toggleMenu">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
                <div class="navbar-content">
                    <ul class="nav-list" :class="{ 'nav-list-open': isMenuOpen }">
                        <!-- Admin Navigation -->
                        <template v-if="isAdmin">
                            <li class="nav-item">
                                <router-link class="nav-link" to="/admin_dashboard">Dashboard</router-link>
                            <li class="nav-item">
                                <router-link class="nav-link" to="/subjects">Subject Management</router-link>
                            </li>
                            <li class="nav-item">
                                <router-link class="nav-link" to="/quiz_management">Quiz Management</router-link>
                            </li>
                            <li class="nav-item">
                                <router-link class="nav-link" to="/users">Users Data</router-link>
                            </li>
                        </template>

                        <!-- User Navigation -->
                        <template v-if="isUser">
                            <li class="nav-item">
                                <router-link class="nav-link" to="/user_dashboard">Dashboard</router-link>
                            </li>
                            <li class="nav-item">
                                <router-link class="nav-link" to="/quiz_challenge">Take Quiz</router-link>
                            </li>
                            <li class="nav-item">
                                <router-link class="nav-link" to="/quiz_history">Quiz History</router-link>
                            </li>
                        </template>

                        <!-- User Info & Logout -->
                        <template v-if="isLoggedIn">
 
                            <li class="nav-item">
                                <a class="nav-link logout-btn" @click="logout">Logout</a>
                            </li>
                        </template>
                    </ul>
                </div>
            </div>
        </nav>
    `,
    data() {
        return {
            isMenuOpen: false
        };
    },
    computed: {
        isLoggedIn() {
            return this.$store.state.user !== null;
        },
        isAdmin() {
            return this.isLoggedIn && this.$store.state.user.role === 'admin';
        },
        isUser() {
            return this.isLoggedIn && this.$store.state.user.role === 'user';
        },
        
    },
    methods: {
        toggleMenu() {
            this.isMenuOpen = !this.isMenuOpen;
        },
        async logout() {
            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                
                if (response.ok) {
                    // Clear store first
                    this.$store.commit('clearUser');
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    // Then navigate
                    await this.$router.push('/login');
                }
            } catch (error) {
                console.error('Logout failed:', error);
            }
        }
    }
}