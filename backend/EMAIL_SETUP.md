# Email Setup Guide

## Issues Fixed
1. **Bcrypt compatibility error** - Fixed by downgrading to bcrypt==4.1.3
2. **Brevo account not activated** - Added Gmail SMTP fallback

## Email Service Options

### Option 1: Brevo (Primary - Requires Account Activation)
Your Brevo account needs to be activated before you can send emails. 

**Steps:**
1. Contact Brevo support at `contact@brevo.com`
2. Request SMTP account activation
3. Wait 24-48 hours for activation
4. Add your API key to `.env` file

### Option 2: Gmail SMTP (Fallback - Works Immediately)
Use Gmail as a fallback email service.

**Steps:**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Add credentials to `.env` file

## Environment Variables

Add these to your `backend/.env` file:

```bash
# Email Configuration (Brevo - Primary)
BREVO_API_KEY=your_brevo_api_key_here
SENDER_EMAIL=your-verified-sender@example.com

# Email Configuration (Gmail - Fallback)
GMAIL_EMAIL=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# Other required variables
FRONTEND_URL=http://localhost:5173
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=60
JWT_SECRET_KEY=your-super-secret-jwt-key-here
```

## How It Works

1. **Primary**: System tries to send via Brevo first
2. **Fallback**: If Brevo fails, automatically uses Gmail SMTP
3. **Testing**: Set `TESTING=True` to skip actual email sending

## Testing the Fix

1. Add Gmail credentials to your `.env` file
2. Restart the backend server
3. Try the forgot password feature
4. Check server logs for success messages

## Security Notes

- Use Gmail App Passwords, not your regular password
- Keep your `.env` file secure and never commit it
- The system will automatically fall back to Gmail if Brevo is unavailable 