#!/usr/bin/env python3

from flask import Blueprint, render_template, request, redirect, flash, session
from routes.utils import generate_otp, send_sms

# 🔐 Create Blueprint
auth_bp = Blueprint('auth', __name__)

# 🔐 OTP Request
@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    username = request.form.get('username')
    mobile = request.form.get('mobile')

    if not username or not mobile:
        flash("⚠ कृपया नाव आणि मोबाईल नंबर भरा.")
        return redirect('/')

    otp = generate_otp()
    session['otp'] = otp
    session['username'] = username

    if not send_sms(mobile, otp):
        flash("⚠ OTP पाठवण्यात अडचण आली.")
        return redirect('/')

    return render_template('enter_otp.html', username=username)

# 🔓 OTP Validation
@auth_bp.route('/validate-otp', methods=['POST'])
def validate_otp():
    entered_otp = request.form.get('otp')
    actual_otp = session.get('otp')
    username = session.get('username', 'भक्त')

    if entered_otp == actual_otp:
        return render_template('wisdom_access_granted.html', username=username)
    else:
        flash("⚠ OTP चुकीचा आहे.")
        return redirect('/retry-otp')

# 🔄 Retry OTP
@auth_bp.route('/retry-otp')
def retry_otp():
    username = session.get('username', 'भक्त')
    return render_template('enter_otp.html', username=username)
