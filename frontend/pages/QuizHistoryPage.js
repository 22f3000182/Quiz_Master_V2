export default {
    name: 'QuizHistoryPage',
    data() {
        return {
            quizHistory: [],
            selectedQuiz: null,
            previewData: [],
            showPreviewModal: false,
            isLoading: true,
            error: null,
            showStatsModal: false,
            statsData: null,
            scoreChartOptions: {
                chart: {
                    type: 'pie',
                    foreColor: '#fff'
                },
                labels: ['Correct', 'Incorrect'],
                colors: ['#00ff00', '#ff0000'],
                theme: {
                    mode: 'dark'
                }
            },
            questionChartOptions: {
                chart: {
                    type: 'bar',
                    foreColor: '#fff'
                },
                plotOptions: {
                    bar: {
                        horizontal: true
                    }
                },
                theme: {
                    mode: 'dark'
                },
                xaxis: {
                    categories: []
                }
            }
        }
    },
    async created() {
        await this.fetchQuizHistory();
    },
    methods: {

        async fetchQuizHistory() {
            try {
                this.isLoading = true;
                const response = await fetch('/quiz_history', {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch quiz history');
                }
                
                this.quizHistory = await response.json();
            } catch (error) {
                console.error('Error:', error);
                this.error = error.message;
            } finally {
                this.isLoading = false;
            }
        },
        
        async showPreview(quiz) {
            try {
                if (!quiz.preview_id) {
                    console.error('Preview ID is missing:', quiz);
                    this.error = 'Preview not available for this quiz';
                    return;
                }
                
                const response = await fetch(`/quiz_preview/${quiz.preview_id}`, {
                    credentials: 'include'
                });
        
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Preview not found. The record may have been deleted.');
                    } else {
                        throw new Error(`Server error: ${response.status}`);
                    }
                }
        
                const data = await response.json();
                console.log('Raw preview data:', data);
        
                // Update previewData with questions array directly
                this.previewData = data.questions;
                this.selectedQuiz = {
                    ...quiz,
                    quiz_name: data.quiz_name,
                    total_questions: data.total_questions
                };
                this.showPreviewModal = true;
        
            } catch (error) {
                console.error('Preview error:', error);
                this.error = error.message;
            }
        },
        closePreview() {
            this.showPreviewModal = false;
            this.selectedQuiz = null;
            this.previewData = [];
        },

        
        async showStats(quiz) {
            try {
                const response = await fetch(`/quiz_stats/${quiz.preview_id}`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch stats');
                }

                this.statsData = await response.json();
                this.showStatsModal = true;

                // Update chart data
                this.$nextTick(() => {
                    new ApexCharts(this.$refs.scoreChart, {
                        ...this.scoreChartOptions,
                        series: [this.statsData.correct_count, this.statsData.incorrect_count]
                    }).render();

                    new ApexCharts(this.$refs.questionChart, {
                        ...this.questionChartOptions,
                        series: [{
                            name: 'Questions',
                            data: this.statsData.questions.map(q => q.is_correct ? 1 : 0)
                        }],
                        xaxis: {
                            categories: this.statsData.questions.map((_, i) => `Q${i + 1}`)
                        }
                    }).render();
                });
            } catch (error) {
                console.error('Stats error:', error);
                this.error = error.message;
            }
        },
        closeStats() {
            this.showStatsModal = false;
            this.statsData = null;
        }
    },
    template: `
        <div class="quiz-history-container">
            <h2 class="neon-title">Quiz History</h2>

            <div v-if="isLoading" class="loading">Loading...</div>
            
            <div v-else-if="error" class="error">{{ error }}</div>
            
            <div v-else-if="quizHistory.length === 0" class="no-data">
                No quiz history available
            </div>
            
            <div v-else>
                <table class="quiz-history-table">
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Chapter</th>
                            <th>Quiz</th>
                            <th>Attempt Time</th>
                            <th>Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="quiz in quizHistory" :key="quiz.attempt_time">
                            <td>{{ quiz.subject }}</td>
                            <td>{{ quiz.chapter }}</td>
                            <td>{{ quiz.quiz_name }}</td>
                            <td>{{ quiz.attempt_time }}</td>
                            <td>{{ quiz.score }}</td>
                            <td>
                            <div class="button-group">
                                <button class="neon-button" @click="showPreview(quiz)">
                                    Preview
                                </button>
                                <button class="neon-button stats-button" @click="showStats(quiz)">
                                    Stats
                                </button>
                            </div>
                        </td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="showStatsModal && statsData" class="modal">
                    <div class="modal-content stats-modal">
                        <h3>Quiz Performance Statistics</h3>
                        
                        <div class="stats-grid">
                            <div class="stats-card">
                                <h4>Score Distribution</h4>
                                <div ref="scoreChart"></div>
                            </div>
                            
                            <div class="stats-card">
                                <h4>Question-wise Performance</h4>
                                <div ref="questionChart"></div>
                            </div>
                            
                            <div class="stats-summary">
                                <p>Total Score: {{ statsData.total_score }}</p>
                                <p>Correct Answers: {{ statsData.correct_count }}</p>
                                <p>Incorrect Answers: {{ statsData.incorrect_count }}</p>
                                <p>Accuracy: {{ Math.round(statsData.accuracy) }}%</p>
                            </div>
                        </div>

                        <button class="close-btn" @click="closeStats">Close</button>
                    </div>
                </div>

                <!-- Preview Modal -->
                <div v-if="showPreviewModal && selectedQuiz" class="modal">
                    <div class="modal-content">
                        <h3>{{ selectedQuiz.quiz_name }} - Preview</h3>
                        
                        <div v-if="previewData && previewData.length > 0">
                            <div v-for="(question, index) in previewData" 
                                 :key="index" 
                                 class="question">
                                <p class="question-statement">
                                    Question {{ index + 1 }}: {{ question.question_statement }}
                                </p>
                                <div class="options-grid">
                                    <div v-for="(option, optIndex) in question.options" 
                                         :key="optIndex"
                                         :class="{
                                             'option-box': true,
                                             'correct-answer': option === question.correct_answer,
                                             'wrong-answer': option === question.selected_answer && option !== question.correct_answer,
                                             'selected-answer': option === question.selected_answer
                                         }">
                                        {{ option }}
                                    </div>
                                </div>
                                <p class="marks-info">
                                    Marks: {{ question.is_correct ? question.marks : 0 }}/{{ question.marks }}
                                </p>
                            </div>
                        </div>
                        <div v-else>
                            <p>No preview data available</p>
                        </div>
                        
                        <button class="close-btn" @click="closePreview">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `
}