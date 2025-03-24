export default {
    template: `
    <div class="login-page">
        <div class="login-container">
            <div class="card">
                <div class="card-header">
                    <h3>Login</h3>
                </div>
                <div class="card-body">
                    <form @submit.prevent="submitLogin">
                        <div class="form-group">
                            <label for="email">Email:</label>
                            <input type="email" 
                                   id="email"
                                   v-model="email" 
                                   class="form-control" 
                                   required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password:</label>
                            <input type="password" 
                                   id="password"
                                   v-model="password" 
                                   class="form-control" 
                                   required>
                        </div>
                        <div v-if="error" class="alert alert-danger">
                            {{ error }}
                        </div>
                        <button type="submit" 
                                class="btn btn-primary w-100" 
                                :disabled="isLoading">
                            {{ isLoading ? 'Logging in...' : 'Login' }}
                        </button>
                    </form>
                    <div class="mt-3 text-center">
                        <router-link to="/register">Don't have an account? Register</router-link>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            email: '',
            password: '',
            error: null,
            isLoading: false
        }
    },
    methods: {
        async submitLogin() {
            this.error = null;
            this.isLoading = true;
            
            try {
                const res = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // Add this for session cookies
                    body: JSON.stringify({
                        email: this.email,
                        password: this.password
                    })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    // Store in Vuex and localStorage
                    this.$store.commit('setUser', data);
                    localStorage.setItem('user', JSON.stringify(data));
                    
                    // Add auth header for future requests
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                    }
                    
                    // Redirect based on role
                    const redirectPath = data.role === 'admin' ? '/admin_dashboard' : '/user_dashboard';
                    this.$router.push(redirectPath);
                } else {
                    const error = await res.json();
                    this.error = error.message || 'Invalid credentials';
                }
            } catch (err) {
                console.error('Login error:', err);
                this.error = 'Login failed. Please try again.';
            } finally {
                this.isLoading = false;
            }
        }
    },
    created() {
        // Check if already logged in
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            this.$router.push(user.role === 'admin' ? '/admin_dashboard' : '/user_dashboard');
        }
    }
}