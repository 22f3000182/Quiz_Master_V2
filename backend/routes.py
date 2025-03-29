from flask import current_app as app, jsonify, request, render_template, session
from flask_security import auth_required, verify_password, hash_password, current_user, login_user, roles_required,logout_user
from backend.models import User, db, Subject, Chapter, Quiz, Question, Role, Score, QuizPreview
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from backend.celery.tasks import daily_reminder, monthly_report, export_quiz_data


UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'pics')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


datastore = app.security.datastore


@app.route('/')
def home():
    return render_template('index.html')

# @app.get('/celery')
# def celery():
#     task = add.delay(10, 20)
#     return {'task_id' : task.id}


@app.route('/trigger_daily_reminder', methods=['POST'])
@auth_required()
def trigger_daily_reminder():
    """Manually trigger the daily reminder task."""
    try:
        if not current_user.has_role('admin'):
            return jsonify({'error': 'Unauthorized'}), 403

        daily_reminder.delay()
        return jsonify({'message': 'Daily reminder task triggered successfully'}), 200

    except Exception as e:
        app.logger.error(f"Error triggering daily reminder: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/trigger_monthly_report', methods=['POST'])
@auth_required()
def trigger_monthly_report():
    """Manually trigger the monthly report task."""
    try:
        if not current_user.has_role('admin'):
            return jsonify({'error': 'Unauthorized'}), 403

        monthly_report.delay()
        return jsonify({'message': 'Monthly report task triggered successfully'}), 200

    except Exception as e:
        app.logger.error(f"Error triggering monthly report: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/export_quiz_data/<int:user_id>', methods=['GET'])
@auth_required()
def trigger_export_quiz_data(user_id):
    """Trigger the export quiz data task for a specific user."""
    try:
        if current_user.id != user_id and not current_user.has_role('admin'):
            return jsonify({'error': 'Unauthorized'}), 403

        task = export_quiz_data.delay(user_id)
        return jsonify({'message': 'Export quiz data task triggered successfully', 'task_id': task.id}), 202

    except Exception as e:
        app.logger.error(f"Error triggering export quiz data: {str(e)}")
        return jsonify({'error': str(e)}), 500



@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        print("Login attempt with email:", data['email'])
        
        user = User.query.filter_by(email=data['email']).first()
        if user and verify_password(data['password'], user.password):
            login_user(user, remember=True)
            session.permanent = True
            
            # Create user data for frontend
            user_data = {
                'id': user.id,
                'email': user.email,
                'role': 'admin' if user.has_role('admin') else 'user',
                'name': user.full_name,
                'token': user.get_auth_token()
            }
            
            # Set session data
            session['user_id'] = user.id
            session['user_role'] = user_data['role']
            
            return jsonify(user_data), 200
        
        print("Invalid credentials for user:", data['email'])
        return jsonify({'message': 'Invalid credentials'}), 401
        
    except Exception as e:
        print("Login error:", str(e))
        return jsonify({'message': 'Login failed'}), 500

@app.after_request
def after_request(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return response

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
            
        # Create new user with 'user' role
        user_role = Role.query.filter_by(name='user').first()
        if not user_role:
            return jsonify({'error': 'User role not found'}), 500
            
        new_user = User(
            email=data['email'],
            password=hash_password(data['password']),
            full_name=data['full_name'],
            qualification=data['qualification'],
            dob=datetime.strptime(data['dob'], '%Y-%m-%d').date() if data['dob'] else None,
            active=True
        )
        
        # Assign user role
        new_user.roles.append(user_role)
        
        db.session.add(new_user)
        db.session.commit()
        
        app.logger.info(f"Created user {new_user.email} with roles: {[r.name for r in new_user.roles]}")
        
        return jsonify({'message': 'Registration successful'}), 201
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/subjects', methods=['GET'])
def get_subjects():
    try:
        subjects = Subject.query.all()
        subjects_list = []
        for subject in subjects:
            subjects_list.append({
                'id': subject.id,
                'name': subject.name,
                'description': subject.description
            })
        print("Sending subjects:", subjects_list)  # Debug print
        return jsonify(subjects_list), 200
    except Exception as e:
        print("Error fetching subjects:", str(e))  # Debug print
        return jsonify({'error': str(e)}), 500

@app.route('/subjects', methods=['POST'])
def add_subject():
    try:
        data = request.get_json()
        if not data or 'name' not in data:
            return jsonify({'error': 'Name is required'}), 400
            
        subject = Subject(
            name=data['name'],
            description=data.get('description', '')
        )
        db.session.add(subject)
        db.session.commit()
        
        return jsonify({
            'id': subject.id,
            'name': subject.name,
            'description': subject.description
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@app.route('/subjects/<int:subject_id>', methods=['PUT'])
@auth_required()
def update_subject(subject_id):
    try:
        data = request.get_json()
        subject = Subject.query.get_or_404(subject_id)
        subject.name = data.get('name', subject.name)
        subject.description = data.get('description', subject.description)
        db.session.commit()
        return jsonify({
            'id': subject.id,
            'name': subject.name,
            'description': subject.description
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/subjects/<int:subject_id>', methods=['DELETE'])
@auth_required()
def delete_subject(subject_id):
    try:
        subject = Subject.query.get_or_404(subject_id)
        db.session.delete(subject)
        db.session.commit()
        return jsonify({'message': 'Subject deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

    
@app.route('/chapters/<int:chapter_id>', methods=['PUT'])
@auth_required()
def update_chapter(chapter_id):
    try:
        data = request.get_json()
        chapter = Chapter.query.get_or_404(chapter_id)
        chapter.name = data.get('name', chapter.name)
        chapter.description = data.get('description', chapter.description)
        db.session.commit()
        return jsonify({
            'id': chapter.id,
            'name': chapter.name,
            'description': chapter.description
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    


@app.route('/chapters/<int:chapter_id>', methods=['DELETE'])
@auth_required()
def delete_chapter(chapter_id):
    try:
        chapter = Chapter.query.get_or_404(chapter_id)
        db.session.delete(chapter)
        db.session.commit()
        return jsonify({'message': 'Chapter deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/subjects/<int:subject_id>/chapters', methods=['GET'])
def get_chapters(subject_id):
    try:
        chapters = Chapter.query.filter_by(subject_id=subject_id).all()
        return jsonify([{
            'id': chapter.id,
            'name': chapter.name,
            'description': chapter.description
        } for chapter in chapters]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/subjects/<int:subject_id>/chapters', methods=['POST'])
def add_chapter(subject_id):
    try:
        data = request.get_json()
        chapter = Chapter(
            name=data['name'],
            description=data.get('description', ''),
            subject_id=subject_id
        )
        db.session.add(chapter)
        db.session.commit()
        return jsonify({
            'id': chapter.id,
            'name': chapter.name,
            'description': chapter.description
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@app.route('/chapters/<int:chapter_id>/quizzes', methods=['POST'])
@auth_required()
def add_quiz(chapter_id):
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug print

        # Validate data
        if 'quiz_name' not in data or 'date_of_quiz' not in data or 'time_duration' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        # Convert date_of_quiz to date object
        try:
            date_of_quiz = datetime.strptime(data['date_of_quiz'], '%Y-%m-%d').date()
        except ValueError as ve:
            print("Invalid date format:", ve)  # Debug print
            return jsonify({'error': 'Invalid date format'}), 400

        quiz = Quiz(
            chapter_id=chapter_id,
            quiz_name=data['quiz_name'],
            date_of_quiz=date_of_quiz,
            time_duration=data['time_duration'],
            remarks=data.get('remarks', '')
        )
        db.session.add(quiz)
        db.session.commit()
        return jsonify({
            'id': quiz.id,
            'chapter_id': quiz.chapter_id,
            'quiz_name': quiz.quiz_name,
            'date_of_quiz': quiz.date_of_quiz,
            'time_duration': quiz.time_duration,
            'remarks': quiz.remarks
        }), 201
    except Exception as e:
        db.session.rollback()
        print("Error adding quiz:", str(e))  # Debug print
        return jsonify({'error': str(e)}), 500
    

@app.route('/toggle_quiz_status/<int:quiz_id>', methods=['PUT'])
@auth_required()
def toggle_quiz_status(quiz_id):
    try:
        if not current_user.has_role('admin'):
            return jsonify({'error': 'Unauthorized'}), 403
            
        quiz = Quiz.query.get_or_404(quiz_id)
        quiz.is_live = not quiz.is_live
        db.session.commit()
        
        return jsonify({'message': 'Quiz status updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    


@app.route('/quizzes/<int:quiz_id>/questions', methods=['POST'])
@auth_required()
def add_question(quiz_id):
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug print

        # Validate data
        required_fields = ['question_statement', 'options', 'correct_option', 'marks']
        for field in required_fields:
            if field not in data:
                print(f"Missing field: {field}")  # Debug print
                return jsonify({'error': f'Missing required field: {field}'}), 400

        question = Question(
            quiz_id=quiz_id,
            question_statement=data['question_statement'],
            options=data['options'],
            correct_option=data['correct_option'],
            marks=data['marks']
        )
        db.session.add(question)
        db.session.commit()
        return jsonify({
            'id': question.id,
            'quiz_id': question.quiz_id,
            'question_statement': question.question_statement,
            'options': question.options,
            'correct_option': question.correct_option,
            'marks': question.marks
        }), 201
    except Exception as e:
        db.session.rollback()
        print("Error adding question:", str(e))  # Debug print
        return jsonify({'error': str(e)}), 500
    

@app.route('/quizzes', methods=['GET'])
@auth_required()
def get_quizzes():
    try:
        quizzes = Quiz.query.all()
        return jsonify([{
            'id': quiz.id,
            'quiz_name': quiz.quiz_name,
            'date_of_quiz': quiz.date_of_quiz,
            'time_duration': quiz.time_duration,
            'remarks': quiz.remarks
        } for quiz in quizzes]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/quizzes/<int:quiz_id>', methods=['PUT'])
@auth_required()
def update_quiz(quiz_id):
    try:
        data = request.get_json()
        quiz = Quiz.query.get_or_404(quiz_id)
        quiz.quiz_name = data.get('quiz_name', quiz.quiz_name)
        quiz.date_of_quiz = datetime.strptime(data['date_of_quiz'], '%Y-%m-%d').date()
        quiz.time_duration = data.get('time_duration', quiz.time_duration)
        quiz.remarks = data.get('remarks', quiz.remarks)
        db.session.commit()
        return jsonify({
            'id': quiz.id,
            'quiz_name': quiz.quiz_name,
            'date_of_quiz': quiz.date_of_quiz,
            'time_duration': quiz.time_duration,
            'remarks': quiz.remarks
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/quizzes/<int:quiz_id>', methods=['DELETE'])
@auth_required()
def delete_quiz(quiz_id):
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        db.session.delete(quiz)
        db.session.commit()
        return jsonify({'message': 'Quiz deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/quizzes/<int:quiz_id>/questions', methods=['GET'])
@auth_required()
def get_questions(quiz_id):
    try:
        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        return jsonify([{
            'id': question.id,
            'question_statement': question.question_statement,
            'options': question.options,
            'correct_option': question.correct_option,
            'marks': question.marks
        } for question in questions]), 200
    except Exception as e:
        app.logger.error(f"Error fetching questions: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/questions/<int:question_id>', methods=['PUT'])
@auth_required()
def update_question(question_id):
    try:
        data = request.get_json()
        question = Question.query.get_or_404(question_id)
        question.question_statement = data.get('question_statement', question.question_statement)
        question.options = data.get('options', question.options)
        question.correct_option = data.get('correct_option', question.correct_option)
        question.marks = data.get('marks', question.marks)
        db.session.commit()
        return jsonify({
            'id': question.id,
            'quiz_id': question.quiz_id,
            'question_statement': question.question_statement,
            'options': question.options,
            'correct_option': question.correct_option,
            'marks': question.marks
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

@app.route('/questions/<int:question_id>', methods=['DELETE'])
@auth_required()
def delete_question(question_id):
    try:
        question = Question.query.get_or_404(question_id)
        db.session.delete(question)
        db.session.commit()
        return jsonify({'message': 'Question deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



@app.route('/logout', methods=['POST'])
@auth_required()
def logout():
    try:
        logout_user()
    
        return jsonify({'message': 'Logged out successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/quiz/<int:chapter_id>')
@auth_required()
def quiz(chapter_id):
    quiz = Quiz.query.filter_by(chapter_id=chapter_id).first()
    return jsonify({
        'id': quiz.id,
        'date_of_quiz': quiz.date_of_quiz,
        'time_duration': quiz.time_duration,
        'remarks': quiz.remarks
    })


@app.route('/admin/data')
@auth_required()
def admin_data():
    try:
        if not current_user.is_authenticated:
            return jsonify({'error': 'Not authenticated'}), 401
            
        photo_url = f'/uploads/{os.path.basename(current_user.user_profile)}' if current_user.user_profile else None
        
        user_data = {
            'photoUrl': photo_url,
            'name': current_user.full_name,
            'Email': current_user.email,
            'Dob': current_user.dob.strftime('%Y-%m-%d') if current_user.dob else None,
            'Qualifications': current_user.qualification,
            'role': 'admin'
        }
        return jsonify(user_data)
    except Exception as e:
        app.logger.error(f"Error fetching admin data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/admin/update_profile', methods=['PUT'])
@auth_required()
def update_profile():
    try:
        user = current_user
        
        if 'name' in request.form:
            user.full_name = request.form['name']
        if 'dob' in request.form:
            user.dob = datetime.strptime(request.form['dob'], '%Y-%m-%d').date()
        if 'qualifications' in request.form:
            user.qualification = request.form['qualifications']
            
        if 'photo' in request.files:
            photo = request.files['photo']
            if photo and allowed_file(photo.filename):
                filename = secure_filename(f"user_{user.id}_{photo.filename}")
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                photo.save(filepath)
                # Store only the filename in the database
                user.user_profile = filename

        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/user/update_profile', methods=['PUT'])
@auth_required()
def user_update_profile():
    try:
        user = current_user
        
        if 'name' in request.form:
            user.full_name = request.form['name']
        if 'dob' in request.form:
            user.dob = datetime.strptime(request.form['dob'], '%Y-%m-%d').date()
        if 'qualifications' in request.form:
            user.qualification = request.form['qualifications']
            
        if 'photo' in request.files:
            photo = request.files['photo']
            if photo and allowed_file(photo.filename):
                filename = secure_filename(f"user_{user.id}_{photo.filename}")
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                photo.save(filepath)
                # Store only the filename in the database
                user.user_profile = filename

        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500




@app.route('/users')
@auth_required()
def get_users():
    try:
        if not current_user.has_role('admin'):
            return jsonify({'error': 'Unauthorized'}), 403
            
        # Get user role
        user_role = Role.query.filter_by(name='user').first()
        if not user_role:
            return jsonify({'error': 'User role not found'}), 404
            
        # Query users with 'user' role
        users = User.query.join(User.roles).filter(Role.name == 'user').all()
        
        users_data = [{
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'photoUrl': f'/uploads/{user.user_profile}' if user.user_profile else None,
            'dob': user.dob.strftime('%Y-%m-%d') if user.dob else None,
            'qualification': user.qualification,
            'roles': [{'name': role.name} for role in user.roles]
        } for user in users]
        
        return jsonify(users_data)
    except Exception as e:
        app.logger.error(f"Error in get_users: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/admin/delete_user/<int:user_id>', methods=['DELETE'])
@auth_required()
def delete_user(user_id):
    try:
        # Check if admin
        if not current_user.has_role('admin'):
            return jsonify({'error': 'Unauthorized'}), 403
            
        # Find user to delete
        user = User.query.get_or_404(user_id)
        
        # Don't allow deleting admin users
        if user.has_role('admin'):
            return jsonify({'error': 'Cannot delete admin users'}), 403
            
        # Delete user
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting user: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Change from /user_dashboard to /user_data
@app.route('/user_data')
@auth_required()
def get_user_data():
    try:
        if not current_user.is_authenticated:
            return jsonify({'error': 'Not authenticated'}), 401

        # Check for user role
        user_roles = [role.name.lower() for role in current_user.roles]
        
        if 'user' not in user_roles:
            return jsonify({'error': 'Unauthorized access'}), 403

        # Set default photo if none exists
        default_photo = '/static/pics/default-avatar.jpg'
        photo_url = f'/uploads/{os.path.basename(current_user.user_profile)}' if current_user.user_profile else default_photo
        
        user_data = {
            'photoUrl': photo_url,
            'name': current_user.full_name or 'User',
            'Email': current_user.email,
            'Dob': current_user.dob.strftime('%Y-%m-%d') if current_user.dob else None,
            'Qualifications': current_user.qualification or 'Not specified'
        }
        
        return jsonify(user_data)
    except Exception as e:
        app.logger.error(f"Error in get_user_data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    
    
@app.route('/chapters/<int:chapter_id>/quizzes')
@auth_required()
def get_chapter_quizzes(chapter_id):
    try:
        # Remove is_live filter to get all quizzes
        quizzes = Quiz.query.filter_by(chapter_id=chapter_id).all()
        
        quizzes_data = [{
            'id': quiz.id,
            'quiz_name': quiz.quiz_name,
            'time_duration': quiz.time_duration,
            'remarks': quiz.remarks,
            'is_live': quiz.is_live,  # Include live status
            'date_of_quiz': quiz.date_of_quiz.strftime('%Y-%m-%d') if quiz.date_of_quiz else None,
            'total_marks': sum(q.marks for q in quiz.questions)
        } for quiz in quizzes]
        
        return jsonify(quizzes_data)
        
    except Exception as e:
        app.logger.error(f"Error fetching quizzes: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/quizzes/<int:quiz_id>')
@auth_required()
def get_quiz_details(quiz_id):
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        
        # Check if quiz is live for users
        if not current_user.has_role('admin') and not quiz.is_live:
            return jsonify({'error': 'Quiz not available'}), 403
            
        questions = [{
            'id': q.id,
            'question_text': q.question_text,
            'options': q.options,
            'marks': q.marks
        } for q in quiz.questions]
        
        quiz_data = {
            'id': quiz.id,
            'quiz_name': quiz.quiz_name,
            'time_duration': quiz.time_duration,
            'remarks': quiz.remarks,
            'date_of_quiz': quiz.date_of_quiz.strftime('%Y-%m-%d') if quiz.date_of_quiz else None,
            'questions': questions,
            'total_marks': sum(q.marks for q in quiz.questions)
        }
        
        return jsonify(quiz_data)
        
    except Exception as e:
        app.logger.error(f"Error fetching quiz details: {str(e)}")
        return jsonify({'error': str(e)}), 500
    

@app.route('/quizzes/<int:quiz_id>/questions')
@auth_required()
def get_quiz_questions(quiz_id):
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        print(f"Found quiz: {quiz.id} with {len(quiz.questions)} questions") # Debug log
        
        quiz_data = {
            'quiz_id': quiz.id,
            'quiz_name': quiz.quiz_name,
            'time_duration': quiz.time_duration,
            'questions': [{
                'id': question.id,
                'question_statement': question.question_statement,
                'options': [
                    question.option1,
                    question.option2,
                    question.option3,
                    question.option4
                ],
                'marks': question.marks
            } for question in quiz.questions]
        }
        
        print(f"Sending quiz data with {len(quiz_data['questions'])} questions") # Debug log
        return jsonify(quiz_data)
        
    except Exception as e:
        app.logger.error(f"Error fetching quiz questions: {str(e)}")
        return jsonify({'error': str(e)}), 500
    

    
@app.route('/submit_quiz', methods=['POST'])
@auth_required()
def submit_quiz():
    try:
        data = request.get_json()
        quiz_id = data['quiz_id']
        selected_answers = data['selected_answers']
        
        quiz = Quiz.query.get_or_404(quiz_id)
        questions = quiz.questions
        
        total_score = 0
        answers_data = {}
        
        # Process each question and build answers_data
        for question in questions:
            selected_option = selected_answers.get(str(question.id))
            correct_option = question.correct_option
            is_correct = selected_option == correct_option
            
            if is_correct:
                total_score += question.marks
                
            # Store question response data
            answers_data[str(question.id)] = {
                "selected_answer": selected_option,
                "correct_answer": correct_option,
                "is_correct": is_correct,
                "marks": question.marks
            }
        
        # Create Score record
        score = Score(
            quiz_id=quiz.id,
            user_id=current_user.id,
            time_stamp_of_attempt=datetime.utcnow(),
            total_scored=total_score
        )
        db.session.add(score)
        
        # Create QuizPreview record
        quiz_preview = QuizPreview(
            quiz_id=quiz.id,
            user_id=current_user.id,
            answers_data=answers_data,
            time_stamp_of_attempt=datetime.utcnow()
        )
        db.session.add(quiz_preview)
        
        db.session.commit()
        
        return jsonify({'total_score': total_score}), 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error submitting quiz: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/quiz_history', methods=['GET'])
@auth_required()
def get_quiz_history():
    try:
        quiz_history = Score.query.filter_by(user_id=current_user.id).all()
        
        # Ensure preview_id is included in the response
        history_data = []
        for score in quiz_history:
            quiz = score.quiz
            preview = QuizPreview.query.filter_by(user_id=current_user.id, quiz_id=quiz.id).first()
            quiz_data = {
                'subject': quiz.chapter.subject.name,
                'chapter': quiz.chapter.name,
                'quiz_name': quiz.quiz_name,
                'attempt_time': score.time_stamp_of_attempt,
                'score': score.total_scored,
                'preview_id': preview.id if preview else None  # Include preview_id if available
            }
            history_data.append(quiz_data)
        
        return jsonify(history_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/quiz_preview/<int:preview_id>', methods=['GET'])
@auth_required()
def get_quiz_preview(preview_id):
    try:
        preview = QuizPreview.query.get(preview_id)
        if not preview:
            return jsonify({'error': 'Preview not found'}), 404
        
        # Verify user owns this preview
        if preview.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Fetch quiz questions and format preview data
        quiz = Quiz.query.get(preview.quiz_id)
        if not quiz:
            return jsonify({'error': 'Associated quiz not found'}), 404
        
        questions = Question.query.filter_by(quiz_id=quiz.id).all()
        
        preview_data = {
            'quiz_name': quiz.quiz_name,
            'total_questions': len(questions),
            'questions': []
        }
        
        # Add each question with answer details if available
        for question in questions:
            answer_data = preview.answers_data.get(str(question.id))
            if answer_data:
                preview_data['questions'].append({
                    'question_statement': question.question_statement,
                    'options': question.options,
                    'selected_answer': answer_data['selected_answer'],
                    'correct_answer': answer_data['correct_answer'],
                    'is_correct': answer_data['is_correct'],
                    'marks': answer_data['marks']
                })
            else:
                preview_data['questions'].append({
                    'question_statement': question.question_statement,
                    'options': question.options
                })
        
        return jsonify(preview_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/quiz_stats/<int:preview_id>', methods=['GET'])
@auth_required()
def get_quiz_stats(preview_id):
    try:
        preview = QuizPreview.query.get_or_404(preview_id)
        
        # Verify user owns this preview
        if preview.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
            
        quiz = Quiz.query.get_or_404(preview.quiz_id)
        questions = Question.query.filter_by(quiz_id=quiz.id).all()
        
        correct_count = 0
        incorrect_count = 0
        total_score = 0
        question_stats = []

        for question in questions:
            answer_data = preview.answers_data.get(str(question.id))
            if answer_data:
                is_correct = answer_data['is_correct']
                if is_correct:
                    correct_count += 1
                    total_score += question.marks
                else:
                    incorrect_count += 1
                
                question_stats.append({
                    'question_statement': question.question_statement,
                    'is_correct': is_correct,
                    'marks': question.marks
                })
        
        accuracy = (correct_count / len(questions)) * 100 if questions else 0
        
        stats_data = {
            'total_score': total_score,
            'correct_count': correct_count,
            'incorrect_count': incorrect_count,
            'accuracy': accuracy,
            'questions': question_stats
        }
        
        return jsonify(stats_data), 200
        
    except Exception as e:
        app.logger.error(f"Error fetching quiz stats: {str(e)}")
        return jsonify({'error': str(e)}), 500
    

    
@app.route('/subject_performance')
@auth_required()
def get_subject_performance():
    try:
        subjects = Subject.query.all()
        subject_stats = {}
        
        for subject in subjects:
            chapters = Chapter.query.filter_by(subject_id=subject.id).all()
            subject_scores = []
            
            for chapter in chapters:
                quizzes = Quiz.query.filter_by(chapter_id=chapter.id).all()
                for quiz in quizzes:
                    previews = QuizPreview.query.filter_by(
                        quiz_id=quiz.id,
                        user_id=current_user.id
                    ).all()
                    
                    for preview in previews:
                        if not preview.answers_data:
                            continue
                            
                        total_marks = sum(answer.get('marks', 0) for answer in preview.answers_data.values())
                        scored_marks = sum(answer.get('marks', 0) for answer in preview.answers_data.values() if answer.get('is_correct'))
                        
                        if total_marks > 0:
                            score = (scored_marks / total_marks) * 100
                            subject_scores.append(score)
            
            if subject_scores:
                subject_stats[subject.name] = {
                    'best_score': round(max(subject_scores), 2),
                    'avg_score': round(sum(subject_scores) / len(subject_scores), 2)
                }
            else:
                subject_stats[subject.name] = {
                    'best_score': 0,
                    'avg_score': 0
                }
                
        subjects = list(subject_stats.keys())
        return jsonify({
            'subjects': subjects,
            'best_scores': [subject_stats[s]['best_score'] for s in subjects],
            'avg_scores': [subject_stats[s]['avg_score'] for s in subjects]
        })
        
    except Exception as e:
        app.logger.error(f"Error in get_subject_performance: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/subject_chapter_performance/<int:subject_id>')
@auth_required()
def get_subject_chapter_performance(subject_id):
    try:
        subject = Subject.query.get_or_404(subject_id)
        # Order chapters by ID
        chapters = Chapter.query.filter_by(subject_id=subject_id).order_by(Chapter.id).all()
        
        if not chapters:
            return jsonify({
                'chapters': [],
                'best_scores': [],
                'avg_scores': []
            })
        
        chapter_stats = {}
        
        for chapter in chapters:
            try:
                quizzes = Quiz.query.filter_by(chapter_id=chapter.id).all()
                chapter_scores = []
                
                for quiz in quizzes:
                    previews = QuizPreview.query.filter_by(
                        quiz_id=quiz.id,
                        user_id=current_user.id
                    ).all()
                    
                    for preview in previews:
                        if not preview.answers_data:
                            continue
                            
                        total_marks = sum(answer.get('marks', 0) for answer in preview.answers_data.values())
                        scored_marks = sum(answer.get('marks', 0) for answer in preview.answers_data.values() if answer.get('is_correct'))
                        
                        if total_marks > 0:
                            score = (scored_marks / total_marks) * 100
                            chapter_scores.append(score)
                
                # Use chapter ID as key but display name in chart
                if chapter_scores:
                    chapter_stats[chapter.id] = {
                        'name': f"Chapter {chapter.id}",
                        'best_score': round(max(chapter_scores), 2),
                        'avg_score': round(sum(chapter_scores) / len(chapter_scores), 2)
                    }
                else:
                    chapter_stats[chapter.id] = {
                        'name': f"Chapter {chapter.id}",
                        'best_score': 0,
                        'avg_score': 0
                    }
                    
            except Exception as e:
                app.logger.error(f"Error processing chapter {chapter.id}: {str(e)}")
                continue

        # Sort by chapter ID
        sorted_chapters = sorted(chapter_stats.items(), key=lambda x: x[0])
        
        return jsonify({
            'chapters': [stats['name'] for _, stats in sorted_chapters],
            'best_scores': [stats['best_score'] for _, stats in sorted_chapters],
            'avg_scores': [stats['avg_score'] for _, stats in sorted_chapters]
        })

    except Exception as e:
        app.logger.error(f"Error in chapter performance: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500
    

@app.route('/admin/overall_performance')
@auth_required()
def get_overall_performance():
    try:
        subjects = Subject.query.all()
        subject_stats = {}
        
        for subject in subjects:
            all_scores = []
            chapters = Chapter.query.filter_by(subject_id=subject.id).all()
            
            for chapter in chapters:
                quizzes = Quiz.query.filter_by(chapter_id=chapter.id).all()
                
                for quiz in quizzes:
                    previews = QuizPreview.query.filter_by(quiz_id=quiz.id).all()
                    
                    for preview in previews:
                        if not preview.answers_data:
                            continue
                            
                        total_marks = sum(answer.get('marks', 0) for answer in preview.answers_data.values())
                        scored_marks = sum(answer.get('marks', 0) for answer in preview.answers_data.values() if answer.get('is_correct'))
                        
                        if total_marks > 0:
                            score = (scored_marks / total_marks) * 100
                            all_scores.append(score)
            
            if all_scores:
                subject_stats[subject.name] = {
                    'best_score': round(max(all_scores), 2),
                    'avg_score': round(sum(all_scores) / len(all_scores), 2)
                }
            else:
                subject_stats[subject.name] = {
                    'best_score': 0,
                    'avg_score': 0
                }
                
        subjects = list(subject_stats.keys())
        return jsonify({
            'subjects': subjects,
            'best_scores': [subject_stats[s]['best_score'] for s in subjects],
            'avg_scores': [subject_stats[s]['avg_score'] for s in subjects]
        })
        
    except Exception as e:
        app.logger.error(f"Error in get_overall_performance: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/admin/subject_chapter_performance/<int:subject_id>')
@auth_required()
def get_admin_chapter_performance(subject_id):
    try:
        chapters = Chapter.query.filter_by(subject_id=subject_id).order_by(Chapter.id).all()
        chapter_stats = {}
        
        for chapter in chapters:
            chapter_scores = []
            quizzes = Quiz.query.filter_by(chapter_id=chapter.id).all()
            
            for quiz in quizzes:
                previews = QuizPreview.query.filter_by(quiz_id=quiz.id).all()
                
                for preview in previews:
                    if not preview.answers_data:
                        continue
                        
                    total_marks = sum(answer.get('marks', 0) for answer in preview.answers_data.values())
                    scored_marks = sum(answer.get('marks', 0) for answer in preview.answers_data.values() if answer.get('is_correct'))
                    
                    if total_marks > 0:
                        score = (scored_marks / total_marks) * 100
                        chapter_scores.append(score)
            
            chapter_name = f"Chapter {chapter.id}"
            if chapter_scores:
                chapter_stats[chapter_name] = {
                    'best_score': round(max(chapter_scores), 2),
                    'avg_score': round(sum(chapter_scores) / len(chapter_scores), 2)
                }
            else:
                chapter_stats[chapter_name] = {
                    'best_score': 0,
                    'avg_score': 0
                }
                
        chapters = sorted(list(chapter_stats.keys()), key=lambda x: int(x.split()[-1]))
        return jsonify({
            'chapters': chapters,
            'best_scores': [chapter_stats[c]['best_score'] for c in chapters],
            'avg_scores': [chapter_stats[c]['avg_score'] for c in chapters]
        })
        
    except Exception as e:
        app.logger.error(f"Error in get_admin_chapter_performance: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/admin/user_performance/<int:user_id>/subjects')
@auth_required()
def get_user_subject_performance(user_id):
    try:
        subjects = Subject.query.all()
        subject_stats = {}
        
        for subject in subjects:
            chapters = Chapter.query.filter_by(subject_id=subject.id).all()
            subject_scores = []
            
            for chapter in chapters:
                quizzes = Quiz.query.filter_by(chapter_id=chapter.id).all()
                for quiz in quizzes:
                    previews = QuizPreview.query.filter_by(
                        quiz_id=quiz.id,
                        user_id=user_id
                    ).all()
                    
                    for preview in previews:
                        if not preview.answers_data:
                            continue
                            
                        total_marks = sum(answer.get('marks', 0) for answer in preview.answers_data.values())
                        scored_marks = sum(answer.get('marks', 0) for answer in preview.answers_data.values() if answer.get('is_correct'))
                        
                        if total_marks > 0:
                            score = (scored_marks / total_marks) * 100
                            subject_scores.append(score)
            
            if subject_scores:
                subject_stats[subject.name] = {
                    'best_score': round(max(subject_scores), 2),
                    'avg_score': round(sum(subject_scores) / len(subject_scores), 2)
                }
            else:
                subject_stats[subject.name] = {
                    'best_score': 0,
                    'avg_score': 0
                }
                
        subjects = list(subject_stats.keys())
        return jsonify({
            'subjects': subjects,
            'best_scores': [subject_stats[s]['best_score'] for s in subjects],
            'avg_scores': [subject_stats[s]['avg_score'] for s in subjects]
        })
        
    except Exception as e:
        app.logger.error(f"Error getting user subject performance: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/admin/user_performance/<int:user_id>/chapters/<int:subject_id>')
@auth_required()
def get_user_chapter_performance(user_id, subject_id):
    try:
        chapters = Chapter.query.filter_by(subject_id=subject_id).order_by(Chapter.id).all()
        chapter_stats = {}
        
        for chapter in chapters:
            chapter_scores = []
            quizzes = Quiz.query.filter_by(chapter_id=chapter.id).all()
            
            for quiz in quizzes:
                previews = QuizPreview.query.filter_by(
                    quiz_id=quiz.id,
                    user_id=user_id
                ).all()
                
                for preview in previews:
                    if not preview.answers_data:
                        continue
                        
                    total_marks = sum(answer.get('marks', 0) for answer in preview.answers_data.values())
                    scored_marks = sum(answer.get('marks', 0) for answer in preview.answers_data.values() if answer.get('is_correct'))
                    
                    if total_marks > 0:
                        score = (scored_marks / total_marks) * 100
                        chapter_scores.append(score)
            
            chapter_name = f"Chapter {chapter.id}"
            if chapter_scores:
                chapter_stats[chapter_name] = {
                    'best_score': round(max(chapter_scores), 2),
                    'avg_score': round(sum(chapter_scores) / len(chapter_scores), 2)
                }
            else:
                chapter_stats[chapter_name] = {
                    'best_score': 0,
                    'avg_score': 0
                }
                
        chapters = sorted(list(chapter_stats.keys()), key=lambda x: int(x.split()[-1]))
        return jsonify({
            'chapters': chapters,
            'best_scores': [chapter_stats[c]['best_score'] for c in chapters],
            'avg_scores': [chapter_stats[c]['avg_score'] for c in chapters]
        })
        
    except Exception as e:
        app.logger.error(f"Error getting user chapter performance: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/admin/users')
@auth_required()
def get_admin_users():
    try:
        # Get user role
        user_role = Role.query.filter_by(name='user').first()
        if not user_role:
            return jsonify({'error': 'User role not found'}), 404
            
        # Query users with 'user' role
        users = User.query.join(User.roles).filter(Role.name == 'user').all()
        
        users_data = [{
            'id': user.id,
            'email': user.email,
            'name': user.full_name,
            'photoUrl': f'/uploads/{os.path.basename(user.user_profile)}' if user.user_profile else None,
            'dob': user.dob.strftime('%Y-%m-%d') if user.dob else None,
            'qualifications': user.qualification
        } for user in users]
        
        return jsonify(users_data)
        
    except Exception as e:
        app.logger.error(f"Error fetching admin users: {str(e)}")
        return jsonify({'error': str(e)}), 500