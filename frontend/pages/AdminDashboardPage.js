export default {
    template: `
    <div class="admin-dashboard">
        <div class="dashboard-grid">
            <!-- Profile Card -->
            <div class="profile-card" v-if="user">
                <div class="profile-photo">
                    <img :src="user.photoUrl || '/static/pics/default-avatar.jpg'" alt="Profile">
                    <div class="photo-overlay">
                        <label for="photo-upload" class="upload-btn">
                            <i class="fas fa-camera"></i>
                        </label>
                        <input 
                            id="photo-upload" 
                            type="file" 
                            @change="handlePhotoUpload" 
                            accept="image/*" 
                            hidden
                        >
                    </div>
                </div>

                <div class="profile-details">
                    <div class="name-banner">
                        <h2>{{ user.name }}</h2>
                        <span class="admin-badge">Administrator</span>
                    </div>
                    
                    <div class="user-info">
                        <div class="info-item">
                            <i class="fas fa-envelope"></i>
                            <p><strong>Email:</strong> {{ user.Email }}</p>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calendar"></i>
                            <p><strong>DOB:</strong> {{ user.Dob }}</p>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-graduation-cap"></i>
                            <p><strong>Qualifications:</strong> {{ user.Qualifications }}</p>
                        </div>
                    </div>

                    <button @click="showEditModal" class="edit-btn">
                        <i class="fas fa-edit"></i> Edit Profile
                    </button>
                </div>

                <!-- Edit Modal -->
                <div class="modal" v-if="isModalOpen">
                    <div class="modal-content">
                        <h2>Edit Profile</h2>
                        <form @submit.prevent="updateProfile">
                            <div class="form-group">
                                <label>Full Name:</label>
                                <input v-model="editForm.name" type="text" required>
                            </div>
                            <div class="form-group">
                                <label>Date of Birth:</label>
                                <input v-model="editForm.dob" type="date">
                            </div>
                            <div class="form-group">
                                <label>Qualifications:</label>
                                <input v-model="editForm.qualifications" type="text">
                            </div>
                            <div class="form-group">
                                <label>Profile Photo:</label>
                                <input type="file" @change="handlePhotoUpload" accept="image/*">
                            </div>
                            <div class="button-group">
                                <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
                                <button type="submit" class="save-btn">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>


            <!-- Stats Container -->
            <div class="stats-container">
                <div class="performance-card">
                    <h3><i class="fas fa-chart-bar"></i> Overall Subject Performance</h3>
                    <div ref="subjectChart" class="performance-chart"></div>
                </div>

                <div class="performance-card">
                    <h3><i class="fas fa-chart-line"></i> Chapter Performance</h3>
                    <div class="subject-buttons">
                        <button 
                            v-for="subject in subjects" 
                            :key="subject.id"
                            @click="showChapterPerformance(subject)"
                            :class="['subject-btn', { active: selectedSubject?.id === subject.id }]"
                        >
                            {{ subject.name }}
                        </button>
                    </div>
                    <div ref="chapterChart" class="performance-chart"></div>
                </div>
            </div>
        </div>
    </div> `,

    data() {
        return {
            user: null,
            error: null,
            isModalOpen: false,
            subjects: [],
            selectedSubject: null,
            subjectChart: null,
            chapterChart: null,
            editForm: {
                name: '',
                photoUrl: '',
                dob: '',
                qualifications: ''
            },
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
        async fetchAdminData() {
            try {
                const response = await fetch('/admin/data', {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to fetch admin data');
                this.user = await response.json();
                this.editForm = {
                    name: this.user.name,
                    photoUrl: this.user.photoUrl,
                    dob: this.user.Dob,
                    qualifications: this.user.Qualifications
                };
            } catch (error) {
                console.error('Error:', error);
                this.error = error.message;
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
                this.error = error.message;
            }
        },

        async fetchOverallPerformance() {
            try {
                const response = await fetch('/admin/overall_performance', {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to fetch overall performance');
                const data = await response.json();
                this.initializeSubjectChart(data);
            } catch (error) {
                console.error('Error:', error);
                this.error = error.message;
            }
        },

        async showChapterPerformance(subject) {
            try {
                this.selectedSubject = subject;
                const response = await fetch(`/admin/subject_chapter_performance/${subject.id}`, {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to fetch chapter performance');
                const data = await response.json();
                this.initializeChapterChart(data);
            } catch (error) {
                console.error('Error:', error);
                this.error = error.message;
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

        showEditModal() {
            this.isModalOpen = true;
        },

        closeModal() {
            this.isModalOpen = false;
        },

        async handlePhotoUpload(event) {
            const file = event.target.files[0];
            if (file) {
                this.editForm.photoFile = file;
            }
        },

        async updateProfile() {
            try {
                const formData = new FormData();
                formData.append('name', this.editForm.name);
                formData.append('dob', this.editForm.dob);
                formData.append('qualifications', this.editForm.qualifications);
                
                if (this.editForm.photoFile) {
                    formData.append('photo', this.editForm.photoFile);
                }

                const response = await fetch('/admin/update_profile', {
                    method: 'PUT',
                    credentials: 'include',
                    body: formData
                });

                if (!response.ok) throw new Error('Failed to update profile');
                
                await this.fetchAdminData();
                this.closeModal();
            } catch (error) {
                console.error('Error:', error);
                this.error = error.message;
            }
        }
    },
    async mounted() {
        await this.fetchAdminData();
        await this.fetchSubjects();
        if (this.subjects.length > 0) {
            await this.fetchOverallPerformance();
            await this.showChapterPerformance(this.subjects[0]);
        }
    },
    beforeDestroy() {
        if (this.subjectChart) {
            this.subjectChart.destroy();
        }
        if (this.chapterChart) {
            this.chapterChart.destroy();
        }
    }
}