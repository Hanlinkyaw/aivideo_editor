#!/usr/bin/env python3
"""
AI Video Editor Web App - Complete Edition
For MacBook Pro
"""

import os
import sys
import uuid
import logging
import threading
import time
import traceback
import sqlite3
from datetime import datetime
from functools import wraps

from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import numpy as np

# MoviePy imports
try:
    from moviepy.editor import VideoFileClip, CompositeVideoClip, ImageClip, TextClip
    from moviepy.editor import concatenate_videoclips, AudioFileClip, CompositeAudioClip
    from moviepy.video.fx.all import speedx, fadein, fadeout
    print("✅ MoviePy imported successfully")
except ImportError as e:
    print(f"❌ MoviePy import error: {e}")
    sys.exit(1)

# PIL for image processing
try:
    from PIL import Image, ImageFilter, ImageDraw, ImageFont
    print("✅ Pillow imported successfully")
except ImportError as e:
    print(f"❌ Pillow import error: {e}")
    sys.exit(1)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['OUTPUT_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outputs')
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max
app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv'}
app.config['SECRET_KEY'] = 'video-editor-secret-key-change-this-in-production'

# Create folders if not exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# ==================== DATABASE SETUP ====================
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                  username TEXT UNIQUE, 
                  password TEXT,
                  email TEXT,
                  created_at TIMESTAMP)''')
    conn.commit()
    conn.close()

init_db()

# ==================== FLASK-LOGIN SETUP ====================
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'

class User(UserMixin):
    def __init__(self, id, username, email):
        self.id = id
        self.username = username
        self.email = email

@login_manager.user_loader
def load_user(user_id):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()
    conn.close()
    if user:
        return User(user[0], user[1], user[3])
    return None

# ==================== STORE JOBS ====================
active_jobs = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# ==================== EFFECT FUNCTIONS ====================

def zoom_effect(clip, zoom_factor=1.5, zoom_type='in'):
    """Zoom In/Out Effect"""
    def fl(im):
        h, w = im.shape[:2]
        if zoom_type == 'in':
            new_h, new_w = int(h / zoom_factor), int(w / zoom_factor)
            y_start = (h - new_h) // 2
            x_start = (w - new_w) // 2
            cropped = im[y_start:y_start+new_h, x_start:x_start+new_w]
            pil_img = Image.fromarray(cropped)
            zoomed = np.array(pil_img.resize((w, h), Image.Resampling.LANCZOS))
            return zoomed
        else:
            new_h, new_w = int(h * zoom_factor), int(w * zoom_factor)
            pil_img = Image.fromarray(im)
            shrunk = np.array(pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS))
            zoomed = np.zeros((h, w, 3), dtype=np.uint8)
            y_start = (h - new_h) // 2
            x_start = (w - new_w) // 2
            zoomed[y_start:y_start+new_h, x_start:x_start+new_w] = shrunk
            return zoomed
    return clip.fl_image(fl)

def freeze_effect(clip, freeze_duration=1):
    """Freeze last frame"""
    if clip.duration <= freeze_duration:
        return clip
    freeze_time = clip.duration - freeze_duration
    freeze_frame = clip.to_ImageClip(freeze_time)
    freeze_frame = freeze_frame.set_duration(freeze_duration)
    main_part = clip.subclip(0, freeze_time)
    return CompositeVideoClip([main_part, freeze_frame.set_start(main_part.duration)])

def mirror_effect(clip, mirror_type='horizontal'):
    """Mirror effect"""
    def fl(im):
        if mirror_type == 'horizontal':
            return np.fliplr(im)
        else:
            return np.flipud(im)
    return clip.fl_image(fl)

def rotate_effect(clip, angle=90):
    """Rotate effect"""
    def fl(im):
        pil_img = Image.fromarray(im)
        rotated = np.array(pil_img.rotate(angle, expand=True))
        return rotated
    return clip.fl_image(fl)

def blur_effect(clip, blur_radius=5):
    """Gaussian blur"""
    def fl(im):
        pil_img = Image.fromarray(im)
        blurred = pil_img.filter(ImageFilter.GaussianBlur(radius=blur_radius))
        return np.array(blurred)
    return clip.fl_image(fl)

def glitch_effect(clip, intensity=0.1):
    """RGB shift glitch"""
    def fl(im):
        h, w = im.shape[:2]
        shift = int(w * intensity)
        r = im[:, :, 0]
        g = im[:, :, 1]
        b = im[:, :, 2]
        r_shifted = np.roll(r, shift, axis=1)
        b_shifted = np.roll(b, -shift, axis=1)
        glitched = np.stack([r_shifted, g, b_shifted], axis=2)
        return np.clip(glitched, 0, 255).astype(np.uint8)
    return clip.fl_image(fl)

def old_film_effect(clip, scratch_intensity=0.1):
    """Old film with scratches"""
    def fl(im, t):
        h, w = im.shape[:2]
        sepia_filter = np.array([[0.393, 0.769, 0.189],
                                 [0.349, 0.686, 0.168],
                                 [0.272, 0.534, 0.131]])
        sepia = im @ sepia_filter.T
        sepia = np.clip(sepia, 0, 255).astype(np.uint8)
        if np.random.random() < scratch_intensity:
            scratch_y = np.random.randint(0, h)
            scratch_height = np.random.randint(1, 5)
            sepia[scratch_y:scratch_y+scratch_height, :] = 255
        flicker = 0.8 + 0.4 * np.random.random()
        sepia = (sepia * flicker).astype(np.uint8)
        return sepia
    return clip.fl(fl)

def speed_effect(clip, factor=1.5, speed_type='fast'):
    """Speed up/down"""
    if speed_type == 'fast':
        return clip.fx(speedx, factor)
    else:
        return clip.fx(speedx, 1/factor)

def text_effect(clip, text, font_path=None, font_size=40, color='white', position='center'):
    """Add Myanmar text to video"""
    try:
        def make_text_frame(t):
            h, w = clip.size
            img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            try:
                if font_path and os.path.exists(font_path):
                    font = ImageFont.truetype(font_path, font_size)
                else:
                    font = ImageFont.load_default()
            except:
                font = ImageFont.load_default()
            
            # Calculate position
            if position == 'center':
                x = w // 2
                y = h // 2
            elif position == 'top':
                x = w // 2
                y = 50
            elif position == 'bottom':
                x = w // 2
                y = h - 100
            elif position == 'watermark':
                x = 50
                y = 50
            
            draw.text((x, y), text, fill=color, font=font, anchor='mm')
            return np.array(img)
        
        txt_clip = VideoClip(make_text_frame, duration=clip.duration)
        return CompositeVideoClip([clip, txt_clip])
    except Exception as e:
        logger.error(f"Text effect error: {e}")
        return clip

def fade_transition(clip1, clip2, duration=1):
    """Fade transition"""
    clip1_end = clip1.fx(fadeout, duration)
    clip2_start = clip2.fx(fadein, duration)
    return concatenate_videoclips([clip1_end, clip2_start], method="compose")

def slide_transition(clip1, clip2, duration=1, direction='left'):
    """Slide transition"""
    def slide_effect(get_frame, t):
        frame = get_frame(t)
        h, w = frame.shape[:2]
        if direction == 'left':
            shift = int((t / duration) * w)
            return np.roll(frame, -shift, axis=1)
        else:
            shift = int((t / duration) * w)
            return np.roll(frame, shift, axis=1)
    
    clip2_slide = clip2.fl(slide_effect).set_duration(duration)
    return CompositeVideoClip([
        clip1.set_duration(clip1.duration - duration),
        clip2_slide.set_start(clip1.duration - duration)
    ])

def zoom_transition(clip1, clip2, duration=1):
    """Zoom transition"""
    def zoom_in(get_frame, t):
        frame = get_frame(t)
        h, w = frame.shape[:2]
        zoom = 1 + t/duration
        pil_img = Image.fromarray(frame)
        new_w, new_h = int(w * zoom), int(h * zoom)
        zoomed = np.array(pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS))
        y_start = (new_h - h) // 2
        x_start = (new_w - w) // 2
        return zoomed[y_start:y_start+h, x_start:x_start+w]
    
    clip2_zoomed = clip2.fl(zoom_in).set_duration(duration)
    return CompositeVideoClip([
        clip1.set_duration(clip1.duration - duration),
        clip2_zoomed.set_start(clip1.duration - duration)
    ])

def add_background_music(clip, music_path, volume=0.5):
    """Add background music"""
    if not os.path.exists(music_path):
        return clip
    music = AudioFileClip(music_path)
    if music.duration < clip.duration:
        music = music.loop(duration=clip.duration)
    else:
        music = music.subclip(0, clip.duration)
    music = music.volumex(volume)
    if clip.audio:
        final_audio = CompositeAudioClip([clip.audio, music])
    else:
        final_audio = music
    return clip.set_audio(final_audio)

def reduce_noise_effect(clip, strength=0.5):
    """Background noise reduction"""
    try:
        if clip.audio:
            audio = clip.audio
            # Simple low-pass filter for noise reduction
            from scipy import signal
            import numpy as np
            
            def reduce_noise(get_audio, t):
                samples = get_audio(t)
                if samples is None or len(samples) == 0:
                    return samples
                
                # Apply simple low-pass filter
                b, a = signal.butter(4, 0.1, 'low')
                filtered = signal.filtfilt(b, a, samples)
                return filtered.astype(samples.dtype)
            
            filtered_audio = audio.fl(reduce_noise)
            return clip.set_audio(filtered_audio)
    except Exception as e:
        logger.error(f"Noise reduction error: {e}")
    return clip

def get_output_parameters(quality):
    """Get video parameters based on quality"""
    qualities = {
        '720p': {'codec': 'libx264', 'bitrate': '2000k', 'preset': 'medium'},
        '1080p': {'codec': 'libx264', 'bitrate': '5000k', 'preset': 'medium'},
        '4k': {'codec': 'libx264', 'bitrate': '20000k', 'preset': 'slow'}
    }
    return qualities.get(quality, qualities['1080p'])

# ==================== VIDEO PROCESSING ====================

def process_video_task(job_id, input_path, options, user_id):
    """Background video processing"""
    try:
        active_jobs[job_id]['status'] = 'processing'
        active_jobs[job_id]['progress'] = 0
        
        split_time = int(options.get('split_time', 6))
        remove_time = float(options.get('remove_time', 1))
        output_quality = options.get('output_quality', '1080p')
        
        video = VideoFileClip(input_path)
        duration = video.duration
        
        segments = []
        segment_count = 0
        total_segments = max(1, int(duration / split_time))
        
        for start in range(0, int(duration), split_time):
            end = min(start + split_time, duration)
            if end - start >= split_time:
                actual_end = end - remove_time
            else:
                actual_end = end
            
            if start < actual_end:
                progress = int((segment_count / total_segments) * 100)
                active_jobs[job_id]['progress'] = progress
                
                segment = video.subclip(start, actual_end)
                
                # Apply effects
                if options.get('zoom_enabled') == 'on':
                    segment = zoom_effect(segment, 
                        float(options.get('zoom_factor', 1.5)),
                        options.get('zoom_type', 'in'))
                
                if options.get('freeze_enabled') == 'on':
                    segment = freeze_effect(segment,
                        float(options.get('freeze_duration', 1)))
                
                if options.get('mirror_enabled') == 'on':
                    segment = mirror_effect(segment,
                        options.get('mirror_type', 'horizontal'))
                
                if options.get('rotate_enabled') == 'on':
                    segment = rotate_effect(segment,
                        int(options.get('rotate_angle', 90)))
                
                if options.get('blur_enabled') == 'on':
                    segment = blur_effect(segment,
                        int(options.get('blur_radius', 5)))
                
                if options.get('glitch_enabled') == 'on':
                    segment = glitch_effect(segment,
                        float(options.get('glitch_intensity', 0.1)))
                
                if options.get('oldfilm_enabled') == 'on':
                    segment = old_film_effect(segment)
                
                if options.get('speed_enabled') == 'on':
                    segment = speed_effect(segment,
                        float(options.get('speed_factor', 1.5)),
                        options.get('speed_type', 'fast'))
                
                if options.get('text_enabled') == 'on' and options.get('text_content'):
                    segment = text_effect(segment,
                        options.get('text_content'),
                        options.get('text_font', ''),
                        int(options.get('text_size', 40)),
                        options.get('text_color', 'white'),
                        options.get('text_position', 'center'))
                
                if options.get('noise_reduction') == 'on':
                    segment = reduce_noise_effect(segment,
                        float(options.get('noise_strength', 0.5)))
                
                segments.append(segment)
                segment_count += 1
        
        active_jobs[job_id]['progress'] = 90
        
        if not segments:
            raise Exception("No segments created")
        
        # Apply transitions
        transition_type = options.get('transition_type', 'none')
        transition_duration = float(options.get('transition_duration', 1))
        
        if transition_type == 'none' or len(segments) == 1:
            final_video = concatenate_videoclips(segments, method="compose")
        else:
            final_segments = []
            for i, seg in enumerate(segments):
                if i == 0:
                    final_segments.append(seg)
                else:
                    if transition_type == 'fade':
                        trans = fade_transition(segments[i-1], seg, transition_duration)
                    elif transition_type == 'slide':
                        trans = slide_transition(segments[i-1], seg, transition_duration)
                    elif transition_type == 'zoom':
                        trans = zoom_transition(segments[i-1], seg, transition_duration)
                    else:
                        trans = seg
                    final_segments.append(trans)
            final_video = concatenate_videoclips(final_segments, method="compose")
        
        # Add audio
        if video.audio:
            final_video = final_video.set_audio(video.audio)
        
        # Add background music
        if options.get('music_enabled') == 'on' and options.get('music_path'):
            final_video = add_background_music(final_video,
                options.get('music_path'),
                float(options.get('music_volume', 0.5)))
        
        # Save video
        output_filename = f"{job_id}_edited.mp4"
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        
        params = get_output_parameters(output_quality)
        final_video.write_videofile(
            output_path,
            codec=params['codec'],
            bitrate=params['bitrate'],
            preset=params['preset'],
            audio_codec='aac',
            temp_audiofile='temp-audio.m4a',
            remove_temp=True,
            verbose=False,
            logger='bar'
        )
        
        video.close()
        final_video.close()
        for seg in segments:
            seg.close()
        
        active_jobs[job_id]['status'] = 'completed'
        active_jobs[job_id]['progress'] = 100
        active_jobs[job_id]['output_path'] = output_path
        
        # Save to database
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("INSERT INTO users (id, filename, status) VALUES (?, ?, ?)",
                 (job_id, os.path.basename(input_path), 'completed'))
        conn.commit()
        conn.close()
        
    except Exception as e:
        logger.error(f"Error: {e}")
        active_jobs[job_id]['status'] = 'error'
        active_jobs[job_id]['error'] = str(e)

# ==================== ROUTES ====================

@app.route('/')
def index():
    return render_template('index.html', user=current_user if current_user.is_authenticated else None)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        email = request.form.get('email', '')
        
        hashed = generate_password_hash(password)
        
        try:
            conn = sqlite3.connect('users.db')
            c = conn.cursor()
            c.execute("INSERT INTO users (username, password, email, created_at) VALUES (?, ?, ?, ?)",
                     (username, hashed, email, datetime.now()))
            conn.commit()
            conn.close()
            return jsonify({'message': 'User created'})
        except sqlite3.IntegrityError:
            return jsonify({'error': 'Username exists'}), 400
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = c.fetchone()
        conn.close()
        
        if user and check_password_hash(user[2], password):
            user_obj = User(user[0], user[1], user[3])
            login_user(user_obj)
            return jsonify({'message': 'Login success', 'redirect': '/'})
        
        return jsonify({'error': 'Invalid credentials'}), 400
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out'})

@app.route('/current_user')
def current_user_info():
    if current_user.is_authenticated:
        return jsonify({'authenticated': True, 'username': current_user.username})
    return jsonify({'authenticated': False})

@app.route('/upload', methods=['POST'])
@login_required
def upload():
    if 'video' not in request.files:
        return jsonify({'error': 'No file'}), 400
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    job_id = str(uuid.uuid4())
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_{filename}")
    file.save(filepath)
    
    options = {
        'split_time': request.form.get('split_time', '6'),
        'remove_time': request.form.get('remove_time', '1'),
        'output_quality': request.form.get('output_quality', '1080p'),
        'zoom_enabled': request.form.get('zoom_enabled', 'off'),
        'zoom_factor': request.form.get('zoom_factor', '1.5'),
        'zoom_type': request.form.get('zoom_type', 'in'),
        'freeze_enabled': request.form.get('freeze_enabled', 'off'),
        'freeze_duration': request.form.get('freeze_duration', '1'),
        'mirror_enabled': request.form.get('mirror_enabled', 'off'),
        'mirror_type': request.form.get('mirror_type', 'horizontal'),
        'rotate_enabled': request.form.get('rotate_enabled', 'off'),
        'rotate_angle': request.form.get('rotate_angle', '90'),
        'blur_enabled': request.form.get('blur_enabled', 'off'),
        'blur_radius': request.form.get('blur_radius', '5'),
        'glitch_enabled': request.form.get('glitch_enabled', 'off'),
        'glitch_intensity': request.form.get('glitch_intensity', '0.1'),
        'oldfilm_enabled': request.form.get('oldfilm_enabled', 'off'),
        'speed_enabled': request.form.get('speed_enabled', 'off'),
        'speed_factor': request.form.get('speed_factor', '1.5'),
        'speed_type': request.form.get('speed_type', 'fast'),
        'text_enabled': request.form.get('text_enabled', 'off'),
        'text_content': request.form.get('text_content', ''),
        'text_font': request.form.get('text_font', ''),
        'text_size': request.form.get('text_size', '40'),
        'text_color': request.form.get('text_color', 'white'),
        'text_position': request.form.get('text_position', 'center'),
        'transition_type': request.form.get('transition_type', 'none'),
        'transition_duration': request.form.get('transition_duration', '1'),
        'music_enabled': request.form.get('music_enabled', 'off'),
        'music_path': request.form.get('music_path', ''),
        'music_volume': request.form.get('music_volume', '0.5'),
        'noise_reduction': request.form.get('noise_reduction', 'off'),
        'noise_strength': request.form.get('noise_strength', '0.5')
    }
    
    active_jobs[job_id] = {
        'id': job_id,
        'user_id': current_user.id,
        'filename': filename,
        'status': 'queued',
        'progress': 0,
        'options': options,
        'input_path': filepath
    }
    
    thread = threading.Thread(target=process_video_task, args=(job_id, filepath, options, current_user.id))
    thread.daemon = True
    thread.start()
    
    return jsonify({'job_id': job_id})

@app.route('/status/<job_id>')
@login_required
def status(job_id):
    if job_id in active_jobs and active_jobs[job_id]['user_id'] == current_user.id:
        job = active_jobs[job_id]
        resp = {'status': job['status'], 'progress': job['progress']}
        if job['status'] == 'completed':
            resp['output_url'] = f"/download/{job_id}"
        elif job['status'] == 'error':
            resp['error'] = job.get('error')
        return jsonify(resp)
    return jsonify({'error': 'Not found'}), 404

@app.route('/download/<job_id>')
@login_required
def download(job_id):
    if job_id in active_jobs and active_jobs[job_id]['status'] == 'completed':
        return send_file(active_jobs[job_id]['output_path'], as_attachment=True)
    return jsonify({'error': 'Not ready'}), 404

@app.route('/jobs')
@login_required
def list_jobs():
    user_jobs = []
    for job_id, job in active_jobs.items():
        if job['user_id'] == current_user.id:
            user_jobs.append({
                'id': job_id,
                'filename': job['filename'],
                'status': job['status'],
                'progress': job['progress']
            })
    return jsonify(user_jobs)

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🎬 AI Video Editor Web App")
    print("="*60)
    print(f"📁 Upload folder: {app.config['UPLOAD_FOLDER']}")
    print(f"📁 Output folder: {app.config['OUTPUT_FOLDER']}")
    print(f"🌐 URL: http://localhost:5555")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5555, threaded=True)
