export default {
    template: `
        <div class="quiz-management-container">
            <div class="left-container">
                <div class="panel-header">
                    <h2>Quizzes</h2>
                    <button class="neon-button" @click="openAddQuiz">
                        Add Quiz
                    </button>
                </div>
                <div class="quizzes-list">
                    <div v-for="quiz in quizzes" 
                         :key="quiz.id"
                         @click="selectQuiz(quiz)"
                         :class="['quiz-item', selectedQuiz?.id === quiz.id ? 'active' : '']">
                        {{ quiz.quiz_name }}
                        <div class="item-actions">
                            <button @click.stop="showQuizInfoModal(quiz)" class="btn-info">
                                <i class="fas fa-info-circle"></i>
                            </button>
                            <button @click.stop="editQuiz(quiz)" class="btn-edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button @click.stop="deleteQuiz(quiz.id)" class="btn-delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Quiz Info Modal -->
            <div class="modal" v-if="showQuizInfo">
                <div class="modal-content">
                    <h3>Quiz Info</h3>
                    <p><strong>Name:</strong> {{ quizInfo.quiz_name }}</p>
                    <p><strong>Date:</strong> {{ quizInfo.date_of_quiz }}</p>
                    <p><strong>Time Duration:</strong> {{ quizInfo.time_duration }}</p>
                    <p><strong>Remarks:</strong> {{ quizInfo.remarks }}</p>
                    <div class="modal-actions">
                        <button type="button" @click="showQuizInfo = false" class="btn-cancel">Close</button>
                    </div>
                </div>
            </div>
            
            <!-- Edit Quiz Modal -->
            <div class="modal" v-if="showEditQuiz">
                <div class="modal-content">
                    <h3>Edit Quiz</h3>
                    <form @submit.prevent="updateQuiz">
                        <div class="form-group">
                            <label>Quiz Name:</label>
                            <input v-model="editQuizData.quiz_name" type="text" required>
                        </div>
                        <div class="form-group">
                            <label>Date of Quiz:</label>
                            <input v-model="editQuizData.date_of_quiz" type="date" required>
                        </div>
                        <div class="form-group">
                            <label>Time Duration (minutes):</label>
                            <input v-model="editQuizData.time_duration" type="number" required>
                        </div>
                        <div class="form-group">
                            <label>Remarks:</label>
                            <textarea v-model="editQuizData.remarks"></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="neon-button">Save</button>
                            <button type="button" @click="showEditQuiz = false" class="btn-cancel">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Right Container -->
            <div class="right-container">
                <div v-if="selectedQuiz">
                    <div class="panel-header">
                        <h2>{{ selectedQuiz.quiz_name }} - Questions</h2>
                        <div>
                            <button class="neon-button" @click="showAddQuestion = true">
                                Add Question
                            </button>
                            <button class="neon-button" :class="{ 'live': selectedQuiz.is_live }" @click="toggleLiveStatus">
                                {{ selectedQuiz.is_live ? 'Make Not Live' : 'Make Live' }}
                            </button>
                        </div>
                    </div>
                    <table class="questions-table">
                        <thead>
                            <tr>
                                <th width="30%">Question</th>
                                <th width="50%">Options</th>
                                <th width="10%">Correct Option</th>
                                <th width="10%">Marks</th>
                                <th width="20%">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="questions.length === 0">
                                <td colspan="5" class="text-center">No questions available</td>
                            </tr>
                            <tr v-for="question in questions" :key="question.id">
                                <td>{{ question.question_statement }}</td>
                                <td>
                                    <ul>
                                        <li v-for="option in question.options" :key="option">{{ option }}</li>
                                    </ul>
                                </td>
                                <td>{{ question.correct_option }}</td>
                                <td>{{ question.marks }}</td>
                                <td class="actions">
                                    <button class="btn-edit" @click="openEditQuestion(question)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-delete" @click="deleteQuestion(question.id)">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="no-selection">
                    <p>Select a quiz to view questions</p>
                </div>
            </div>

            <!-- Add Question Modal -->
            <div class="modal" v-if="showAddQuestion">
                <div class="modal-content">
                    <h3>Add Question</h3>
                    <form @submit.prevent="addQuestion">
                        <div class="form-group">
                            <label>Question:</label>
                            <textarea v-model="newQuestion.question_statement" required></textarea>
                        </div>
                        <div class="form-group" v-for="(option, index) in newQuestion.options" :key="index">
                            <label>Option {{ index + 1 }}:</label>
                            <input v-model="newQuestion.options[index]" type="text" required>
                            <button type="button" class="btn-remove-option" @click="removeNewOption(index)">Remove</button>
                        </div>
                        <button type="button" class="neon-button" @click="addNewOption">+ Add Option</button>
                        <div class="form-group">
                            <label>Correct Option:</label>
                            <input v-model="newQuestion.correct_option" type="text" required>
                        </div>
                        <div class="form-group">
                            <label>Marks:</label>
                            <input v-model="newQuestion.marks" type="number" required>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="neon-button">Save</button>
                            <button type="button" @click="showAddQuestion = false" class="btn-cancel">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Edit Question Modal -->
            <div class="modal" v-if="showEditQuestion">
                <div class="modal-content">
                    <h3>Edit Question</h3>
                    <form @submit.prevent="updateQuestion">
                        <div class="form-group">
                            <label>Question:</label>
                            <textarea v-model="editQuestionData.question_statement" required></textarea>
                        </div>
                        <div class="form-group" v-for="(option, index) in editQuestionData.options" :key="index">
                            <label>Option {{ index + 1 }}:</label>
                            <input v-model="editQuestionData.options[index]" type="text" required>
                        </div>
                        <button type="button" @click="addEditOption">+ Add Option</button>
                        <div class="form-group">
                            <label>Correct Option:</label>
                            <input v-model="editQuestionData.correct_option" type="text" required>
                        </div>
                        <div class="form-group">
                            <label>Marks:</label>
                            <input v-model="editQuestionData.marks" type="number" required>
                        </div>
                        <div class="modal-actions">
                            <button type="submit">Update Question</button>
                            <button type="button" @click="showEditQuestion = false" class="btn-cancel">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            quizzes: [],
            questions: [],
            selectedQuiz: null,
            showAddQuiz: false,
            showEditQuiz: false,
            showQuizInfo: false,
            showAddQuestion: false,
            showEditQuestion: false,
            newQuiz: { quiz_name: '', date_of_quiz: '', time_duration: '', remarks: '' },
            editQuizData: { id: null, quiz_name: '', date_of_quiz: '', time_duration: '', remarks: '' },
            quizInfo: { quiz_name: '', date_of_quiz: '', time_duration: '', remarks: '' },
            newQuestion: { question_statement: '', options: [''], correct_option: '', marks: '' },
            editQuestionData: { id: null, question_statement: '', options: [''], correct_option: '', marks: '' }
        }
    },
    methods: {
        openAddQuiz() {
            this.showAddQuiz = true;
            this.newQuiz = { quiz_name: '', date_of_quiz: '', time_duration: '', remarks: '' };
        },

        selectQuiz(quiz) {
            this.selectedQuiz = quiz;
            this.fetchQuestions(quiz.id);
        },

        showQuizInfoModal(quiz) {
            this.quizInfo = { ...quiz };
            this.showQuizInfo = true;
        },

        openAddQuestion() {
            this.showAddQuestion = true;
            this.newQuestion = { question_statement: '', options: [''], correct_option: '', marks: '' };
        },

        openEditQuestion(question) {
            this.showEditQuestion = true;
            this.editQuestionData = { ...question, options: question.options || [''] };
        },

        addNewOption() {
            this.newQuestion.options.push('');
        },

        addEditOption() {
            this.editQuestionData.options.push('');
        },


        editQuiz(quiz) {
            this.editQuizData = { ...quiz };
            this.showEditQuiz = true;
        },
        removeNewOption(index) {
            this.newQuestion.options.splice(index, 1);
        },

        removeEditOption(index) {
            this.editQuestionData.options.splice(index, 1);
        },

        async updateQuiz() {
            try {
                const response = await fetch(`/quizzes/${this.editQuizData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.editQuizData)
                });

                if (!response.ok) {
                    throw new Error('Failed to update quiz');
                }

                const updatedQuiz = await response.json();
                const index = this.quizzes.findIndex(q => q.id === updatedQuiz.id);
                if (index !== -1) {
                    this.quizzes.splice(index, 1, updatedQuiz);
                }
                this.showEditQuiz = false;
            } catch (error) {
                console.error('Error updating quiz:', error);
            }
        },

        async deleteQuiz(quizId) {
            try {
                const response = await fetch(`/quizzes/${quizId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete quiz');
                }

                this.quizzes = this.quizzes.filter(q => q.id !== quizId);
                if (this.selectedQuiz && this.selectedQuiz.id === quizId) {
                    this.selectedQuiz = null;
                    this.questions = [];
                }
            } catch (error) {
                console.error('Error deleting quiz:', error);
            }
        },

        async fetchQuestions(quizId) {
            try {
                const response = await fetch(`/quizzes/${quizId}/questions`);
                if (!response.ok) throw new Error('Failed to fetch questions');
                this.questions = await response.json();
            } catch (error) {
                console.error('Error fetching questions:', error);
            }
        },
    

        async addQuestion() {
            try {
                const response = await fetch(`/quizzes/${this.selectedQuiz.id}/questions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.newQuestion)
                });

                if (response.ok) {
                    alert('Question added successfully');
                    this.showAddQuestion = false;
                    this.fetchQuestions(this.selectedQuiz.id);
                } else {
                    const error = await response.json();
                    alert(`Error adding question: ${error.message}`);
                }
            } catch (error) {
                console.error('Error adding question:', error);
                alert('Error adding question. Please try again.');
            }
        },

        editQuestion(question) {
            this.editQuestionData = { ...question };
            this.showEditQuestion = true;
        },

        async updateQuestion() {
            try {
                const response = await fetch(`/questions/${this.editQuestionData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.editQuestionData)
                });
    
                if (response.ok) {
                    alert('Question updated successfully');
                    this.showEditQuestion = false;
                    this.fetchQuestions(this.selectedQuiz.id);
                } else {
                    const error = await response.json();
                    alert(`Error updating question: ${error.message}`);
                }
            } catch (error) {
                console.error('Error updating question:', error);
                alert('Error updating question. Please try again.');
            }
        },

        async deleteQuestion(questionId) {
            try {
                const response = await fetch(`/questions/${questionId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    alert('Question deleted successfully');
                    this.fetchQuestions(this.selectedQuiz.id);
                } else {
                    const error = await response.json();
                    alert(`Error deleting question: ${error.message}`);
                }
            } catch (error) {
                console.error('Error deleting question:', error);
                alert('Error deleting question. Please try again.');
            }
        },

        async fetchQuizzes() {
            try {
                const response = await fetch('/quizzes');
                if (!response.ok) {
                    throw new Error('Failed to fetch quizzes');
                }
                const data = await response.json();
                this.quizzes = data;
            } catch (error) {
                console.error('Error fetching quizzes:', error);
            }
        },
     
        async toggleLiveStatus() {
            try {
                const response = await fetch(`/toggle_quiz_status/${this.selectedQuiz.id}`, {
                    method: 'PUT'
                });

                if (!response.ok) {
                    throw new Error('Failed to toggle quiz status');
                }

                // Toggle the status in Vue data
                this.$set(this.selectedQuiz, 'is_live', !this.selectedQuiz.is_live);
                
                // Update in quizzes array
                const quizIndex = this.quizzes.findIndex(q => q.id === this.selectedQuiz.id);
                if (quizIndex !== -1) {
                    this.$set(this.quizzes[quizIndex], 'is_live', this.selectedQuiz.is_live);
                }

            } catch (error) {
                console.error('Error:', error);
            }
        }
    },
    mounted() {
        this.fetchQuizzes();
    }
}