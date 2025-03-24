
export default {
    template: `
    <div class="register-container">
        <div class="card">
            <div class="card-header">
                <h3>Register</h3>
            </div>
            <div class="card-body">
                <form @submit.prevent="submitRegister">
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" v-model="email" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input type="password" v-model="password" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="fullName">Full Name:</label>
                        <input type="text" v-model="fullName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="qualification">Qualification:</label>
                        <input type="text" v-model="qualification" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="dob">Date of Birth:</label>
                        <input type="date" v-model="dob" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Register</button>
                </form>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            email: '',
            password: '',
            fullName: '',
            qualification: '',
            dob: ''
        }
    },
    methods: {
        async submitRegister() {
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: this.email,
                        password: this.password,
                        full_name: this.fullName,
                        qualification: this.qualification,
                        dob: this.dob
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Registration failed');
                }

                this.$router.push('/login');
            } catch (error) {
                console.error('Registration error:', error);
            }
        }
    }
}