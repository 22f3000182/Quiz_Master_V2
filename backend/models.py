


from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
import uuid
from datetime import datetime


db = SQLAlchemy()

roles_users = db.Table('roles_users',
    db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))
)

class Role(db.Model, RoleMixin):
    __tablename__ = 'role'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    password = db.Column(db.String(255))
    user_profile = db.Column(db.String(255))
    email = db.Column(db.String(255), unique=True)
    full_name = db.Column(db.String(255))
    qualification = db.Column(db.String(255))
    dob = db.Column(db.Date)
    active = db.Column(db.Boolean())
    fs_uniquifier = db.Column(db.String(255), unique=True, default=lambda: uuid.uuid4().hex)
    roles = db.relationship('Role', secondary=roles_users,
                          backref=db.backref('users', lazy='dynamic'))


class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True)
    description = db.Column(db.Text)
    chapters = db.relationship('Chapter', backref='subject', cascade='all, delete-orphan', lazy=True)

class Chapter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255))
    description = db.Column(db.Text)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'))
    quizzes = db.relationship('Quiz', backref='chapter', cascade='all, delete-orphan', lazy=True)

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_name=db.Column(db.String(255), nullable=False)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.id'))
    date_of_quiz = db.Column(db.Date)
    time_duration = db.Column(db.String(5))  # Format: HH:MM
    remarks = db.Column(db.Text)
    is_live =  db.Column(db.Boolean())
    questions = db.relationship('Question', backref='quiz', cascade='all, delete-orphan', lazy=True)
    scores = db.relationship('Score', backref='quiz', cascade='all, delete-orphan', lazy=True)

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'))
    question_statement = db.Column(db.Text)
    options = db.Column(db.JSON)  # Store options as a JSON array
    correct_option = db.Column(db.String(255))
    marks = db.Column(db.Integer)

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    time_stamp_of_attempt = db.Column(db.DateTime)
    total_scored = db.Column(db.Integer)

class QuizPreview(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    answers_data = db.Column(db.JSON, nullable=False)
    time_stamp_of_attempt = db.Column(db.DateTime, default=datetime.utcnow)

    quiz = db.relationship('Quiz', backref='quiz_previews')
    user = db.relationship('User', backref='quiz_previews')

#create json for storing right answer and wrong answer of quetion of that quiz.