#!/usr/bin/env python3
"""
AI Video Editor Web App - Complete Version with Authentication, Effects, Dark Mode
Includes: Video Editor, Myanmar Transcript Generator, AI Voice Generator
"""

import os
import sys
import uuid
import logging
import threading
import time
import traceback
import sqlite3
import json
import subprocess
import tempfile
import subprocess
import re
from urllib.parse import urlparse
from datetime import datetime
from functools import wraps

from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import numpy as np

# For Transcript Generation
try:
    import whisper
    print("✅ Whisper imported successfully")
except ImportError as e:
    print(f"❌ Whisper import error: {e}")
    print("Please run: pip install openai-whisper")

# For Voice Generation
try:
    from gtts import gTTS
    print("✅ gTTS imported successfully")
except ImportError as e:
    print(f"❌ gTTS import error: {e}")
    print("Please run: pip install gtts")

# For Audio Processing
try:
    import speech_recognition as sr
    print("✅ Speech Recognition imported successfully")
except ImportError as e:
    print(f"❌ Speech Recognition import error: {e}")

# MoviePy imports
try:
    from moviepy.editor import VideoFileClip, CompositeVideoClip, ImageClip, TextClip
    from moviepy.editor import concatenate_videoclips, AudioFileClip, CompositeAudioClip
    from moviepy.video.fx.all import speedx, fadein, fadeout
    print("✅ MoviePy imported successfully")
except ImportError as e:
    print(f"❌ MoviePy import error: {e}")
    print("Please run: pip install moviepy")

# PIL for image processing
try:
    from PIL import Image, ImageFilter, ImageDraw, ImageFont
    print("✅ Pillow imported successfully")
except ImportError as e:
    print(f"❌ Pillow import error: {e}")
    print("Please run: pip install pillow")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['OUTPUT_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outputs')
app.config['AUDIO_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio')
app.config['TRANSCRIPT_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'transcripts')
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024  # 1GB max
app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'mp3', 'wav', 'm4a'}
app.config['SECRET_KEY'] = 'video-editor-secret-key-change-this-in-production'

# Create folders if not exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)
os.makedirs(app.config['AUDIO_FOLDER'], exist_ok=True)
os.makedirs(app.config['TRANSCRIPT_FOLDER'], exist_ok=True)

# Login Manager Setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Database setup
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                  username TEXT UNIQUE, 
                  password TEXT,
                  email TEXT,
                  created_at TIMESTAMP)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS jobs
                 (id TEXT PRIMARY KEY,
                  user_id INTEGER,
                  filename TEXT,
                  type TEXT,
                  status TEXT,
                  created_at TIMESTAMP,
                  output_path TEXT,
                  FOREIGN KEY (user_id) REFERENCES users (id))''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS transcripts
                 (id TEXT PRIMARY KEY,
                  user_id INTEGER,
                  filename TEXT,
                  content TEXT,
                  language TEXT,
                  created_at TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users (id))''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS voices
                 (id TEXT PRIMARY KEY,
                  user_id INTEGER,
                  text TEXT,
                  audio_path TEXT,
                  language TEXT,
                  created_at TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users (id))''')
    conn.commit()
    conn.close()

# Database setup
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                  username TEXT UNIQUE, 
                  password TEXT,
                  email TEXT,
                  created_at TIMESTAMP)''')
    
    # Jobs table (ဒီနေရာကိုပြင်ရမယ်)
    c.execute('''CREATE TABLE IF NOT EXISTS jobs
                 (id TEXT PRIMARY KEY,
                  user_id INTEGER,
                  filename TEXT,
                  type TEXT,
                  status TEXT,
                  created_at TIMESTAMP,
                  output_path TEXT,
                  FOREIGN KEY (user_id) REFERENCES users (id))''')
    
    # ဒီအောက်ကဟာတွေကိုထည့်ရမယ် (type column ရှိမရှိစစ်မယ်)
    try:
        c.execute("ALTER TABLE jobs ADD COLUMN type TEXT")
        print("✅ Added type column to jobs table")
    except:
        print("ℹ️ type column already exists")
    
    # Transcripts table
    c.execute('''CREATE TABLE IF NOT EXISTS transcripts
                 (id TEXT PRIMARY KEY,
                  user_id INTEGER,
                  filename TEXT,
                  content TEXT,
                  language TEXT,
                  created_at TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users (id))''')
    
    # Voices table
    c.execute('''CREATE TABLE IF NOT EXISTS voices
                 (id TEXT PRIMARY KEY,
                  user_id INTEGER,
                  text TEXT,
                  audio_path TEXT,
                  language TEXT,
                  created_at TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users (id))''')
    
    conn.commit()
    conn.close()


