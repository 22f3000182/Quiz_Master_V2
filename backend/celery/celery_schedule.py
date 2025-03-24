from celery.schedules import crontab
from flask import current_app as app
from .tasks import daily_reminder, monthly_report

celery_app = app.extensions['celery']

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Daily reminder at 6 PM
    sender.add_periodic_task(
        crontab(hour=18, minute=0),
        daily_reminder.s(),
        name='daily-reminder'
    )
    
    # Monthly report on 1st of every month
    sender.add_periodic_task(
        crontab(day_of_month=1, hour=9),
        monthly_report.s(),
        name='monthly-report'
    )

