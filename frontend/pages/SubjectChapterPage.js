

export default {
    template: `
        <div class="subject-chapter-container">
            <div class="left-container">
                <div class="panel-header">
                    <h2>Subjects</h2>
                    <button class="neon-button" @click="openAddSubject">
                        Add Subject
                    </button>
                </div>
                <div class="subjects-list">
                    <div v-for="subject in subjects" 
                        :key="subject.id"
                        @click="selectSubject(subject)"
                        :class="['subject-item', selectedSubject?.id === subject.id ? 'active' : '']">
                        {{ subject.name }}
                        <div class="item-actions">
                            <button @click.stop="showSubjectInfoModal(subject)" class="btn-info">
                                <i class="fas fa-info-circle"></i>
                            </button>
                            <button @click.stop="editSubject(subject)" class="btn-edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button @click.stop="deleteSubject(subject.id)" class="btn-delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Subject Info Modal -->
            <div class="modal" v-if="showSubjectInfo">
                <div class="modal-content">
                    <h3>Subject Info</h3>
                    <p><strong>Name:</strong> {{ subjectInfo.name }}</p>
                    <p><strong>Description:</strong> {{ subjectInfo.description }}</p>
                    <div class="modal-actions">
                        <button type="button" @click="showSubjectInfo = false" class="btn-cancel">Close</button>
                    </div>
                </div>
            </div>
            
            <!-- Edit Subject Modal -->
            <div class="modal" v-if="showEditSubject">
                <div class="modal-content">
                    <h3>Edit Subject</h3>
                    <form @submit.prevent="updateSubject">
                        <div class="form-group">
                            <label>Subject Name:</label>
                            <input v-model="editSubjectData.name" type="text" required>
                        </div>
                        <div class="form-group">
                            <label>Description:</label>
                            <textarea v-model="editSubjectData.description"></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="neon-button">Save</button>
                            <button type="button" @click="showEditSubject = false" class="btn-cancel">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
            
            
            <!-- Right Container -->
            <div class="right-container">
                <div v-if="selectedSubject">
                    <div class="panel-header">
                        <h2>{{ selectedSubject.name }} - Chapters</h2>
                        <button class="neon-button" @click="showAddChapter = true">
                            Add Chapter
                        </button>
                    </div>
                    <table class="chapters-table">
                        <thead>
                            <tr>
                                <th width="30%">Chapter Name</th>
                                <th width="50%">Description</th>
                                <th width="20%">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="chapters.length === 0">
                                <td colspan="3" class="text-center">No chapters available</td>
                            </tr>
                            <tr v-for="chapter in chapters" :key="chapter.id">
                                <td>{{ chapter.name }}</td>
                                <td>{{ chapter.description }}</td>
                                <td class="actions">
                                    <button class="btn-edit" @click="editChapter(chapter)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-delete" @click="deleteChapter(chapter.id)">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                    <button class="btn-quiz" @click="openAddQuiz(chapter)">
                                    <i class="fas fa-plus-circle"></i>
                                </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="no-selection">
                    <p>Select a subject to view chapters</p>
                </div>
            </div>


            <!-- Edit Chapter Modal -->
            <div class="modal" v-if="showEditChapter">
                <div class="modal-content">
                    <h3>Edit Chapter</h3>
                    <form @submit.prevent="updateChapter">
                        <div class="form-group">
                            <label>Chapter Name:</label>
                            <input v-model="editChapterData.name" type="text" required>
                        </div>
                        <div class="form-group">
                            <label>Description:</label>
                            <textarea v-model="editChapterData.description"></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="neon-button">Save</button>
                            <button type="button" @click="showEditChapter = false" class="btn-cancel">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Add Quiz Modal -->
            <div class="modal" v-if="showAddQuiz">
                <div class="modal-content">
                    <h3>Create Quiz</h3>
                    <form @submit.prevent="submitNewQuiz">
                        <div class="form-group">
                            <label>Quiz Title:</label>
                            <input v-model="newQuiz.quiz_name"></input>
                        </div>
                        <div class="form-group">
                            <label>Date of Quiz:</label>
                            <input v-model="newQuiz.date_of_quiz" type="date" required>
                        </div>
                        <div class="form-group">
                            <label>Time Duration (minutes):</label>
                            <input v-model="newQuiz.time_duration" type="number" required>
                        </div>
                        <div class="form-group">
                            <label>Remarks:</label>
                            <textarea v-model="newQuiz.remarks"></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="neon-button">Save</button>
                            <button type="button" @click="showAddQuiz = false" class="btn-cancel">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Add Subject Modal -->
            <div class="modal" v-if="showAddSubject">
                <div class="modal-content">
                    <h3>Add New Subject</h3>
                    <form @submit.prevent="submitNewSubject">
                        <div class="form-group">
                            <label>Subject Name:</label>
                            <input v-model="newSubject.name" 
                                   type="text" 
                                   required>
                        </div>
                        <div class="form-group">
                            <label>Description:</label>
                            <textarea v-model="newSubject.description"></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="neon-button">Save</button>
                            <button type="button" 
                                    @click="closeAddSubject" 
                                    class="btn-cancel">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="modal" v-if="showAddChapter">
                <div class="modal-content">
                    <h3>Add New Chapter</h3>
                    <form @submit.prevent="submitNewChapter">
                        <div class="form-group">
                            <label>Chapter Name:</label>
                            <input v-model="newChapter.name" 
                                   type="text" 
                                   required>
                        </div>
                        <div class="form-group">
                            <label>Description:</label>
                            <textarea v-model="newChapter.description"></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="neon-button">Save</button>
                            <button type="button" 
                                    @click="closeAddChapter" 
                                    class="btn-cancel">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

        </div>
    `,
    data() {
        return {
            subjects: [],
            chapters: [],
            selectedSubject: null,
            showAddSubject: false,
            showAddChapter: false,
            showEditChapter: false,
            showEditSubject: false,
            showSubjectInfo: false,
            showAddQuiz: false,
            loading: false,
            error: null,
            newSubject: { name: '', description: '' },
            newChapter: { name: '', description: '' },
            newQuiz: { quiz_name:'',date_of_quiz: '', time_duration: '', remarks: '' },
            editChapterData: { id: null, name: '', description: '' },
            editSubjectData: { id: null, name: '', description: '' },
            subjectInfo: { name: '', description: '' }
        }
    },
    methods: {
        openAddSubject() {
            this.showAddSubject = true;
            this.newSubject = { name: '', description: '' };
        },

        closeAddSubject() {
            this.showAddSubject = false;
            this.newSubject = { name: '', description: '' };
        },

        selectSubject(subject) {
            this.selectedSubject = subject;
            this.fetchChapters(subject.id);
        },

        closeAddChapter() {
            this.showAddChapter = false;
            this.newChapter = { name: '', description: '' };
        },

        async fetchSubjects() {
            this.loading = true;
            try {
                const response = await fetch('/subjects');
                if (!response.ok) {
                    throw new Error('Failed to fetch subjects');
                }
                const data = await response.json();
                this.subjects = data;
            } catch (error) {
                console.error('Error fetching subjects:', error);
                this.error = error.message;
            } finally {
                this.loading = false;
            }
        },

        async fetchChapters(subjectId) {
            this.loading = true;
            try {
                const response = await fetch(`/subjects/${subjectId}/chapters`);
                if (!response.ok) {
                    throw new Error('Failed to fetch chapters');
                }
                const data = await response.json();
                this.chapters = data;
            } catch (error) {
                console.error('Error fetching chapters:', error);
                this.error = error.message;
            } finally {
                this.loading = false;
            }
        },

        async submitNewSubject() {
            try {
                const response = await fetch('/subjects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.newSubject)
                });

                if (!response.ok) {
                    throw new Error('Failed to add subject');
                }

                const newSubject = await response.json();
                this.subjects.push(newSubject);
                this.closeAddSubject();
            } catch (error) {
                console.error('Error adding subject:', error);
                this.error = error.message;
            }
        },

        async submitNewChapter() {
            try {
                const response = await fetch(`/subjects/${this.selectedSubject.id}/chapters`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.newChapter)
                });

                if (!response.ok) {
                    throw new Error('Failed to add chapter');
                }

                const newChapter = await response.json();
                this.chapters.push(newChapter);
                this.closeAddChapter();
            } catch (error) {
                console.error('Error adding chapter:', error);
                this.error = error.message;
            }
        },

        editChapter(chapter) {
            this.editChapterData = { ...chapter };
            this.showEditChapter = true;
        },

        async updateChapter() {
            try {
                const response = await fetch(`/chapters/${this.editChapterData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.editChapterData)
                });

                if (!response.ok) {
                    throw new Error('Failed to update chapter');
                }

                const updatedChapter = await response.json();
                const index = this.chapters.findIndex(ch => ch.id === updatedChapter.id);
                if (index !== -1) {
                    this.chapters.splice(index, 1, updatedChapter);
                }
                this.showEditChapter = false;
            } catch (error) {
                console.error('Error updating chapter:', error);
                this.error = error.message;
            }
        },

        async deleteChapter(chapterId) {
            try {
                const response = await fetch(`/chapters/${chapterId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete chapter');
                }

                this.chapters = this.chapters.filter(ch => ch.id !== chapterId);
            } catch (error) {
                console.error('Error deleting chapter:', error);
                this.error = error.message;
            }
        },

        showSubjectInfoModal(subject) {
            this.subjectInfo = { ...subject };
            this.showSubjectInfo = true;
        },

        editSubject(subject) {
            this.editSubjectData = { ...subject };
            this.showEditSubject = true;
        },

        async updateSubject() {
            try {
                const response = await fetch(`/subjects/${this.editSubjectData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.editSubjectData)
                });

                if (!response.ok) {
                    throw new Error('Failed to update subject');
                }

                const updatedSubject = await response.json();
                const index = this.subjects.findIndex(sub => sub.id === updatedSubject.id);
                if (index !== -1) {
                    this.subjects.splice(index, 1, updatedSubject);
                }
                this.showEditSubject = false;
            } catch (error) {
                console.error('Error updating subject:', error);
                this.error = error.message;
            }
        },

        async deleteSubject(subjectId) {
            try {
                const response = await fetch(`/subjects/${subjectId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete subject');
                }

                this.subjects = this.subjects.filter(sub => sub.id !== subjectId);
                if (this.selectedSubject && this.selectedSubject.id === subjectId) {
                    this.selectedSubject = null;
                    this.chapters = [];
                }
            } catch (error) {
                console.error('Error deleting subject:', error);
                this.error = error.message;
            }
        },

        // Add this method
        openAddQuiz(chapter) {
            this.newQuiz = { date_of_quiz: '', time_duration: '', remarks: '' };
            this.selectedChapterForQuiz = chapter;
            this.showAddQuiz = true;
        },

        // Add this method
        async submitNewQuiz() {
            try {
                const response = await fetch(`/chapters/${this.selectedChapterForQuiz.id}/quizzes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.newQuiz)
                });

                if (!response.ok) {
                    throw new Error('Failed to add quiz');
                }

                this.showAddQuiz = false;
            } catch (error) {
                console.error('Error adding quiz:', error);
                this.error = error.message;
            }
        }
    },
    mounted() {
        this.fetchSubjects();
    }
}