from celery import shared_task
from .mail_service import send_email
from datetime import datetime, timedelta
from backend.models import User, Quiz, QuizPreview
from .stats_service import get_monthly_stats  # Import the function

def generate_report_html(month_stats):
    # Placeholder function to generate HTML report
    report_html = f"<h1>Monthly Report</h1><p>{month_stats}</p>"
    return report_html
import csv
import io

@shared_task(ignore_result=True)
def daily_reminder():
    users = User.query.filter(User.roles.any(name='user')).all()
    for user in users:
        last_login = user.last_login or datetime.min
        if datetime.now() - last_login > timedelta(days=1):
            send_email(
                user.email,
                'Quiz Reminder',
                f'<h1>Hello {user.full_name}</h1><p>Don\'t forget to practice your quizzes today!</p>'
            )

@shared_task(ignore_result=True)
def monthly_report():
    users = User.query.filter(User.roles.any(name='user')).all()
    for user in users:
        month_stats = get_monthly_stats(user)
        report_html = generate_report_html(month_stats)
        send_email(
            user.email,
            'Monthly Performance Report',
            report_html
        )

@shared_task(bind=True)
def export_quiz_data(self, user_id):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Quiz', 'Date', 'Score', 'Time Taken'])
    
    previews = QuizPreview.query.filter_by(user_id=user_id).all()
    for preview in previews:
        writer.writerow([
            preview.quiz.name,
            preview.created_at,
            preview.score,
            preview.time_taken
        ])
    
    return output.getvalue()