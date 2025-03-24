export default new Vuex.Store({
    state: {
        user: JSON.parse(localStorage.getItem('user')) || null,
        subjects: [],
        chapters: [],
        quizzes: [],
        currentQuiz: null,
        isLoading: false,
        error: null
    },
    mutations: {
        setUser(state, user) {
            state.user = user;
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                localStorage.removeItem('user');
            }
        },
        clearUser(state) {
            state.user = null;
            localStorage.removeItem('user');
        },
        setSubjects(state, subjects) {
            state.subjects = subjects;
        },
        setChapters(state, chapters) {
            state.chapters = chapters;
        },
        setQuizzes(state, quizzes) {
            state.quizzes = quizzes;
        },
        setCurrentQuiz(state, quiz) {
            state.currentQuiz = quiz;
        },
        setLoading(state, value) {
            state.isLoading = value;
        },
        setError(state, error) {
            state.error = error;
        }
    },
    actions: {
        async login({ commit }, credentials) {
            try {
                commit('setLoading', true);
                commit('setError', null);
                
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(credentials)
                });

                if (!response.ok) {
                    throw new Error('Login failed');
                }

                const userData = await response.json();
                commit('setUser', userData);
                localStorage.setItem('user', JSON.stringify(userData));
                return true;
            } catch (error) {
                commit('setError', error.message);
                return false;
            } finally {
                commit('setLoading', false);
            }
        },
        async logout({ commit }) {
            try {
                await fetch('/logout', { method: 'POST' });
                commit('clearUser');
                return true;
            } catch (error) {
                commit('setError', error.message);
                return false;
            }
        },
        async fetchSubjects({ commit }) {
            try {
                commit('setLoading', true);
                const response = await fetch('/subjects');
                const subjects = await response.json();
                commit('setSubjects', subjects);
            } catch (error) {
                commit('setError', error.message);
            } finally {
                commit('setLoading', false);
            }
        }
    },
    getters: {
        isAuthenticated: state => !!state.user,
        userRole: state => state.user ? state.user.roles[0] : null,
        isAdmin: state => state.user && state.user.roles.includes('admin')
    }
});