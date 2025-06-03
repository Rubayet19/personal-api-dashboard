import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from dotenv import load_dotenv
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DOTENV_PATH = PROJECT_ROOT / '.env'


if DOTENV_PATH.exists():
    load_dotenv(dotenv_path=DOTENV_PATH)
else:

    load_dotenv()


# Configure logging
logger = logging.getLogger(__name__)

# Email configuration
BREVO_API_KEY = os.getenv('BREVO_API_KEY')
GMAIL_EMAIL = os.getenv('GMAIL_EMAIL')
GMAIL_PASSWORD = os.getenv('GMAIL_APP_PASSWORD')  # Use App Password, not regular password
SENDER_EMAIL = os.getenv('SENDER_EMAIL', "pphvyyr8xh@privaterelay.appleid.com")
SENDER_NAME = "Personal API Dashboard"

# Check for test environment
IS_TESTING = os.getenv('TESTING', 'False').lower() == 'true'

def get_brevo_client():
    """Get configured Brevo API client."""
    if not BREVO_API_KEY or BREVO_API_KEY == "your_brevo_api_key_here":
        logger.warning("Brevo API key not configured")
        return None
    
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY
    return sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

def send_email_via_gmail(recipient_email: str, subject: str, html_content: str, text_content: str) -> bool:
    """Send email using Gmail SMTP as fallback."""
    if not GMAIL_EMAIL or not GMAIL_PASSWORD:
        logger.error("Gmail credentials not configured")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{SENDER_NAME} <{GMAIL_EMAIL}>"
        msg['To'] = recipient_email
        
        # Add text and HTML parts
        text_part = MIMEText(text_content, 'plain')
        html_part = MIMEText(html_content, 'html')
        
        msg.attach(text_part)
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(GMAIL_EMAIL, GMAIL_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully via Gmail to {recipient_email}")
        return True
        
    except Exception as e:
        logger.error(f"Gmail SMTP error when sending email to {recipient_email}: {e}")
        return False

def send_password_reset_email(recipient_email: str, user_name: str, reset_link: str) -> bool:
    """
    Send a password reset email using Brevo or Gmail fallback.
    
    Args:
        recipient_email: Email address to send the reset link to
        user_name: Name of the user (can be email if name not available)
        reset_link: The password reset link to include in the email
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if IS_TESTING:
        # In testing mode, just log and return success
        logger.info(f"TEST MODE: Would send password reset email to {recipient_email}")
        logger.info(f"TEST MODE: Reset link would be: {reset_link}")
        return True
    
    # Create email content
    subject = "Reset Your Password for Personal API Dashboard"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #2563eb; margin-bottom: 30px;">Password Reset Request</h1>
            
            <p style="font-size: 16px; margin-bottom: 20px;">Hi {user_name},</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
                We received a request to reset your password for your Personal API Dashboard account.
                If you made this request, click the button below to reset your password:
            </p>
            
            <div style="margin: 40px 0;">
                <a href="{reset_link}" 
                   style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Reset Your Password
                </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                This link is valid for 1 hour. If you didn't request this password reset, 
                please ignore this email and your password will remain unchanged.
            </p>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                If the button above doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <p style="font-size: 12px; color: #888; word-break: break-all; background-color: #f1f1f1; padding: 10px; border-radius: 5px;">
                {reset_link}
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #888;">
                Best regards,<br>
                Personal API Dashboard Team
            </p>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    text_content = f"""
    Password Reset Request
    
    Hi {user_name},
    
    We received a request to reset your password for your Personal API Dashboard account.
    If you made this request, click the link below to reset your password:
    
    {reset_link}
    
    This link is valid for 1 hour. If you didn't request this password reset, 
    please ignore this email and your password will remain unchanged.
    
    Best regards,
    Personal API Dashboard Team
    """
    
    # Try Brevo first, then Gmail fallback
    try:
        api_instance = get_brevo_client()
        if api_instance:
            # Create email object
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": recipient_email}],
                sender={"name": SENDER_NAME, "email": SENDER_EMAIL},
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
            
            # Send email
            api_response = api_instance.send_transac_email(send_smtp_email)
            logger.info(f"Password reset email sent successfully via Brevo to {recipient_email}. Message ID: {api_response.message_id}")
            return True
            
    except ApiException as e:
        logger.error(f"Brevo API error when sending password reset email to {recipient_email}: {e}")
        logger.info("Trying Gmail fallback...")
        
        # Try Gmail fallback
        return send_email_via_gmail(recipient_email, subject, html_content, text_content)
        
    except Exception as e:
        logger.error(f"Unexpected error when sending password reset email to {recipient_email}: {e}")
        logger.info("Trying Gmail fallback...")
        
        # Try Gmail fallback
        return send_email_via_gmail(recipient_email, subject, html_content, text_content)
    
    # If Brevo client couldn't be created, try Gmail
    logger.info("Brevo not available, using Gmail fallback...")
    return send_email_via_gmail(recipient_email, subject, html_content, text_content)

def send_password_change_notification(recipient_email: str, user_name: str) -> bool:
    """
    Send a notification email when password has been successfully changed.
    
    Args:
        recipient_email: Email address to send the notification to
        user_name: Name of the user (can be email if name not available)
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if IS_TESTING:
        # In testing mode, just log and return success
        logger.info(f"TEST MODE: Would send password change notification to {recipient_email}")
        return True
    
    # Create email content
    subject = "Password Changed Successfully - Personal API Dashboard"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #16a34a; margin-bottom: 30px;">Password Changed Successfully</h1>
            
            <p style="font-size: 16px; margin-bottom: 20px;">Hi {user_name},</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
                Your password for Personal API Dashboard has been successfully changed.
            </p>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                If you did not make this change, please contact our support team immediately.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #888;">
                Best regards,<br>
                Personal API Dashboard Team
            </p>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    text_content = f"""
    Password Changed Successfully
    
    Hi {user_name},
    
    Your password for Personal API Dashboard has been successfully changed.
    
    If you did not make this change, please contact our support team immediately.
    
    Best regards,
    Personal API Dashboard Team
    """
    
    # Try Brevo first, then Gmail fallback
    try:
        api_instance = get_brevo_client()
        if api_instance:
            # Create email object
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": recipient_email}],
                sender={"name": SENDER_NAME, "email": SENDER_EMAIL},
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
            
            # Send email
            api_response = api_instance.send_transac_email(send_smtp_email)
            logger.info(f"Password change notification sent successfully via Brevo to {recipient_email}. Message ID: {api_response.message_id}")
            return True
            
    except ApiException as e:
        logger.error(f"Brevo API error when sending password change notification to {recipient_email}: {e}")
        logger.info("Trying Gmail fallback...")
        
        # Try Gmail fallback
        return send_email_via_gmail(recipient_email, subject, html_content, text_content)
        
    except Exception as e:
        logger.error(f"Unexpected error when sending password change notification to {recipient_email}: {e}")
        logger.info("Trying Gmail fallback...")
        
        # Try Gmail fallback
        return send_email_via_gmail(recipient_email, subject, html_content, text_content)
    
    # If Brevo client couldn't be created, try Gmail
    logger.info("Brevo not available, using Gmail fallback...")
    return send_email_via_gmail(recipient_email, subject, html_content, text_content) 