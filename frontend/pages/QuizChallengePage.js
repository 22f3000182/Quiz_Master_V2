export default {
    name: 'UserQuizChallenge',
    template: `
        <div class="quiz-challenge">
            <div class="left-container">
                <!-- Subjects List -->
                <div v-if="!selectedSubject" class="subjects-list">
                    <h2>Subjects</h2>
                    <div v-for="subject in subjects" :key="subject.id" @click="selectSubject(subject)" class="list-item">
                        {{ subject.name }}
                    </div>
                </div>
                
                <!-- Chapters List -->
                <div v-else class="chapters-list">
                    <div class="list-header">
                        <button class="back-btn" @click="backToSubjects">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <h2>{{ selectedSubject.name }} Chapters</h2>
                    </div>
                    <div v-for="chapter in chapters" :key="chapter.id" @click="selectChapter(chapter)" class="list-item">
                        {{ chapter.name }}
                    </div>
                </div>
            </div>

            <!-- Right Container -->
            <div class="right-container">
                <div v-if="selectedChapter" class="quizzes-grid">
                    <h2>Available Quizzes</h2>
                    <div class="quiz-cards">
                        <div v-for="quiz in chapterQuizzes" :key="quiz.id" class="quiz-card">
                            <div class="quiz-card-header">
                                <h3>{{ quiz.quiz_name }}</h3>
                                <span :class="['status-badge', { 'live': quiz.is_live }]">
                                    {{ quiz.is_live ? 'Live' : 'Not Live' }}
                                </span>
                            </div>
                            <div class="quiz-details">
                                <p><i class="fas fa-clock"></i> Duration: {{ quiz.time_duration }} min</p>
                                <p><i class="fas fa-calendar"></i> Date: {{ quiz.date_of_quiz }}</p>
                                <p><i class="fas fa-sticky-note"></i> {{ quiz.remarks }}</p>
                            </div>
                            <div class="quiz-actions">
                                <button class="view-btn" @click="viewQuiz(quiz)">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="start-btn" @click="startQuiz(quiz)">
                                    <i class="fas fa-play"></i> Start
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quiz Popup -->
            <div v-if="showQuizPopup" class="quiz-popup-overlay">
                <div class="quiz-popup">
                    <div class="quiz-header">
                        <h2>{{ activeQuiz.quiz_name }}</h2>
                        <div class="timer">{{ formatTime }}</div>
                    </div>
                    
                    <div class="question-section">
                        <div class="question-number">
                            Question {{ currentQuestionIndex + 1 }} of {{ quizQuestions.length }}
                        </div>
                        <div class="question-text">
                            {{ currentQuestion.question_statement }}
                        </div>
                        <div class="options">
                            <div v-for="option in currentQuestion.options" :key="option" class="option" 
                                :class="{ 'selected': selectedAnswers[currentQuestion.id] === option }"
                                @click="selectAnswer(option)">
                                {{ option }}
                            </div>
                        </div>
                    </div>
                        
                    <div class="quiz-navigation">
                        <button @click="previousQuestion" 
                                :disabled="currentQuestionIndex === 0"
                                class="nav-btn">
                            <i class="fas fa-arrow-left"></i> Previous
                        </button>
                        <button v-if="currentQuestionIndex < quizQuestions.length - 1" 
                                @click="nextQuestion"
                                class="nav-btn">
                            Next <i class="fas fa-arrow-right"></i>
                        </button>
                        <button v-else
                                @click="submitQuiz"
                                class="submit-btn">
                            Submit Quiz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            subjects: [],
            chapters: [],
            selectedSubject: null,
            selectedChapter: null,
            chapterQuizzes: [],
            error: null,
            showQuizPopup: false,
            activeQuiz: null,
            quizQuestions: [],
            currentQuestionIndex: 0,
            selectedAnswers: {},
            timeLeft: 0,
            timer: null,
            isLoading: false
        }
    },
    computed: {
        currentQuestion() {
            if (!this.quizQuestions || !this.quizQuestions.length) return null;
            return this.quizQuestions[this.currentQuestionIndex];
        },
        formatTime() {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    },
    methods: {
        async fetchSubjects() {
            try {
                const response = await fetch('/subjects');
                if (!response.ok) throw new Error('Failed to fetch subjects');
                this.subjects = await response.json();
                console.log('Fetched subjects:', this.subjects);
            } catch (error) {
                this.error = error.message;
                console.error('Error fetching subjects:', error);
            }
        },
        async selectSubject(subject) {
            console.log('Selected subject:', subject);
            this.selectedSubject = subject;
            try {
                const response = await fetch(`/subjects/${subject.id}/chapters`);
                if (!response.ok) throw new Error('Failed to fetch chapters');
                this.chapters = await response.json();
                console.log('Fetched chapters:', this.chapters);
            } catch (error) {
                this.error = error.message;
                console.error('Error fetching chapters:', error);
            }
        },
        async selectChapter(chapter) {
            console.log('Selected chapter:', chapter);
            this.selectedChapter = chapter;
            try {
                const response = await fetch(`/chapters/${chapter.id}/quizzes`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch quizzes');
                }
                this.chapterQuizzes = await response.json();
                console.log('Fetched quizzes:', this.chapterQuizzes);
            } catch (error) {
                this.error = error.message;
                console.error('Error fetching quizzes:', error);
            }
        },
        async startQuiz(quiz) {
            try {
                this.isLoading = true;
                const response = await fetch(`/quizzes/${quiz.id}/questions`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch quiz questions');
                }
                
                const quizData = await response.json();
                console.log('Quiz Data:', quizData);
                
                if (!Array.isArray(quizData)) {
                    console.error('Invalid quiz data structure:', quizData);
                    throw new Error('Invalid quiz data received');
                }
                
                this.activeQuiz = quiz;
                this.quizQuestions = quizData;
                
                if (this.quizQuestions.length === 0) {
                    throw new Error('No questions available for this quiz');
                }
                
                this.showQuizPopup = true;
                this.currentQuestionIndex = 0;
                this.selectedAnswers = {};
                
                const startTime = Date.now();
                const duration = parseInt(quiz.time_duration) * 60;
                this.timeLeft = duration;
                
                localStorage.setItem('quizStartTime', startTime);
                localStorage.setItem('quizDuration', duration);
                localStorage.setItem('activeQuiz', JSON.stringify(quiz));
                localStorage.setItem('quizQuestions', JSON.stringify(quizData));
                localStorage.setItem('selectedAnswers', JSON.stringify(this.selectedAnswers));
                
                if (this.timer) clearInterval(this.timer);
                this.startTimer();
            } catch (error) {
                console.error('Quiz loading error:', error);
                this.error = error.message;
            } finally {
                this.isLoading = false;
            }
        },
        backToSubjects() {
            this.selectedSubject = null;
            this.selectedChapter = null;
            this.chapters = [];
            this.chapterQuizzes = [];
        },
        startTimer() {
            this.timer = setInterval(() => {
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                    localStorage.setItem('timeLeft', this.timeLeft);
                } else {
                    clearInterval(this.timer);
                    this.submitQuiz();
                }
            }, 1000);
        },
        selectAnswer(option) {
            this.$set(this.selectedAnswers, this.currentQuestion.id, option);
            localStorage.setItem('selectedAnswers', JSON.stringify(this.selectedAnswers));
        },
        previousQuestion() {
            if (this.currentQuestionIndex > 0) {
                this.currentQuestionIndex--;
                localStorage.setItem('currentQuestionIndex', this.currentQuestionIndex);
            }
        },
        nextQuestion() {
            if (this.currentQuestionIndex < this.quizQuestions.length - 1) {
                this.currentQuestionIndex++;
                localStorage.setItem('currentQuestionIndex', this.currentQuestionIndex);
            }
        },
        
        async submitQuiz() {
            clearInterval(this.timer);
            this.showQuizPopup = false;
            
            try {
                const response = await fetch('/submit_quiz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        quiz_id: this.activeQuiz.id,
                        selected_answers: this.selectedAnswers
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    alert(`Quiz submitted! Your total score is: ${result.total_score}`);
                    
                    // Clear local storage
                    localStorage.removeItem('quizStartTime');
                    localStorage.removeItem('quizDuration');
                    localStorage.removeItem('activeQuiz');
                    localStorage.removeItem('quizQuestions');
                    localStorage.removeItem('selectedAnswers');
                    localStorage.removeItem('currentQuestionIndex');
                } else {
                    const error = await response.json();
                    alert(`Error submitting quiz: ${error.error}`);
                }
            } catch (error) {
                console.error('Error submitting quiz:', error);
                alert('Error submitting quiz. Please try again.');
            }
        },
        resumeQuiz() {
            const startTime = parseInt(localStorage.getItem('quizStartTime'));
            const duration = parseInt(localStorage.getItem('quizDuration'));
            const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            this.timeLeft = duration - elapsedTime;
            
            if (this.timeLeft <= 0) {
                this.submitQuiz();
            } else {
                this.startTimer();
            }
        }
    },
    beforeDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    },
    mounted() {
        this.fetchSubjects();
        
        const quizStartTime = localStorage.getItem('quizStartTime');
        const quizDuration = localStorage.getItem('quizDuration');
        const timeLeft = localStorage.getItem('timeLeft');
        const activeQuiz = localStorage.getItem('activeQuiz');
        const quizQuestions = localStorage.getItem('quizQuestions');
        const selectedAnswers = localStorage.getItem('selectedAnswers');
        const currentQuestionIndex = localStorage.getItem('currentQuestionIndex');
        
        if (quizStartTime && quizDuration && timeLeft && activeQuiz && quizQuestions) {
            this.activeQuiz = JSON.parse(activeQuiz);
            this.quizQuestions = JSON.parse(quizQuestions);
            this.selectedAnswers = JSON.parse(selectedAnswers);
            this.currentQuestionIndex = parseInt(currentQuestionIndex);
            this.showQuizPopup = true;
            this.resumeQuiz();
        }
    }
}