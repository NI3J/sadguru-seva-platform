#!/usr/bin/env python3

import os
import random
import requests
from flask import current_app
from flask_mail import Message

# 📞 Phone Normalizer Utility
def normalize(phone):
    """Normalize phone number by removing +91 prefix and leading zeros"""
    return phone.strip().replace('+91', '').lstrip('0')

# 🔢 OTP Generator
def generate_otp(length=6):
    """Generate random OTP of specified length"""
    return str(random.randint(10**(length - 1), 10**length - 1))

# 📲 Send OTP via Fast2SMS
def send_sms(mobile, otp):
    """Send SMS using Fast2SMS API"""
    url = "https://www.fast2sms.com/dev/bulkV2"
    headers = {
        "authorization": os.getenv("FAST2SMS_API_KEY"),
        "Content-Type": "application/json"
    }
    payload = {
        "route": "otp",
        "variables_values": otp,
        "numbers": mobile
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        print(f"📲 SMS API Response: {response.text}")
        return True
    except Exception as e:
        print("⚠ Failed to send OTP:", e)
        return False

# 📧 Send Email Utility
def send_email(subject, recipients, html_body, sender=None):
    """Send email using Flask-Mail"""
    try:
        msg = Message(
            subject=subject,
            sender=sender or current_app.config['MAIL_USERNAME'],
            recipients=recipients if isinstance(recipients, list) else [recipients],
            html=html_body
        )
        current_app.mail.send(msg)
        print("📨 Email sent successfully")
        return True
    except Exception as e:
        print(f"⚠️ Failed to send email: {e}")
        return False
