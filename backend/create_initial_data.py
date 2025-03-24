from flask import current_app as app
from backend.models import db, Subject, Chapter, Quiz, Question, User
from flask_security import SQLAlchemyUserDatastore, hash_password
from datetime import datetime

with app.app_context():
    db.create_all()

    userdatastore: SQLAlchemyUserDatastore = app.security.datastore

    # Create roles
    userdatastore.find_or_create_role(name='admin', description='superuser')
    userdatastore.find_or_create_role(name='user', description='general user')

    # Create users
    if not userdatastore.find_user(email='admin@gmail.com'):
        userdatastore.create_user(email='admin@gmail.com', password=hash_password('admin'), roles=['admin'])
    if not userdatastore.find_user(email='user@gmail.com'):
        userdatastore.create_user(email='user@gmail.com', password=hash_password('pass'), roles=['user'])
    if not userdatastore.find_user(email='user1@gmail.com'):
        userdatastore.create_user(email='user1@gmail.com', password=hash_password('pass'), roles=['user'])
    if not userdatastore.find_user(email='user2@gmail.com'):
        userdatastore.create_user(email='user2@gmail.com', password=hash_password('pass'), roles=['user'])
    if not userdatastore.find_user(email='user3@gmail.com'):
        userdatastore.create_user(email='user3@gmail.com', password=hash_password('pass'), roles=['user'])



    # Create subjects
    subjects = ['Math', 'Science', 'History']
    for subject_name in subjects:
        subject = Subject.query.filter_by(name=subject_name).first()
        if not subject:
            subject = Subject(name=subject_name, description=f'{subject_name} description')
            db.session.add(subject)
            db.session.flush()  # Ensure subject.id is available

        # Create chapters for each subject
        for i in range(1, 4):
            chapter = Chapter.query.filter_by(name=f'{subject_name} Chapter {i}', subject_id=subject.id).first()
            if not chapter:
                chapter = Chapter(name=f'{subject_name} Chapter {i}', description=f'{subject_name} Chapter {i} description', subject_id=subject.id)
                db.session.add(chapter)
                db.session.flush()  # Ensure chapter.id is available

            # Create quizzes for each chapter
            for j in range(1, 3):
                quiz = Quiz.query.filter_by(quiz_name=f'{subject_name} Chapter {i} Quiz {j}', chapter_id=chapter.id).first()
                if not quiz:
                    quiz = Quiz(
                        quiz_name=f'{subject_name} Chapter {i} Quiz {j}',
                        chapter_id=chapter.id,
                        date_of_quiz=datetime.now().date(),
                        time_duration='01:00',
                        remarks=f'{subject_name} Chapter {i} Quiz {j} remarks',
                        is_live=True
                    )
                    db.session.add(quiz)
                    db.session.flush()  # Ensure quiz.id is available

                    # Create questions for each quiz
                    for k in range(1, 6):
                        question = Question.query.filter_by(quiz_id=quiz.id, question_statement=f'{subject_name} Chapter {i} Quiz {j} Question {k}').first()
                        if not question:
                            question = Question(
                                quiz_id=quiz.id,
                                question_statement=f'{subject_name} Chapter {i} Quiz {j} Question {k}',
                                options=['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                                correct_option='Option 1',
                                marks=1
                            )
                            db.session.add(question)

    db.session.commit()