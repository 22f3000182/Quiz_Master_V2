from flask import Flask
from flask_login import login_required
from backend.config import LocalDevelopmentConfig
from backend.models import db, User, Role, Subject, Question, Quiz, Score
from flask_security import Security, SQLAlchemyUserDatastore, auth_required
from flask import send_from_directory
from flask_session import Session
from datetime import timedelta
from backend.celery.celery_factory import celery_init_app



def createApp():
    app = Flask(__name__, template_folder='frontend', static_folder='frontend', static_url_path='/static')

    app.config.from_object(LocalDevelopmentConfig)
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory('frontend/pics', filename)

    app.config.from_object(LocalDevelopmentConfig)

    # model init
    db.init_app(app)

    # Session configuration
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
    Session(app)
    
    app.config.update(
        SESSION_COOKIE_SECURE=False,  # Set to True in production
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE='Lax',
        SESSION_REFRESH_EACH_REQUEST=True
    )
    

    datastore = SQLAlchemyUserDatastore(db, User, Role)

    app.security = Security(app, datastore=datastore, register_blueprint=False)
    app.app_context().push()

    celery_app = celery_init_app(app)

    return app

app = createApp()

import backend.celery.celery_schedule
import backend.create_initial_data

import backend.routes



if (__name__ == '__main__'):
    app.run()

