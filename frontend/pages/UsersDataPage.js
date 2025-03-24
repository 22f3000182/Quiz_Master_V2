export default {
    data() {
        return {
            users: [],
            showDeleteModal: false,
            showPerformanceModal: false,
            selectedUser: null,
            subjects: [],
            selectedSubject: null,
            subjectChart: null,
            chapterChart: null,
            chartOptions: {
                chart: {
                    type: 'bar',
                    height: 350,
                    foreColor: '#fff',
                    toolbar: { show: false }
                },
                plotOptions: {
                    bar: {
                        horizontal: false,
                        columnWidth: '55%',
                        endingShape: 'rounded'
                    }
                },
                dataLabels: { enabled: false },
                xaxis: {
                    categories: [],
                    labels: { style: { colors: '#fff' } }
                },
                yaxis: {
                    title: { 
                        text: 'Score (%)',
                        style: { color: '#fff' }
                    },
                    min: 0,
                    max: 100,
                    labels: { style: { colors: '#fff' } }
                },
                fill: {
                    opacity: 1,
                    colors: ['#00e1ff', '#ff00ff']
                },
                tooltip: {
                    theme: 'dark',
                    y: { formatter: (val) => `${val}%` }
                },
                theme: { mode: 'dark' }
            }
        }
    },
    methods: {
        async fetchUsers() {
            try {
                const response = await fetch('/admin/users', {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to fetch users');
                }
                
                this.users = await response.json();
            } catch (error) {
                console.error('Error:', error);
                this.error = error.message;
            }
        },

        showUserPerformance(user) {
            this.selectedUser = user;
            this.showPerformanceModal = true;
            this.fetchUserPerformance(user.id);
        },

        async fetchUserPerformance(userId) {
            await this.fetchSubjects();
            await this.fetchSubjectPerformance(userId);
            if (this.subjects.length > 0) {
                await this.showChapterPerformance(this.subjects[0], userId);
            }
        },

        async fetchSubjects() {
            try {
                const response = await fetch('/subjects', {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to fetch subjects');
                this.subjects = await response.json();
            } catch (error) {
                console.error('Error:', error);
            }
        },

        async fetchSubjectPerformance(userId) {
            try {
                const response = await fetch(`/admin/user_performance/${userId}/subjects`, {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to fetch subject performance');
                const data = await response.json();
                this.initializeSubjectChart(data);
            } catch (error) {
                console.error('Error:', error);
            }
        },

        async showChapterPerformance(subject, userId) {
            try {
                this.selectedSubject = subject;
                const response = await fetch(`/admin/user_performance/${userId}/chapters/${subject.id}`, {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to fetch chapter performance');
                const data = await response.json();
                this.initializeChapterChart(data);
            } catch (error) {
                console.error('Error:', error);
            }
        },

        initializeSubjectChart(data) {
            const options = {
                ...this.chartOptions,
                series: [{
                    name: 'Best Score',
                    data: data.best_scores
                }, {
                    name: 'Average Score',
                    data: data.avg_scores
                }],
                xaxis: {
                    ...this.chartOptions.xaxis,
                    categories: data.subjects
                }
            };

            this.$nextTick(() => {
                if (this.subjectChart) {
                    this.subjectChart.destroy();
                }
                this.subjectChart = new ApexCharts(
                    this.$refs.subjectChart,
                    options
                );
                this.subjectChart.render();
            });
        },

        initializeChapterChart(data) {
            const options = {
                ...this.chartOptions,
                series: [{
                    name: 'Best Score',
                    data: data.best_scores
                }, {
                    name: 'Average Score',
                    data: data.avg_scores
                }],
                xaxis: {
                    ...this.chartOptions.xaxis,
                    categories: data.chapters
                }
            };

            this.$nextTick(() => {
                if (this.chapterChart) {
                    this.chapterChart.destroy();
                }
                this.chapterChart = new ApexCharts(
                    this.$refs.chapterChart,
                    options
                );
                this.chapterChart.render();
            });
        },

        confirmDelete(user) {
            this.selectedUser = user;
            this.showDeleteModal = true;
        },

        async deleteUser() {
            try {
                const response = await fetch(`/admin/delete_user/${this.selectedUser.id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                if (!response.ok) throw new Error('Failed to delete user');
                
                this.users = this.users.filter(u => u.id !== this.selectedUser.id);
                this.showDeleteModal = false;
                this.selectedUser = null;
            } catch (error) {
                console.error('Error:', error);
            }
        }
    },
    mounted() {
        this.fetchUsers();
    },
    beforeDestroy() {
        if (this.subjectChart) {
            this.subjectChart.destroy();
        }
        if (this.chapterChart) {
            this.chapterChart.destroy();
        }
    },
    template: `
        <div class="users-page">
            <div class="users-grid">
                <div class="user-card" v-for="user in users" :key="user.id">
                    <div class="card-header">
                        <img :src="user.photoUrl || '/static/pics/default-avatar.jpg'" alt="User Photo">
                        <h3>{{ user.name }}</h3>
                    </div>
                    <div class="card-body">
                        <p><i class="fas fa-envelope"></i> {{ user.email }}</p>
                        <p><i class="fas fa-calendar"></i> {{ user.dob }}</p>
                        <p><i class="fas fa-graduation-cap"></i> {{ user.qualifications }}</p>
                    </div>
                    <div class="card-actions">
                        <button @click="showUserPerformance(user)" class="view-btn">
                            <i class="fas fa-chart-bar"></i> View Performance
                        </button>
                        <button @click="confirmDelete(user)" class="delete-btn">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>

            <!-- Performance Modal -->
            <div class="modal" v-if="showPerformanceModal">
                <div class="modal-content performance-modal">
                    <div class="modal-header">
                        <h2>Performance Stats</h2>
                        <button @click="showPerformanceModal = false" class="close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="performance-charts">
                        <div class="performance-card">
                            <h3>Subject Performance</h3>
                            <div ref="subjectChart" class="performance-chart"></div>
                        </div>
                        <div class="performance-card">
                            <h3>Chapter Performance</h3>
                            <div class="subject-buttons">
                                <button 
                                    v-for="subject in subjects" 
                                    :key="subject.id"
                                    @click="showChapterPerformance(subject, selectedUser.id)"
                                    :class="['subject-btn', { active: selectedSubject?.id === subject.id }]"
                                >
                                    {{ subject.name }}
                                </button>
                            </div>
                            <div ref="chapterChart" class="performance-chart"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div class="modal" v-if="showDeleteModal">
                <div class="modal-content delete-modal">
                    <h2>Delete User</h2>
                    <p>Are you sure you want to delete {{ selectedUser?.name }}?</p>
                    <div class="button-group">
                        <button @click="deleteUser" class="delete-btn">Delete</button>
                        <button @click="showDeleteModal = false" class="cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `
}