init_db()

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

# Store active jobs in memory
active_jobs = {}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# ==================== VIDEO EDITOR EFFECT FUNCTIONS ====================

def zoom_effect_timed(clip, zoom_factor=1.5, zoom_type='in', interval=7, zoom_duration=2):
    """Zoom In/Out Effect with timed intervals"""
    def make_frame(gf, t):
        cycle_time = t % interval
        
        if cycle_time < zoom_duration:
            progress = cycle_time / zoom_duration
            if zoom_type == 'in':
                current_zoom = 1.0 + (zoom_factor - 1.0) * progress
            else:
                current_zoom = 1.0 + (zoom_factor - 1.0) * (1 - progress)
        else:
            current_zoom = 1.0
        
        frame = gf(t)
        h, w = frame.shape[:2]
        
        if current_zoom > 1:
            new_h, new_w = int(h / current_zoom), int(w / current_zoom)
            y_start = (h - new_h) // 2
            x_start = (w - new_w) // 2
            cropped = frame[y_start:y_start+new_h, x_start:x_start+new_w]
            pil_img = Image.fromarray(cropped)
            zoomed = np.array(pil_img.resize((w, h), Image.Resampling.LANCZOS))
            return zoomed
        else:
            return frame
    
    return clip.fl(make_frame)

