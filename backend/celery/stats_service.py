from datetime import datetime, timedelta
from backend.models import db, User, QuizPreview, Quiz
from sqlalchemy import func

def get_monthly_stats(user):
    # Get first day of current month
    today = datetime.now()
    first_day = datetime(today.year, today.month, 1)
    
    # Get all quiz attempts for the month
    monthly_attempts = QuizPreview.query.filter(
        QuizPreview.user_id == user.id,
        QuizPreview.created_at >= first_day,
        QuizPreview.created_at <= today
    ).all()
    
    if not monthly_attempts:
        return {
            'total_quizzes': 0,
            'average_score': 0,
            'best_score': 0,
            'total_time': 0,
            'rank': 'N/A',
            'quizzes': []
        }
    
    # Calculate statistics
    scores = [attempt.score for attempt in monthly_attempts]
    avg_score = sum(scores) / len(scores)
    best_score = max(scores)
    total_time = sum([attempt.time_taken for attempt in monthly_attempts])
    
    # Calculate user ranking
    all_users_avg = db.session.query(
        QuizPreview.user_id,
        func.avg(QuizPreview.score).label('avg_score')
    ).filter(
        QuizPreview.created_at >= first_day
    ).group_by(QuizPreview.user_id).all()
    
    sorted_ranks = sorted(all_users_avg, key=lambda x: x.avg_score, reverse=True)
    user_rank = next(i for i, x in enumerate(sorted_ranks, 1) if x.user_id == user.id)
    
    # Get quiz details
    quiz_stats = []
    for attempt in monthly_attempts:
        quiz_stats.append({
            'quiz_name': attempt.quiz.name,
            'score': attempt.score,
            'date': attempt.created_at.strftime('%Y-%m-%d %H:%M'),
            'time_taken': attempt.time_taken
        })
    
    return {
        'total_quizzes': len(monthly_attempts),
        'average_score': round(avg_score, 2),
        'best_score': best_score,
        'total_time': total_time,
        'rank': f"{user_rank}/{len(all_users_avg)}",
        'quizzes': quiz_stats
    }

def generate_report_html(stats):
    return f"""
    <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .container {{ padding: 20px; }}
                .stat-box {{ 
                    margin: 10px 0;
                    padding: 15px;
                    background: #f5f5f5;
                    border-radius: 5px;
                }}
                table {{ width: 100%; border-collapse: collapse; }}
                th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Monthly Performance Report</h1>
                
                <div class="stat-box">
                    <h3>Overview</h3>
                    <p>Total Quizzes: {stats['total_quizzes']}</p>
                    <p>Average Score: {stats['average_score']}%</p>
                    <p>Best Score: {stats['best_score']}%</p>
                    <p>Total Time Spent: {stats['total_time']} minutes</p>
                    <p>Your Rank: {stats['rank']}</p>
                </div>
                
                <div class="stat-box">
                    <h3>Quiz Details</h3>
                    <table>
                        <tr>
                            <th>Quiz</th>
                            <th>Score</th>
                            <th>Date</th>
                            <th>Time Taken</th>
                        </tr>
                        {''.join(f'''
                        <tr>
                            <td>{quiz['quiz_name']}</td>
                            <td>{quiz['score']}%</td>
                            <td>{quiz['date']}</td>
                            <td>{quiz['time_taken']} min</td>
                        </tr>
                        ''' for quiz in stats['quizzes'])}
                    </table>
                </div>
            </div>
        </body>
    </html>
    """