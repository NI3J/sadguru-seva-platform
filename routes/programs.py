#!/usr/bin/env python3
import os
import datetime
from collections import defaultdict
from werkzeug.utils import secure_filename
from flask import (
    Blueprint, render_template, request, flash,
    redirect, url_for, session, current_app
)
from db_config import get_db_connection
from pymysql.cursors import DictCursor

# 📘 Blueprint Initialization - FIXED
programs_bp = Blueprint('programs', __name__)

# 🔍 Helper: Fetch Daily Programs from DB
def fetch_daily_programs():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(DictCursor)
        cursor.execute("SELECT date, content, image_path FROM daily_programs ORDER BY date DESC")
        records = cursor.fetchall()
        print(f"✅ Fetched {len(records)} program records from database")
    except Exception as err:
        print("⚠️ Error fetching programs:", err)
        records = []
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()
    return records

# 🧘 Helper: Group Programs by Date
def group_programs_by_day(records):
    grouped = defaultdict(list)
    for entry in records:
        # Convert date to string if it's a date object
        date_str = str(entry['date']) if entry['date'] else 'Unknown'
        # Handle both old format (string) and new format (dict with image_path)
        if isinstance(entry.get('content'), str):
            program_data = {
                'content': entry['content'],
                'image_path': entry.get('image_path')
            }
        else:
            # Fallback for old format
            program_data = {
                'content': entry.get('content', ''),
                'image_path': entry.get('image_path')
            }
        grouped[date_str].append(program_data)
    
    # Sort by date descending
    sorted_dates = sorted(grouped.items(), key=lambda x: x[0], reverse=True)
    result = [{'date': date, 'programs': entries} for date, entries in sorted_dates]
    print(f"✅ Grouped programs into {len(result)} days")
    return result

# 📅 Route: View Daily Programs
@programs_bp.route('/programs')
def programs():
    try:
        print("🔄 Loading programs page...")
        
        # Fetch data
        records = fetch_daily_programs()
        days = group_programs_by_day(records)
        today = datetime.date.today().strftime('%Y-%m-%d')
        
        # Calculate statistics
        total_programs = sum(len(day['programs']) for day in days)
        today_programs = sum(len(day['programs']) for day in days if day['date'] == today)
        
        print(f"📊 Statistics: {total_programs} total programs, {today_programs} today")
        
        # Check if template exists
        template_path = 'program/program.html'
        full_template_path = os.path.join(current_app.template_folder, template_path)
        
        if not os.path.exists(full_template_path):
            print(f"❌ Template not found at: {full_template_path}")
            # Try alternative paths
            alt_paths = [
                'program.html',
                'programs.html',
                'program/programs.html'
            ]
            for alt_path in alt_paths:
                alt_full_path = os.path.join(current_app.template_folder, alt_path)
                if os.path.exists(alt_full_path):
                    print(f"✅ Found template at alternative path: {alt_path}")
                    template_path = alt_path
                    break
            else:
                return f"""
                <h1>Template Error</h1>
                <p>Template not found at: {full_template_path}</p>
                <p>Template folder: {current_app.template_folder}</p>
                <p>Looking for: {template_path}</p>
                <h3>Available files:</h3>
                <ul>
                """
        
        print(f"✅ Rendering template: {template_path}")
        
        return render_template(
            template_path,
            days=days,
            today=today,
            total_programs=total_programs,
            today_programs=today_programs
        )
        
    except Exception as e:
        print(f"❌ Error in programs route: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return f"""
        <h1>Error Loading Programs</h1>
        <p>Error: {str(e)}</p>
        <p>Please check the Flask console for detailed error information.</p>
        <a href="/">← Back to Home</a>
        """

# 📝 Route: Submit New Program
@programs_bp.route('/submit_program', methods=['POST'])
def submit_program():
    image_path = None
    try:
        date = request.form.get('date')
        content = request.form.get('content')
        created_by = session.get('admin_name') or session.get('admin_phone')
        
        print(f"📝 Submitting program: Date={date}, Content length={len(content) if content else 0}")
        
        if not date or not content:
            flash("⚠️ कृपया सर्व आवश्यक माहिती भरा.", 'error')
            return redirect(url_for('admin.admin_dashboard'))
        
        # Handle image upload
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file and image_file.filename:
                # Validate file extension
                allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
                filename = secure_filename(image_file.filename)
                if '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions:
                    # Create uploads directory if it doesn't exist
                    upload_folder = os.path.join(current_app.static_folder, 'uploads', 'programs')
                    os.makedirs(upload_folder, exist_ok=True)
                    
                    # Generate unique filename
                    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
                    file_extension = filename.rsplit('.', 1)[1].lower()
                    unique_filename = f"{timestamp}_{filename}"
                    file_path = os.path.join(upload_folder, unique_filename)
                    
                    # Save the file
                    image_file.save(file_path)
                    
                    # Store relative path for database
                    image_path = f"uploads/programs/{unique_filename}"
                    print(f"✅ Image uploaded: {image_path}")
                else:
                    flash("⚠️ अवैध प्रतिमा फॉर्मेट. फक्त PNG, JPG, JPEG, GIF किंवा WEBP फाइल्स परवानगी आहेत.", 'warning')
        
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO daily_programs (date, content, image_path, created_by) VALUES (%s, %s, %s, %s)",
            (date, content, image_path, created_by)
        )
        connection.commit()
        
        print("✅ Program submitted successfully")
        flash("📅 कार्यक्रम यशस्वीरीत्या नोंदवला गेला.", 'success')
        
    except Exception as err:
        print(f"⚠️ Database error: {err}")
        import traceback
        traceback.print_exc()
        flash("⚠️ कार्यक्रम नोंदवता आला नाही. कृपया पुन्हा प्रयत्न करा.", 'error')
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()
    
    return redirect(url_for('programs.programs'))

# 📽️ Route: Sadguru Katha Page
@programs_bp.route('/katha')
def katha():
    try:
        video_path = os.path.join(current_app.static_folder, 'videos/sadguru_katha.mp4')
        video_exists = os.path.exists(video_path)
        print(f"🎥 Katha page: Video exists = {video_exists}")
        return render_template('katha.html', video_exists=video_exists)
    except Exception as e:
        print(f"❌ Error loading katha page: {e}")
        return f"Error loading katha page: {str(e)}"

# 🔧 Debug route (temporary - remove in production)
@programs_bp.route('/debug')
def debug_info():
    try:
        template_folder = current_app.template_folder
        files_in_template_folder = []
        
        for root, dirs, files in os.walk(template_folder):
            for file in files:
                rel_path = os.path.relpath(os.path.join(root, file), template_folder)
                files_in_template_folder.append(rel_path)
        
        return f"""
        <h1>Debug Information</h1>
        <h3>Template Folder: {template_folder}</h3>
        <h3>Available Templates:</h3>
        <ul>
            {''.join(f'<li>{f}</li>' for f in sorted(files_in_template_folder))}
        </ul>
        <h3>Database Test:</h3>
        <p>Records: {len(fetch_daily_programs())}</p>
        """
    except Exception as e:
        return f"Debug error: {str(e)}"
