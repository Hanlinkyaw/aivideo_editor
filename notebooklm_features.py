#!/usr/bin/env python3
"""
NotebookLM-style Features for AI Video Editor
Uses Gemini 1.5 Pro for multimodal audio processing and TTS for voice generation
"""

import os
import uuid
import time
import subprocess
import logging
from pathlib import Path

import google.generativeai as genai
from google.cloud import texttospeech

# Configure logging
logger = logging.getLogger(__name__)

class NotebookLMProcessor:
    """NotebookLM-style audio processor using Gemini 1.5 Pro"""
    
    def __init__(self, gemini_api_key, tts_client=None):
        """Initialize the processor with API keys"""
        self.gemini_api_key = gemini_api_key
        self.tts_client = tts_client
        
        # Configure Gemini
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-1.5-pro')
        
        # System instruction for NotebookLM-style processing
        self.system_instruction = """
        You are a friendly Burmese educator. Listen to this audio and explain it in natural, spoken Burmese language as if you are talking to a friend. Do not use formal book language. Make it engaging, like a podcast summary (NotebookLM style).
        
        Guidelines:
        - Use natural, conversational Burmese (ဟုတ်ကဲ့, ဒါကြောင့်, နောက်တစ်ခုကတော့, etc.)
        - Sound warm and friendly, like talking to a friend
        - Explain concepts simply and engagingly
        - Add natural transitions and personal touches
        - Make it feel like a real person explaining
        - Keep it comprehensive but easy to understand
        - Use Myanmar Unicode properly
        """
    
    def extract_audio_from_youtube(self, url, output_path):
        """Extract audio from YouTube URL using yt-dlp"""
        try:
            # Create output directory if it doesn't exist
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Build yt-dlp command for audio extraction
            cmd = [
                'yt-dlp',
                '--no-playlist',
                '--no-warnings',
                '--extract-audio',
                '--audio-format', 'mp3',
                '--audio-quality', '0',
                '-o', output_path.replace('.mp3', '.%(ext)s'),
                url
            ]
            
            logger.info(f"Extracting audio from: {url}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                raise Exception(f"YouTube download failed: {result.stderr}")
            
            # Find the downloaded audio file
            audio_file = None
            for ext in ['.mp3', '.m4a', '.wav']:
                potential_file = output_path.replace('.mp3', ext)
                if os.path.exists(potential_file):
                    audio_file = potential_file
                    break
            
            if not audio_file:
                raise Exception("Downloaded audio file not found")
            
            logger.info(f"Audio extracted successfully: {audio_file}")
            return audio_file
            
        except subprocess.TimeoutExpired:
            raise Exception("YouTube download timed out")
        except Exception as e:
            logger.error(f"Audio extraction error: {str(e)}")
            raise
    
    def process_audio_with_gemini(self, audio_file_path):
        """Process audio with Gemini 1.5 Pro using multimodal input"""
        try:
            logger.info(f"Processing audio with Gemini: {audio_file_path}")
            
            # Upload the audio file to Gemini
            audio_file = genai.upload_file(audio_file_path)
            
            # Wait for the file to be processed
            import time
            while audio_file.state.name == "PROCESSING":
                time.sleep(2)
                audio_file = genai.get_file(audio_file.name)
            
            if audio_file.state.name == "FAILED":
                raise Exception("Audio file processing failed")
            
            # Generate content with system instruction
            response = self.model.generate_content([
                self.system_instruction,
                audio_file
            ])
            
            # Extract the explainer text
            explainer_text = response.text
            logger.info("Gemini processing completed successfully")
            
            return explainer_text.strip()
            
        except Exception as e:
            logger.error(f"Gemini processing error: {str(e)}")
            raise
    
    def generate_burmese_tts(self, text, output_path):
        """Generate Burmese TTS audio from explainer text"""
        try:
            if not self.tts_client:
                raise Exception("TTS client not initialized")
            
            logger.info(f"Generating TTS audio: {output_path}")
            
            # Create output directory if needed
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Synthesis input for Burmese
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Build voice request for natural Burmese voice
            voice = texttospeech.VoiceSelectionParams(
                language_code="my-MM",  # Burmese (Myanmar)
                name="my-MM-Standard-A",  # Natural-sounding Burmese voice
                ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
            )
            
            # Select type of audio file
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=0.95,  # Natural speaking rate
                pitch=0.0
            )
            
            # Perform the text-to-speech request
            response = self.tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            # Save the audio file
            with open(output_path, "wb") as out:
                out.write(response.audio_content)
            
            logger.info(f"TTS audio saved successfully: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"TTS generation error: {str(e)}")
            raise
    
    def process_youtube_url(self, url, job_id=None):
        """Complete NotebookLM workflow for YouTube URL"""
        try:
            # Generate paths
            base_path = Path("uploads")
            audio_path = base_path / f"{job_id or uuid.uuid4()}_audio.mp3"
            tts_path = Path("audio") / f"{job_id or uuid.uuid4()}_notebooklm_voice.mp3"
            
            # Step 1: Extract audio from YouTube
            logger.info("Step 1: Extracting audio from YouTube...")
            audio_file = self.extract_audio_from_youtube(url, str(audio_path))
            
            # Step 2: Process with Gemini for explainer text
            logger.info("Step 2: Processing with Gemini...")
            explainer_text = self.process_audio_with_gemini(audio_file)
            
            # Step 3: Generate TTS audio
            logger.info("Step 3: Generating TTS audio...")
            self.generate_burmese_tts(explainer_text, str(tts_path))
            
            # Return results
            return {
                'explainer_text': explainer_text,
                'audio_file': str(tts_path),
                'original_audio': str(audio_file),
                'success': True
            }
            
        except Exception as e:
            logger.error(f"NotebookLM processing error: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }


def create_notebooklm_endpoints(app, active_jobs):
    """Create Flask endpoints for NotebookLM features"""
    
    # Initialize the processor (will be done with API keys)
    processor = None
    
    def get_processor():
        nonlocal processor
        if processor is None:
            gemini_key = os.getenv('GOOGLE_GEMINI_API_KEY')
            if not gemini_key:
                raise Exception("Gemini API key not configured")
            
            # Initialize TTS client
            tts_client = None
            try:
                from google.cloud import texttospeech
                tts_client = texttospeech.TextToSpeechClient()
            except Exception as e:
                logger.warning(f"TTS client initialization failed: {e}")
            
            processor = NotebookLMProcessor(gemini_key, tts_client)
        
        return processor
    
    @app.route('/notebooklm-process', methods=['POST'])
    def notebooklm_process():
        """Process YouTube URL with NotebookLM workflow"""
        try:
            from flask_login import current_user
            
            url = request.form.get('url', '')
            if not url:
                return jsonify({'error': 'YouTube URL required'}), 400
            
            # Create job ID
            job_id = str(uuid.uuid4())
            
            # Initialize job
            active_jobs[job_id] = {
                'id': job_id,
                'user_id': current_user.id,
                'url': url,
                'status': 'processing',
                'progress': 0,
                'type': 'notebooklm',
                'created_at': time.time()
            }
            
            # Start processing in background
            import threading
            thread = threading.Thread(
                target=run_notebooklm_task,
                args=(job_id, url),
                daemon=True
            )
            thread.start()
            
            return jsonify({
                'job_id': job_id,
                'message': 'NotebookLM processing started'
            })
            
        except Exception as e:
            logger.error(f"NotebookLM request error: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    def run_notebooklm_task(job_id, url):
        """Run NotebookLM processing task in background"""
        try:
            # Update progress
            active_jobs[job_id]['progress'] = 5
            active_jobs[job_id]['status'] = 'Extracting audio from YouTube...'
            
            # Get processor and process
            processor_instance = get_processor()
            result = processor_instance.process_youtube_url(url, job_id)
            
            if result['success']:
                # Update job with results
                active_jobs[job_id].update({
                    'status': 'completed',
                    'progress': 100,
                    'explainer_text': result['explainer_text'],
                    'audio_url': f"/notebooklm-audio/{job_id}",
                    'completed_at': time.time()
                })
            else:
                active_jobs[job_id].update({
                    'status': 'error',
                    'error': result['error']
                })
                
        except Exception as e:
            logger.error(f"NotebookLM task error: {str(e)}")
            if job_id in active_jobs:
                active_jobs[job_id]['status'] = 'error'
                active_jobs[job_id]['error'] = str(e)
    
    @app.route('/notebooklm-status/<job_id>')
    def notebooklm_status(job_id):
        """Get NotebookLM processing status"""
        try:
            from flask_login import current_user
            
            if job_id in active_jobs and active_jobs[job_id]['user_id'] == current_user.id:
                job = active_jobs[job_id]
                
                if job['status'] == 'completed':
                    return jsonify({
                        'status': 'completed',
                        'explainer_text': job['explainer_text'],
                        'audio_url': job['audio_url']
                    })
                else:
                    return jsonify({
                        'status': job['status'],
                        'progress': job['progress'],
                        'message': job.get('status', 'Processing...')
                    })
            
            return jsonify({'error': 'Job not found'}), 404
            
        except Exception as e:
            logger.error(f"NotebookLM status error: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/notebooklm-audio/<job_id>')
    def notebooklm_audio(job_id):
        """Stream NotebookLM-generated audio"""
        try:
            from flask_login import current_user
            
            if job_id in active_jobs and active_jobs[job_id]['user_id'] == current_user.id:
                job = active_jobs[job_id]
                if job['status'] == 'completed':
                    audio_path = os.path.join('audio', f"{job_id}_notebooklm_voice.mp3")
                    if os.path.exists(audio_path):
                        from flask import send_file
                        return send_file(
                            audio_path,
                            mimetype='audio/mpeg',
                            as_attachment=False
                        )
            return jsonify({'error': 'Audio file not found'}), 404
            
        except Exception as e:
            logger.error(f"NotebookLM audio error: {str(e)}")
            return jsonify({'error': str(e)}), 500
