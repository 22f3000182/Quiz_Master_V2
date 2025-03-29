import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = 'quizmaster.mad@gmail.com'
SENDER_PASSWORD = 'sgza mlqn vuqt oucl'

def send_email(to, subject, content):
    try:
        msg = MIMEMultipart()
        msg['To'] = to
        msg['Subject'] = subject
        msg['From'] = SENDER_EMAIL
        msg.attach(MIMEText(content, 'html'))

        with smtplib.SMTP(host=SMTP_SERVER, port=SMTP_PORT) as server:
            server.starttls()
            try:
                server.login(SENDER_EMAIL, SENDER_PASSWORD)
                server.send_message(msg)
                logging.info(f"Email sent successfully to {to}")
                return True
            except smtplib.SMTPAuthenticationError:
                logging.error("SMTP Authentication failed. Check email and password")
                return False
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")
        return False

# Test connection
def test_connection():
    try:
        with smtplib.SMTP(host=SMTP_SERVER, port=SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            print("SMTP Connection successful!")
            return True
    except Exception as e:
        print(f"SMTP Connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_connection()