def freeze_effect_timed(clip, freeze_duration=1, interval=5):
    """Freeze effect with timed intervals"""
    def make_frame(gf, t):
        segment = int(t // interval)
        segment_end = (segment + 1) * interval
        freeze_start = segment_end - freeze_duration
        
        if t >= freeze_start and t < segment_end:
            return gf(freeze_start)
        else:
            return gf(t)
    
    return clip.fl(make_frame)

def zoom_effect(clip, zoom_factor=1.5, zoom_type='in'):
    """Original Zoom Effect"""
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
    """Original Freeze Effect"""
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
        
        txt_clip = ImageClip(make_text_frame(0), duration=clip.duration, ismask=False)
        return CompositeVideoClip([clip, txt_clip.set_position(('center', 'center'))])
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
            from scipy import signal
            
            def reduce_noise(get_audio, t):
                samples = get_audio(t)
                if samples is None or len(samples) == 0:
                    return samples
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
    """Background video processing task"""
    try:
        logger.info(f"🎬 Starting video edit job {job_id} for user {user_id}")
        active_jobs[job_id]['status'] = 'processing'
        active_jobs[job_id]['progress'] = 0
        active_jobs[job_id]['start_time'] = time.time()
        
        if not os.path.exists(input_path):
            raise Exception(f"Input file not found: {input_path}")
        
        split_time = int(options.get('split_time', 6))
        remove_time = float(options.get('remove_time', 1))
        output_quality = options.get('output_quality', '1080p')
        
        logger.info(f"Loading video: {input_path}")
        video = VideoFileClip(input_path)
        duration = video.duration
        
        logger.info(f"Video duration: {duration:.2f} seconds")
        active_jobs[job_id]['total_duration'] = duration
        
        segments = []
        segment_count = 0
        total_segments = max(1, int(duration / split_time))
        
        for start_time in range(0, int(duration), split_time):
            end_time = min(start_time + split_time, duration)
            
            if end_time - start_time >= split_time:
                actual_end = end_time - remove_time
            else:
                actual_end = end_time
            
            if start_time < actual_end:
                progress = int((segment_count / total_segments) * 100)
                active_jobs[job_id]['progress'] = progress
                
                logger.info(f"Segment {segment_count + 1}: {start_time:.1f}s - {actual_end:.1f}s")
                segment = video.subclip(start_time, actual_end)
                
                # Apply effects
                if options.get('zoom_enabled') == 'on':
                    if options.get('zoom_timed') == 'on':
                        zoom_interval = int(options.get('zoom_interval', 7))
                        zoom_duration = int(options.get('zoom_duration', 2))
                        segment = zoom_effect_timed(segment, 
                            float(options.get('zoom_factor', 1.5)),
                            options.get('zoom_type', 'in'),
                            zoom_interval,
                            zoom_duration)
                    else:
                        segment = zoom_effect(segment, 
                            float(options.get('zoom_factor', 1.5)),
                            options.get('zoom_type', 'in'))
                
                if options.get('freeze_enabled') == 'on':
                    if options.get('freeze_timed') == 'on':
                        freeze_interval = int(options.get('freeze_interval', 5))
                        freeze_duration = float(options.get('freeze_duration', 1))
                        segment = freeze_effect_timed(segment,
                            freeze_duration,
                            freeze_interval)
                    else:
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
                    segment = old_film_effect(segment,
                        float(options.get('scratch_intensity', 0.1)))
                
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
        logger.info(f"Created {segment_count} segments")
        
        if not segments:
            raise Exception("No segments created")
        
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
                        transition_clip = fade_transition(segments[i-1], seg, transition_duration)
                    elif transition_type == 'slide':
                        transition_clip = slide_transition(segments[i-1], seg, transition_duration)
                    elif transition_type == 'zoom':
                        transition_clip = zoom_transition(segments[i-1], seg, transition_duration)
                    else:
                        transition_clip = seg
                    final_segments.append(transition_clip)
            final_video = concatenate_videoclips(final_segments, method="compose")
        
        if video.audio:
            final_video = final_video.set_audio(video.audio)
        
        if options.get('music_enabled') == 'on' and options.get('music_path'):
            final_video = add_background_music(final_video,
                options.get('music_path'),
                float(options.get('music_volume', 0.5)))
        
        output_filename = f"{job_id}_edited.mp4"
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        
        logger.info(f"Saving to: {output_path}")
        
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
        for segment in segments:
            segment.close()
        
        processing_time = time.time() - active_jobs[job_id]['start_time']
        
        active_jobs[job_id]['status'] = 'completed'
        active_jobs[job_id]['progress'] = 100
        active_jobs[job_id]['output_file'] = output_filename
        active_jobs[job_id]['output_path'] = output_path
        
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("INSERT INTO jobs (id, user_id, filename, type, status, created_at, output_path) VALUES (?, ?, ?, ?, ?, ?, ?)",
                 (job_id, user_id, os.path.basename(input_path), 'video', 'completed', datetime.now(), output_path))
        conn.commit()
        conn.close()
        
        logger.info(f"Video job {job_id} completed in {processing_time:.1f} seconds")
        
    except Exception as e:
        logger.error(f"Error in video job {job_id}: {str(e)}")
        logger.error(traceback.format_exc())
        
        active_jobs[job_id]['status'] = 'error'
        active_jobs[job_id]['error'] = str(e)

# ==================== TRANSCRIPT GENERATION ====================

@app.route('/transcript', methods=['POST'])
@login_required
def generate_transcript():
    """Generate transcript from video/audio file"""
    try:
        logger.info(f"Transcript request from user {current_user.id}")
        
        if 'file' not in request.files and not request.form.get('url'):
            return jsonify({'error': 'No file or URL provided'}), 400
        
        job_id = str(uuid.uuid4())
        
        # Handle file upload
        if 'file' in request.files and request.files['file'].filename:
            file = request.files['file']
            if not allowed_file(file.filename):
                return jsonify({'error': 'Invalid file type'}), 400
            
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_{filename}")
            file.save(file_path)
            source_type = 'file'
            source_name = filename
        
        # Handle URL
        elif request.form.get('url'):
            url = request.form.get('url')
            # Download from URL (simplified - you might want to use yt-dlp for YouTube)
            import requests
            response = requests.get(url, stream=True)
            filename = f"{job_id}_from_url.mp4"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            source_type = 'url'
            source_name = url
        
        language = request.form.get('language', 'my')  # Default to Myanmar
        
        # Extract audio if video file
        audio_path = None
        if file_path.endswith(('.mp4', '.avi', '.mov', '.mkv')):
            logger.info(f"Extracting audio from video: {file_path}")
            video = VideoFileClip(file_path)
            audio_path = os.path.join(app.config['AUDIO_FOLDER'], f"{job_id}_audio.wav")
            video.audio.write_audiofile(audio_path, logger=None)
            video.close()
        else:
            audio_path = file_path
        
        # Generate transcript using Whisper
        logger.info(f"Generating transcript for: {audio_path}")
        
        # Load whisper model (you can choose different sizes: tiny, base, small, medium, large)
        model = whisper.load_model("base")
        
        # Transcribe
        result = model.transcribe(audio_path, language='my' if language == 'my' else None)
        transcript = result["text"]
        
        logger.info(f"Transcript generated: {len(transcript)} characters")
        
        # Save transcript to database
        transcript_id = str(uuid.uuid4())
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("INSERT INTO transcripts (id, user_id, filename, content, language, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                 (transcript_id, current_user.id, source_name, transcript, language, datetime.now()))
        conn.commit()
        conn.close()
        
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
        if audio_path and audio_path != file_path and os.path.exists(audio_path):
            os.remove(audio_path)
        
        return jsonify({
            'job_id': job_id,
            'transcript_id': transcript_id,
            'transcript': transcript,
            'language': language,
            'source': source_name
        })
        
    except Exception as e:
        logger.error(f"Transcript error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== AI VOICE GENERATOR ====================

@app.route('/voice', methods=['POST'])
@login_required
def generate_voice():
    """Generate AI voice from text"""
    try:
        logger.info(f"Voice generation request from user {current_user.id}")
        
        text = request.form.get('text', '')
        language = request.form.get('language', 'my')  # Default to Myanmar
        voice_type = request.form.get('voice_type', 'female')  # female, male
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        if len(text) > 5000:
            return jsonify({'error': 'Text too long (max 5000 characters)'}), 400
        
        job_id = str(uuid.uuid4())
        
        # Generate voice using gTTS
        logger.info(f"Generating voice for text: {text[:50]}...")
        
        # For Myanmar, use 'my' language code
        tts = gTTS(text=text, lang='my', slow=False)
        
        audio_filename = f"{job_id}_voice.mp3"
        audio_path = os.path.join(app.config['AUDIO_FOLDER'], audio_filename)
        tts.save(audio_path)
        
        logger.info(f"Voice saved to: {audio_path}")
        
        # Save to database
        voice_id = str(uuid.uuid4())
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("INSERT INTO voices (id, user_id, text, audio_path, language, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                 (voice_id, current_user.id, text[:100], audio_path, language, datetime.now()))
        conn.commit()
        conn.close()
        
        return jsonify({
            'job_id': job_id,
            'voice_id': voice_id,
            'audio_url': f"/audio/{os.path.basename(audio_path)}",
            'text': text[:100] + ('...' if len(text) > 100 else ''),
            'language': language
        })
        
    except Exception as e:
        logger.error(f"Voice generation error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/audio/<filename>')
@login_required
def get_audio(filename):
    """Get generated audio file"""
    audio_path = os.path.join(app.config['AUDIO_FOLDER'], filename)
    if os.path.exists(audio_path):
        return send_file(audio_path, mimetype='audio/mpeg')
    return jsonify({'error': 'Audio not found'}), 404

# ==================== TRANSCRIPT HISTORY ====================

@app.route('/transcripts')
@login_required
def list_transcripts():
    """List user's transcripts"""
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute("SELECT id, filename, content, language, created_at FROM transcripts WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
              (current_user.id,))
    transcripts = c.fetchall()
    conn.close()
    
    return jsonify([{
        'id': t[0],
        'filename': t[1],
        'content': t[2][:200] + ('...' if len(t[2]) > 200 else ''),
        'language': t[3],
        'created_at': t[4]
    } for t in transcripts])

@app.route('/transcript/<transcript_id>')
@login_required
def get_transcript(transcript_id):
    """Get full transcript"""
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute("SELECT content FROM transcripts WHERE id = ? AND user_id = ?",
              (transcript_id, current_user.id))
    transcript = c.fetchone()
    conn.close()
    
    if transcript:
        return jsonify({'content': transcript[0]})
    return jsonify({'error': 'Transcript not found'}), 404

# ==================== VOICE HISTORY ====================

@app.route('/voices')
@login_required
def list_voices():
    """List user's generated voices"""
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute("SELECT id, text, language, created_at FROM voices WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
              (current_user.id,))
    voices = c.fetchall()
    conn.close()
    
    return jsonify([{
        'id': v[0],
        'text': v[1],
        'language': v[2],
        'created_at': v[3]
    } for v in voices])

# ==================== CANCEL JOB ====================

@app.route('/cancel/<job_id>', methods=['POST'])
@login_required
def cancel_job(job_id):
    """Cancel a processing job"""
    if job_id in active_jobs and active_jobs[job_id]['user_id'] == current_user.id:
        job = active_jobs[job_id]
        
        if job['status'] in ['processing', 'queued']:
            job['status'] = 'cancelled'
            job['progress'] = 0
            job['error'] = 'Job cancelled by user'
            
            logger.info(f"Job {job_id} cancelled by user {current_user.id}")
            return jsonify({'success': True, 'message': 'Job cancelled'})
        else:
            return jsonify({'error': 'Job cannot be cancelled'}), 400
    
    return jsonify({'error': 'Job not found'}), 404

# ==================== VIDEO EDITOR ROUTES ====================

@app.route('/upload', methods=['POST'])
@login_required
def upload_file():
    """Upload video and start processing"""
    try:
        logger.info(f"Upload request from user {current_user.id}")
        
        if 'video' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['video']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        
        # Save file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_{safe_filename}")
        
        file.save(file_path)
        
        # Get options from form
        options = {
            'split_time': request.form.get('split_time', '6'),
            'remove_time': request.form.get('remove_time', '1'),
            'output_quality': request.form.get('output_quality', '1080p'),
            
            'zoom_enabled': request.form.get('zoom_enabled', 'off'),
            'zoom_timed': request.form.get('zoom_timed', 'off'),
            'zoom_factor': request.form.get('zoom_factor', '1.5'),
            'zoom_type': request.form.get('zoom_type', 'in'),
            'zoom_interval': request.form.get('zoom_interval', '7'),
            'zoom_duration': request.form.get('zoom_duration', '2'),
            
            'freeze_enabled': request.form.get('freeze_enabled', 'off'),
            'freeze_timed': request.form.get('freeze_timed', 'off'),
            'freeze_duration': request.form.get('freeze_duration', '1'),
            'freeze_interval': request.form.get('freeze_interval', '5'),
            
            'mirror_enabled': request.form.get('mirror_enabled', 'off'),
            'mirror_type': request.form.get('mirror_type', 'horizontal'),
            
            'rotate_enabled': request.form.get('rotate_enabled', 'off'),
            'rotate_angle': request.form.get('rotate_angle', '90'),
            
            'blur_enabled': request.form.get('blur_enabled', 'off'),
            'blur_radius': request.form.get('blur_radius', '5'),
            
            'glitch_enabled': request.form.get('glitch_enabled', 'off'),
            'glitch_intensity': request.form.get('glitch_intensity', '0.1'),
            
            'oldfilm_enabled': request.form.get('oldfilm_enabled', 'off'),
            'scratch_intensity': request.form.get('scratch_intensity', '0.1'),
            
            'speed_enabled': request.form.get('speed_enabled', 'off'),
            'speed_factor': request.form.get('speed_factor', '1.5'),
            'speed_type': request.form.get('speed_type', 'fast'),
            
            'text_enabled': request.form.get('text_enabled', 'off'),
            'text_content': request.form.get('text_content', ''),
            'text_font': request.form.get('text_font', '/System/Library/Fonts/Supplemental/MyanmarSangamMN.ttc'),
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
        
        # Initialize job
        active_jobs[job_id] = {
            'id': job_id,
            'user_id': current_user.id,
            'filename': filename,
            'status': 'queued',
            'progress': 0,
            'options': options,
            'input_path': file_path,
            'created_at': time.time()
        }
        
        # Start processing thread
        thread = threading.Thread(
            target=process_video_task,
            args=(job_id, file_path, options, current_user.id),
            daemon=True
        )
        thread.start()
        
        logger.info(f"Job {job_id} queued for user {current_user.id}")
        
        return jsonify({
            'job_id': job_id,
            'message': 'Video uploaded successfully'
        })
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/status/<job_id>')
@login_required
def get_status(job_id):
    """Get job status"""
    if job_id in active_jobs and active_jobs[job_id]['user_id'] == current_user.id:
        job = active_jobs[job_id]
        response = {
            'status': job['status'],
            'progress': job['progress'],
            'filename': job['filename']
        }
        
        if job['status'] == 'completed':
            response['output_url'] = f"/download/{job_id}"
        elif job['status'] == 'error':
            response['error'] = job.get('error', 'Unknown error')
        
        return jsonify(response)
    
    return jsonify({'error': 'Job not found'}), 404

@app.route('/download/<job_id>')
@login_required
def download_file(job_id):
    """Download processed video"""
    if job_id in active_jobs and active_jobs[job_id]['user_id'] == current_user.id:
        job = active_jobs[job_id]
        if job['status'] == 'completed' and os.path.exists(job['output_path']):
            return send_file(
                job['output_path'],
                as_attachment=True,
                download_name=f"edited_{job['filename']}",
                mimetype='video/mp4'
            )
    
    return jsonify({'error': 'File not ready'}), 404

@app.route('/jobs')
@login_required
def list_jobs():
    """List user's jobs"""
    user_jobs = []
    for job_id, job in active_jobs.items():
        if job['user_id'] == current_user.id:
            user_jobs.append({
                'id': job_id,
                'filename': job['filename'],
                'status': job['status'],
                'progress': job['progress'],
                'created_at': datetime.fromtimestamp(job['created_at']).strftime('%H:%M:%S')
            })
    return jsonify(user_jobs)

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html', user=current_user if current_user.is_authenticated else None)

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        email = request.form.get('email', '')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        hashed_password = generate_password_hash(password)
        
        try:
            conn = sqlite3.connect('users.db')
            c = conn.cursor()
            c.execute("INSERT INTO users (username, password, email, created_at) VALUES (?, ?, ?, ?)",
                     (username, hashed_password, email, datetime.now()))
            conn.commit()
            conn.close()
            return jsonify({'message': 'User created successfully'})
        except sqlite3.IntegrityError:
            return jsonify({'error': 'Username already exists'}), 400
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
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
            return jsonify({'message': 'Login successful', 'redirect': '/'})
        
        return jsonify({'error': 'Invalid username or password'}), 400
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    """User logout"""
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/current_user')
def current_user_info():
    """Get current user info"""
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'username': current_user.username,
            'email': current_user.email
        })
    return jsonify({'authenticated': False})

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'moviepy_loaded': 'moviepy' in sys.modules,
        'pillow_loaded': 'PIL' in sys.modules,
        'whisper_loaded': 'whisper' in sys.modules,
        'gtts_loaded': 'gtts' in sys.modules
    })

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 1GB'}), 413
# Voice Clone functions ထည့်မယ် (app.py ရဲ့ အောက်ဆုံးမှာ ထည့်ပါ)

# ==================== VOICE CLONE FEATURE ====================

try:
    from TTS.api import TTS
    print("✅ TTS imported successfully for voice cloning")
except ImportError as e:
    print(f"❌ TTS import error: {e}")
    print("Please install TTS: pip install TTS")

@app.route('/voice-clone', methods=['POST'])
@login_required
def clone_voice():
    """Clone voice from audio sample"""
    try:
        logger.info(f"Voice clone request from user {current_user.id}")
        
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        text = request.form.get('text', '')
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        audio_file = request.files['audio']
        if not allowed_file(audio_file.filename):
            return jsonify({'error': 'Invalid audio file type'}), 400
        
        job_id = str(uuid.uuid4())
        
        # Save uploaded audio sample
        sample_filename = f"{job_id}_sample.wav"
        sample_path = os.path.join(app.config['AUDIO_FOLDER'], sample_filename)
        audio_file.save(sample_path)
        
        # Initialize TTS with voice cloning
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
        
        # Generate cloned voice
        output_filename = f"{job_id}_cloned.wav"
        output_path = os.path.join(app.config['AUDIO_FOLDER'], output_filename)
        
        tts.tts_to_file(
            text=text,
            speaker_wav=sample_path,
            language="my",  # Myanmar language
            file_path=output_path
        )
        
        # Save to database
        voice_id = str(uuid.uuid4())
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("""INSERT INTO voices 
                     (id, user_id, text, audio_path, language, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?)""",
                 (voice_id, current_user.id, text[:100], output_path, 'my-clone', datetime.now()))
        conn.commit()
        conn.close()
        
        # Cleanup sample file
        os.remove(sample_path)
        
        return jsonify({
            'job_id': job_id,
            'voice_id': voice_id,
            'audio_url': f"/audio/{output_filename}",
            'text': text[:100] + ('...' if len(text) > 100 else '')
        })
        
    except Exception as e:
        logger.error(f"Voice clone error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/clone-status/<job_id>')
@login_required
def clone_status(job_id):
    """Check voice clone status"""
    # Simple implementation - can be expanded
    return jsonify({'status': 'completed'})


# ==================== YOUTUBE/TIKTOK DOWNLOADER ====================

import subprocess
import re
from urllib.parse import urlparse

def validate_url(url):
    """Check if URL is valid and supported"""
    supported_domains = [
        'youtube.com', 'youtu.be', 
        'facebook.com', 'fb.watch', 
        'tiktok.com', 'vm.tiktok.com',
        'instagram.com', 'twitter.com', 'x.com',
        'vimeo.com', 'dailymotion.com'
    ]
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        # Remove www.
        domain = domain.replace('www.', '')
        return any(supported in domain for supported in supported_domains)
    except:
        return False


@app.route('/download-url', methods=['POST'])
@login_required
def download_from_url():
    """Download video from URL (YouTube, Facebook, TikTok)"""
    try:
        logger.info(f"Download request from user {current_user.id}")
        
        url = request.form.get('url', '')
        quality = request.form.get('quality', '720p')
        file_type = request.form.get('file_type', 'mp4')  # mp4 or mp3
        
        if not url:
            return jsonify({'error': 'No URL provided'}), 400
        
        # Validate URL
        if not validate_url(url):
            return jsonify({'error': 'Unsupported URL. Please use YouTube, Facebook, or TikTok URLs'}), 400
        
        job_id = str(uuid.uuid4())
        
        # Output path ကို အရင်သတ်မှတ်မယ်
        if file_type == 'mp3':
            output_filename = f"{job_id}.mp3"
            output_path = os.path.join(app.config['AUDIO_FOLDER'], output_filename)
        else:
            output_filename = f"{job_id}.mp4"
            output_path = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
        
        # Build yt-dlp command with proper format specifications
        cmd = [
            'yt-dlp',
            '--no-playlist',
            '--no-warnings',
            '--progress',
            '--newline',
        ]
        
        if file_type == 'mp3':
            # Audio only - force MP3
            cmd.extend([
                '-f', 'bestaudio/best',
                '-x',  # Extract audio
                '--audio-format', 'mp3',
                '--audio-quality', '0',  # Best quality
                '--postprocessor-args', '-acodec mp3',
                '-o', output_path  # Direct output path with .mp3 extension
            ])
        else:
            # Video with audio - force MP4
            if quality == '1080p':
                format_spec = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best'
            elif quality == '720p':
                format_spec = 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best'
            elif quality == '480p':
                format_spec = 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best'
            else:
                format_spec = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
            
            cmd.extend([
                '-f', format_spec,
                '--merge-output-format', 'mp4',
                '-o', output_path  # Direct output path with .mp4 extension
            ])
        
        cmd.append(url)
        
        logger.info(f"Running command: {' '.join(cmd)}")
        
        # Initialize job status
        active_jobs[job_id] = {
            'id': job_id,
            'user_id': current_user.id,
            'filename': f"Download from {url[:30]}...",
            'status': 'processing',
            'progress': 0,
            'type': 'download',
            'created_at': time.time(),
            'output_path': output_path,
            'file_type': file_type
        }
        
        # Run download in background thread
        thread = threading.Thread(
            target=run_download_task_v2,
            args=(job_id, cmd, output_path, file_type, current_user.id, url),
            daemon=True
        )
        thread.start()
        
        return jsonify({
            'job_id': job_id,
            'message': 'Download started'
        })
        
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def run_download_task_v2(job_id, cmd, output_path, file_type, user_id, url):
    """Run yt-dlp in background"""
    try:
        # Run yt-dlp
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            # Check if file exists
            if os.path.exists(output_path):
                final_path = output_path
            else:
                # Look for any file with job_id
                files = os.listdir('.')
                downloaded_file = None
                for f in files:
                    if job_id in f:
                        downloaded_file = f
                        break
                
                if downloaded_file:
                    # Rename to correct format
                    if file_type == 'mp3':
                        final_path = os.path.join(app.config['AUDIO_FOLDER'], f"{job_id}.mp3")
                    else:
                        final_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}.mp4")
                    
                    os.rename(downloaded_file, final_path)
                else:
                    raise Exception("Downloaded file not found")
            
            # Save to database
            conn = sqlite3.connect('users.db')
            c = conn.cursor()
            c.execute("""INSERT INTO jobs 
                       (id, user_id, filename, type, status, created_at, output_path) 
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                     (job_id, user_id, os.path.basename(url), 'download', 'completed', datetime.now(), final_path))
            conn.commit()
            conn.close()
            
            active_jobs[job_id]['status'] = 'completed'
            active_jobs[job_id]['progress'] = 100
            active_jobs[job_id]['output_file'] = os.path.basename(final_path)
            
        else:
            error_msg = result.stderr
            raise Exception(f"yt-dlp error: {error_msg}")
            
    except Exception as e:
        logger.error(f"Download task error: {str(e)}")
        if job_id in active_jobs:
            active_jobs[job_id]['status'] = 'error'
            active_jobs[job_id]['error'] = str(e)


@app.route('/download-file/<job_id>')
@login_required
def download_file_by_id(job_id):
    """Download downloaded file"""
    if job_id in active_jobs and active_jobs[job_id]['user_id'] == current_user.id:
        job = active_jobs[job_id]
        if job['status'] == 'completed' and os.path.exists(job['output_path']):
            return send_file(
                job['output_path'],
                as_attachment=True,
                download_name=f"downloaded_{os.path.basename(job['output_path'])}"
            )
    return jsonify({'error': 'File not ready'}), 404

@app.route('/url-info', methods=['POST'])
@login_required
def get_url_info():
    """Get video info from URL"""
    try:
        url = request.form.get('url', '')
        if not url:
            return jsonify({'error': 'No URL'}), 400
        
        # Get video info using yt-dlp
        cmd = ['yt-dlp', '--dump-json', '--no-playlist', url]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            import json as jsonlib
            info = jsonlib.loads(result.stdout)
            return jsonify({
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'uploader': info.get('uploader', 'Unknown'),
                'thumbnail': info.get('thumbnail', '')
            })
        else:
            return jsonify({'error': 'Could not get video info'}), 400
            
    except Exception as e:
        logger.error(f"URL info error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ==================== VIDEO PREVIEW ====================

@app.route('/preview/<job_id>')
@login_required
def get_preview(job_id):
    """Get video preview"""
    if job_id in active_jobs and active_jobs[job_id]['user_id'] == current_user.id:
        job = active_jobs[job_id]
        if 'input_path' in job and os.path.exists(job['input_path']):
            return send_file(
                job['input_path'],
                mimetype='video/mp4'
            )
    return jsonify({'error': 'Preview not available'}), 404

@app.route('/preview-upload', methods=['POST'])
@login_required
def preview_upload():
    """Upload video for preview only (no processing)"""
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['video']
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Generate preview ID
        preview_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        
        # Save file temporarily
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"preview_{preview_id}_{filename}")
        file.save(temp_path)
        
        # Store in active_jobs for preview
        active_jobs[preview_id] = {
            'id': preview_id,
            'user_id': current_user.id,
            'filename': filename,
            'input_path': temp_path,
            'status': 'preview',
            'created_at': time.time()
        }
        
        return jsonify({
            'preview_id': preview_id,
            'message': 'Preview ready',
            'filename': filename
        })
        
    except Exception as e:
        logger.error(f"Preview upload error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== VOICE CLONE PANEL ====================

@app.route('/voice-clone-panel', methods=['POST'])
@login_required
def voice_clone_panel():
    """Voice clone from panel"""
    try:
        logger.info(f"Voice clone panel request from user {current_user.id}")
        
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        text = request.form.get('text', '')
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        audio_file = request.files['audio']
        
        job_id = str(uuid.uuid4())
        
        # Save uploaded audio sample
        sample_filename = f"{job_id}_sample.wav"
        sample_path = os.path.join(app.config['AUDIO_FOLDER'], sample_filename)
        audio_file.save(sample_path)
        
        try:
            # Initialize TTS with voice cloning
            tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
            
            # Generate cloned voice
            output_filename = f"{job_id}_cloned.wav"
            output_path = os.path.join(app.config['AUDIO_FOLDER'], output_filename)
            
            tts.tts_to_file(
                text=text,
                speaker_wav=sample_path,
                language="my",
                file_path=output_path
            )
            
            # Save to database
            voice_id = str(uuid.uuid4())
            conn = sqlite3.connect('users.db')
            c = conn.cursor()
            c.execute("""INSERT INTO voices 
                         (id, user_id, text, audio_path, language, created_at) 
                         VALUES (?, ?, ?, ?, ?, ?)""",
                     (voice_id, current_user.id, text[:100], output_path, 'my-clone', datetime.now()))
            conn.commit()
            conn.close()
            
            # Cleanup sample file
            if os.path.exists(sample_path):
                os.remove(sample_path)
            
            return jsonify({
                'job_id': job_id,
                'voice_id': voice_id,
                'audio_url': f"/audio/{output_filename}",
                'text': text[:100] + ('...' if len(text) > 100 else '')
            })
            
        except Exception as e:
            # Cleanup on error
            if os.path.exists(sample_path):
                os.remove(sample_path)
            raise e
        
    except Exception as e:
        logger.error(f"Voice clone panel error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== FILE CLEANUP ====================

def cleanup_old_files():
    """Clean up old preview and temporary files"""
    try:
        current_time = time.time()
        # Remove preview files older than 1 hour
        for job_id, job in list(active_jobs.items()):
            if job.get('status') == 'preview':
                if current_time - job['created_at'] > 3600:  # 1 hour
                    if 'input_path' in job and os.path.exists(job['input_path']):
                        os.remove(job['input_path'])
                    del active_jobs[job_id]
                    logger.info(f"Cleaned up preview job {job_id}")
    except Exception as e:
        logger.error(f"Cleanup error: {e}")

# Run cleanup every hour
def start_cleanup_scheduler():
    def run_cleanup():
        while True:
            time.sleep(3600)  # 1 hour
            cleanup_old_files()
    
    thread = threading.Thread(target=run_cleanup, daemon=True)
    thread.start()

# Start cleanup scheduler when app starts
start_cleanup_scheduler()

# ==================== VOICE CLONE WITH ERROR HANDLING ====================

@app.route('/voice-clone-status/<job_id>')
@login_required
def voice_clone_status(job_id):
    """Check voice clone status"""
    if job_id in active_jobs and active_jobs[job_id]['user_id'] == current_user.id:
        job = active_jobs[job_id]
        return jsonify({
            'status': job.get('status', 'unknown'),
            'progress': job.get('progress', 0),
            'error': job.get('error', '')
        })
    return jsonify({'error': 'Job not found'}), 404



if __name__ == '__main__':
    print("\n" + "="*70)
    print("🎬 AI Video Editor Web App - Complete Edition")
    print("="*70)
    print(f"📁 Upload folder: {app.config['UPLOAD_FOLDER']}")
    print(f"📁 Output folder: {app.config['OUTPUT_FOLDER']}")
    print(f"📁 Audio folder: {app.config['AUDIO_FOLDER']}")
    print(f"📁 Transcript folder: {app.config['TRANSCRIPT_FOLDER']}")
    print(f"🌐 URL: http://localhost:5555")
    print("="*70 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5555, threaded=True)
