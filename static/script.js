// ========================================
// AI Video Editor - Complete JavaScript
// Includes: Video Editor, Transcript Generator, AI Voice Generator
// ========================================

// Global variables
let currentJobId = null;
let statusInterval = null;
let currentTranscriptId = null;
let currentVoiceId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded - Initializing...');
    

// Check saved dark mode preference
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    const toggle = document.getElementById('themeToggle');
    if (toggle) toggle.textContent = '☀️';
}
    // Get elements
    const uploadArea = document.getElementById('uploadArea');
    const videoInput = document.getElementById('videoInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const processBtn = document.getElementById('processBtn');
    
    // Transcript elements
    const transcriptUploadArea = document.getElementById('transcriptUploadArea');
    const transcriptFileInput = document.getElementById('transcriptFileInput');
    const transcriptFileInfo = document.getElementById('transcriptFileInfo');
    const transcriptFileName = document.getElementById('transcriptFileName');
    const transcriptFileSize = document.getElementById('transcriptFileSize');
    const transcriptUrl = document.getElementById('transcriptUrl');
    const generateTranscriptBtn = document.getElementById('generateTranscriptBtn');
    
    // Voice elements
    const voiceText = document.getElementById('voiceText');
    const generateVoiceBtn = document.getElementById('generateVoiceBtn');
    const textCount = document.getElementById('textCount');
    

    // ========== VOICE CLONE ==========

    // Clone upload area handlers
    const cloneUploadArea = document.getElementById('cloneUploadArea');
    const cloneAudioInput = document.getElementById('cloneAudioInput');
    const cloneFileInfo = document.getElementById('cloneFileInfo');
    const cloneFileName = document.getElementById('cloneFileName');
    const cloneVoiceBtn = document.getElementById('cloneVoiceBtn');

	// ==========Voice Clone===========	    
	    if (cloneUploadArea) {
	    cloneUploadArea.addEventListener('click', () => {
	        cloneAudioInput.click();
	    });
	    
	    cloneUploadArea.addEventListener('dragover', (e) => {
	        e.preventDefault();
	        cloneUploadArea.classList.add('dragover');
	    });
	    
	    cloneUploadArea.addEventListener('dragleave', () => {
	        cloneUploadArea.classList.remove('dragover');
	    });
	    
	    cloneUploadArea.addEventListener('drop', (e) => {
	        e.preventDefault();
	        cloneUploadArea.classList.remove('dragover');
	        const files = e.dataTransfer.files;
	        if (files.length > 0) {
	            cloneAudioInput.files = files;
	            handleCloneFileSelect(files[0]);
	        }
	    });
	}
	
	if (cloneAudioInput) {
	    cloneAudioInput.addEventListener('change', (e) => {
	        if (e.target.files.length > 0) {
	            handleCloneFileSelect(e.target.files[0]);
	        }
	    });
	}
	
	function handleCloneFileSelect(file) {
	    if (file.type.startsWith('audio/')) {
	        cloneFileInfo.classList.remove('hidden');
	        cloneFileName.textContent = file.name;
	        console.log('Clone audio selected:', file.name);
	    } else {
	        alert('Please select an audio file');
	    }
	}
	
	if (cloneVoiceBtn) {
	    cloneVoiceBtn.addEventListener('click', cloneVoice);
	}
	
	async function cloneVoice() {
	    const audioFile = cloneAudioInput.files[0];
	    const text = document.getElementById('cloneText').value;
	    
	    if (!audioFile) {
	        alert('Please upload a voice sample');
	        return;
	    }
	    
	    if (!text) {
	        alert('Please enter text to convert');
	        return;
	    }
	    
	    showProgressModal('Cloning Voice...');
	    
	    const formData = new FormData();
	    formData.append('audio', audioFile);
	    formData.append('text', text);
	    
	    try {
	        const response = await fetch('/voice-clone', {
	            method: 'POST',
	            body: formData
	        });
	        
	        const data = await response.json();
	        
	        if (response.ok) {
	            hideProgressModal();
	            
	            // Show result
	            const voiceResult = document.getElementById('voiceResult');
	            const voiceAudio = document.getElementById('voiceAudio');
	            
	            voiceResult.classList.remove('hidden');
	            voiceAudio.src = data.audio_url;
	            voiceAudio.load();
	            
	            alert('Voice cloned successfully!');
	        } else {
	            hideProgressModal();
	            alert('Error: ' + data.error);
	        }
	    } catch (error) {
	        console.error('Clone error:', error);
	        hideProgressModal();
	        alert('Voice clone failed: ' + error.message);
	    }
	}
    // Check if elements exist
    if (!uploadArea || !videoInput) {
        console.error('Required elements not found!');
        return;
    }
    
   // ==========NEW FEATURE SELECTION ==========
window.showFeature = function(feature) {
    // Update buttons
    document.querySelectorAll('.feature-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Map feature names to button IDs
    const buttonMap = {
        'editor': 'btnEditor',
        'downloader': 'btnDownloader',
        'transcript': 'btnTranscript',
        'voice': 'btnVoice'
    };
    
    const btnId = buttonMap[feature];
    if (btnId) {
        document.getElementById(btnId).classList.add('active');
    }
    
    // Show selected panel
    document.getElementById('editorPanel').classList.add('hidden');
    document.getElementById('downloaderPanel').classList.add('hidden');
    document.getElementById('transcriptPanel').classList.add('hidden');
    document.getElementById('voicePanel').classList.add('hidden');
    
    document.getElementById(`${feature}Panel`).classList.remove('hidden');
};
 
    // ========== VIDEO EDITOR UPLOAD ==========
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        console.log('Upload area clicked');
        videoInput.click();
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            console.log('File dropped:', files[0].name);
            videoInput.files = files;
            handleFileSelect(files[0]);
        }
    });
    
    // File input change
    videoInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            console.log('File selected:', e.target.files[0].name);
            handleFileSelect(e.target.files[0]);
        }
    });
    
    // Handle file selection
    function handleFileSelect(file) {
        if (file.type.startsWith('video/')) {
            if (fileInfo) fileInfo.classList.remove('hidden');
            if (fileName) fileName.textContent = file.name;
            if (fileSize) fileSize.textContent = formatFileSize(file.size);
            if (processBtn) processBtn.disabled = false;
            console.log('File accepted:', file.name);
        } else {
            alert('Please select a video file');
            console.log('File rejected:', file.type);
        }
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
    
    // ========== TRANSCRIPT UPLOAD ==========
    
    if (transcriptUploadArea) {
        transcriptUploadArea.addEventListener('click', () => {
            transcriptFileInput.click();
        });
        
        transcriptUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            transcriptUploadArea.classList.add('dragover');
        });
        
        transcriptUploadArea.addEventListener('dragleave', () => {
            transcriptUploadArea.classList.remove('dragover');
        });
        
        transcriptUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            transcriptUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                transcriptFileInput.files = files;
                handleTranscriptFileSelect(files[0]);
            }
        });
    }
    
    if (transcriptFileInput) {
        transcriptFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleTranscriptFileSelect(e.target.files[0]);
            }
        });
    }
    
    function handleTranscriptFileSelect(file) {
        if (transcriptFileInfo) transcriptFileInfo.classList.remove('hidden');
        if (transcriptFileName) transcriptFileName.textContent = file.name;
        if (transcriptFileSize) transcriptFileSize.textContent = formatFileSize(file.size);
        console.log('Transcript file accepted:', file.name);
    }
    
    // ========== VOICE TEXT COUNTER ==========
    
    if (voiceText && textCount) {
        voiceText.addEventListener('input', function() {
            const count = this.value.length;
            textCount.textContent = count;
            
            if (count > 5000) {
                this.value = this.value.substring(0, 5000);
                textCount.textContent = 5000;
            }
        });
    }
    
    // ========== EFFECT TOGGLES ==========
    
    // Toggle effect options when clicking on header
    document.querySelectorAll('.effect-header').forEach(header => {
        header.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                const options = this.nextElementSibling;
                if (options) {
                    options.classList.toggle('hidden');
                }
            }
        });
    });
    
    // Zoom enabled checkbox
    const zoomEnabled = document.getElementById('zoomEnabled');
    if (zoomEnabled) {
        zoomEnabled.addEventListener('change', function() {
            const options = document.getElementById('zoomOptions');
            if (options) options.classList.toggle('hidden', !this.checked);
        });
    }
    
    // Freeze enabled checkbox
    const freezeEnabled = document.getElementById('freezeEnabled');
    if (freezeEnabled) {
        freezeEnabled.addEventListener('change', function() {
            const options = document.getElementById('freezeOptions');
            if (options) options.classList.toggle('hidden', !this.checked);
        });
    }
    
    // Mirror enabled checkbox
    const mirrorEnabled = document.getElementById('mirrorEnabled');
    if (mirrorEnabled) {
        mirrorEnabled.addEventListener('change', function() {
            const options = document.getElementById('mirrorOptions');
            if (options) options.classList.toggle('hidden', !this.checked);
        });
    }
    
    // Rotate enabled checkbox
    const rotateEnabled = document.getElementById('rotateEnabled');
    if (rotateEnabled) {
        rotateEnabled.addEventListener('change', function() {
            const options = document.getElementById('rotateOptions');
            if (options) options.classList.toggle('hidden', !this.checked);
        });
    }
    
    // ========== RANGE INPUT DISPLAYS ==========
    
    // Zoom factor display
    const zoomFactor = document.getElementById('zoomFactor');
    const zoomFactorValue = document.getElementById('zoomFactorValue');
    if (zoomFactor && zoomFactorValue) {
        zoomFactor.addEventListener('input', function() {
            zoomFactorValue.textContent = Math.round(this.value * 100) + '%';
        });
    }
    
    // Blur radius display
    const blurRadius = document.getElementById('blurRadius');
    const blurValue = document.getElementById('blurValue');
    if (blurRadius && blurValue) {
        blurRadius.addEventListener('input', function() {
            blurValue.textContent = this.value;
        });
    }
    
    // ========== PROCESS BUTTONS ==========
    
    if (processBtn) {
        processBtn.addEventListener('click', uploadVideo);
    }
    
    if (generateTranscriptBtn) {
        generateTranscriptBtn.addEventListener('click', generateTranscript);
    }
    
    if (generateVoiceBtn) {
        generateVoiceBtn.addEventListener('click', generateVoice);
    }
    
    // ========== CLOSE MODAL BUTTON ==========
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideProgressModal);
    }
    
    // ========== CANCEL BUTTON ==========
    
    const cancelJobBtn = document.getElementById('cancelJobBtn');
    if (cancelJobBtn) {
        cancelJobBtn.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id');
            if (jobId) {
                cancelJob(jobId);
            }
        });
    }
    
    // ========== CHECK LOGIN STATUS ==========
    
    checkLoginStatus();
    
    // ========== LOAD JOBS ==========
    
    loadJobs();
    setInterval(loadJobs, 3000);
});

// ========== CHECK LOGIN STATUS ==========

async function checkLoginStatus() {
    try {
        const response = await fetch('/current_user');
        const data = await response.json();
        const navUser = document.getElementById('navUser');
        
        if (!navUser) return;
        
        if (data.authenticated) {
            navUser.innerHTML = `
                <span>👤 ${data.username}</span>
                <button class="logout-btn" onclick="logout()">Logout</button>
            `;
        } else {
            navUser.innerHTML = `
                <a href="/login" class="auth-link">Login</a>
                <a href="/register" class="auth-link">Register</a>
            `;
            
            // Hide panels if not logged in
            document.getElementById('editorPanel').classList.add('hidden');
            document.getElementById('transcriptPanel').classList.add('hidden');
            document.getElementById('voicePanel').classList.add('hidden');
        }
    } catch (error) {
        console.error('Failed to check login status:', error);
    }
}

async function logout() {
    try {
        const response = await fetch('/logout');
        if (response.ok) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// ========== VIDEO EDITOR FUNCTIONS ==========

async function uploadVideo() {
    console.log('uploadVideo function called');
    
    const videoInput = document.getElementById('videoInput');
    if (!videoInput) {
        console.error('Video input not found');
        return;
    }
    
    const file = videoInput.files[0];
    
    if (!file) {
        alert('Please select a video file');
        return;
    }
    
    console.log('Uploading file:', file.name);
    
    showProgressModal('Processing Video...');
    
    const formData = new FormData();
    formData.append('video', file);
    
    const getValue = (id, defaultValue) => {
        const el = document.getElementById(id);
        return el ? el.value : defaultValue;
    };
    
    const getChecked = (id) => {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    };
    
    const getRangeValue = (id, defaultValue) => {
        const el = document.getElementById(id);
        return el ? el.value : defaultValue;
    };
    
    // Basic settings
    formData.append('split_time', getValue('splitTime', '6'));
    formData.append('remove_time', getValue('removeTime', '1'));
    formData.append('output_quality', getValue('outputQuality', '1080p'));
    
    // Zoom effect options
    formData.append('zoom_enabled', getChecked('zoomEnabled') ? 'on' : 'off');
    formData.append('zoom_timed', getChecked('zoomTimed') ? 'on' : 'off');
    formData.append('zoom_factor', getRangeValue('zoomFactor', '1.5'));
    formData.append('zoom_type', getValue('zoomType', 'in'));
    formData.append('zoom_interval', getValue('zoomInterval', '7'));
    formData.append('zoom_duration', getValue('zoomDuration', '2'));
    
    // Freeze effect options
    formData.append('freeze_enabled', getChecked('freezeEnabled') ? 'on' : 'off');
    formData.append('freeze_timed', getChecked('freezeTimed') ? 'on' : 'off');
    formData.append('freeze_duration', getValue('freezeDuration', '1'));
    formData.append('freeze_interval', getValue('freezeInterval', '5'));
    
    // Mirror effect
    formData.append('mirror_enabled', getChecked('mirrorEnabled') ? 'on' : 'off');
    formData.append('mirror_type', getValue('mirrorType', 'horizontal'));
    
    // Rotate effect
    formData.append('rotate_enabled', getChecked('rotateEnabled') ? 'on' : 'off');
    formData.append('rotate_angle', getValue('rotateAngle', '90'));
    
    // Blur effect
    formData.append('blur_enabled', getChecked('blurEnabled') ? 'on' : 'off');
    formData.append('blur_radius', getRangeValue('blurRadius', '5'));
    
    // Glitch effect
    formData.append('glitch_enabled', getChecked('glitchEnabled') ? 'on' : 'off');
    formData.append('glitch_intensity', getRangeValue('glitchIntensity', '0.1'));
    
    // Old film effect
    formData.append('oldfilm_enabled', getChecked('oldfilmEnabled') ? 'on' : 'off');
    formData.append('scratch_intensity', getRangeValue('scratchIntensity', '0.1'));
    
    // Speed effect
    formData.append('speed_enabled', getChecked('speedEnabled') ? 'on' : 'off');
    formData.append('speed_factor', getRangeValue('speedFactor', '1.5'));
    formData.append('speed_type', getValue('speedType', 'fast'));
    
    // Noise reduction
    formData.append('noise_reduction', getChecked('noiseReduction') ? 'on' : 'off');
    formData.append('noise_strength', getRangeValue('noiseStrength', '0.5'));
    
    // Text effect
    formData.append('text_enabled', getChecked('textEnabled') ? 'on' : 'off');
    formData.append('text_content', getValue('textContent', ''));
    formData.append('text_position', getValue('textPosition', 'center'));
    formData.append('text_color', getValue('textColor', '#ffffff'));
    formData.append('text_size', getRangeValue('textSize', '40'));
    
    // Transitions
    formData.append('transition_enabled', getChecked('transitionEnabled') ? 'on' : 'off');
    formData.append('transition_type', getValue('transitionType', 'fade'));
    formData.append('transition_duration', getValue('transitionDuration', '1'));
    
    // Music
    formData.append('music_enabled', getChecked('musicEnabled') ? 'on' : 'off');
    
    const musicFile = document.getElementById('musicFile');
    if (musicFile && musicFile.files[0]) {
        formData.append('music_file', musicFile.files[0]);
        formData.append('music_path', musicFile.files[0].name);
    }
    formData.append('music_volume', getRangeValue('musicVolume', '0.5'));
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentJobId = data.job_id;
            
            const cancelBtn = document.getElementById('cancelJobBtn');
            if (cancelBtn) {
                cancelBtn.setAttribute('data-job-id', currentJobId);
            }
            
            updateProgress(0, 'Processing...');
            startStatusCheck(currentJobId);
        } else {
            hideProgressModal();
            alert('Error: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Upload error:', error);
        hideProgressModal();
        alert('Upload failed: ' + error.message);
    }
}

// ========== TRANSCRIPT GENERATOR ==========

async function generateTranscript() {
    console.log('generateTranscript function called');
    
    const fileInput = document.getElementById('transcriptFileInput');
    const urlInput = document.getElementById('transcriptUrl');
    const language = document.getElementById('transcriptLanguage').value;
    
    if (!fileInput.files[0] && !urlInput.value) {
        alert('Please select a file or enter a URL');
        return;
    }
    
    showProgressModal('Generating Transcript...');
    
    const formData = new FormData();
    
    if (fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
    }
    
    if (urlInput.value) {
        formData.append('url', urlInput.value);
    }
    
    formData.append('language', language);
    
    try {
        const response = await fetch('/transcript', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            hideProgressModal();
            
            // Show transcript result
            const transcriptResult = document.getElementById('transcriptResult');
            const transcriptContent = document.getElementById('transcriptContent');
            
            transcriptResult.classList.remove('hidden');
            transcriptContent.textContent = data.transcript;
            currentTranscriptId = data.transcript_id;
            
            // Add to jobs list
            loadJobs();
        } else {
            hideProgressModal();
            alert('Error: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Transcript error:', error);
        hideProgressModal();
        alert('Transcript generation failed: ' + error.message);
    }
}

// ========== VOICE GENERATOR ==========

async function generateVoice() {
    console.log('generateVoice function called');
    
    const text = document.getElementById('voiceText').value;
    const language = document.getElementById('voiceLanguage').value;
    const voiceType = document.getElementById('voiceType').value;
    
    if (!text) {
        alert('Please enter some text');
        return;
    }
    
    if (text.length > 5000) {
        alert('Text is too long (max 5000 characters)');
        return;
    }
    
    showProgressModal('Generating Voice...');
    
    const formData = new FormData();
    formData.append('text', text);
    formData.append('language', language);
    formData.append('voice_type', voiceType);
    
    try {
        const response = await fetch('/voice', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            hideProgressModal();
            
            // Show voice result
            const voiceResult = document.getElementById('voiceResult');
            const voiceAudio = document.getElementById('voiceAudio');
            
            voiceResult.classList.remove('hidden');
            voiceAudio.src = data.audio_url;
            voiceAudio.load();
            currentVoiceId = data.voice_id;
            
            // Add to jobs list
            loadJobs();
        } else {
            hideProgressModal();
            alert('Error: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Voice error:', error);
        hideProgressModal();
        alert('Voice generation failed: ' + error.message);
    }
}

// ========== TRANSCRIPT ACTIONS ==========

window.copyTranscript = function() {
    const content = document.getElementById('transcriptContent').textContent;
    navigator.clipboard.writeText(content).then(() => {
        alert('Transcript copied to clipboard!');
    }).catch(err => {
        console.error('Copy failed:', err);
    });
};

window.downloadTranscript = function() {
    const content = document.getElementById('transcriptContent').textContent;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// ========== VOICE ACTIONS ==========

window.downloadVoice = function() {
    const audio = document.getElementById('voiceAudio');
    if (audio.src) {
        const a = document.createElement('a');
        a.href = audio.src;
        a.download = `voice_${new Date().toISOString().slice(0,10)}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};

// ========== PROGRESS MODAL FUNCTIONS ==========

function showProgressModal(title = 'Processing...') {
    console.log('Showing progress modal');
    const modal = document.getElementById('progressModal');
    const modalTitle = document.getElementById('modalTitle');
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    const status = document.getElementById('progressStatus');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelJobBtn');
    
    if (modal) {
        modal.classList.remove('hidden');
        if (modalTitle) modalTitle.textContent = title;
        if (fill) fill.style.width = '0%';
        if (text) text.textContent = '0%';
        if (status) status.textContent = 'Starting...';
        if (closeBtn) closeBtn.classList.add('hidden');
        if (cancelBtn) {
            cancelBtn.classList.remove('hidden');
            cancelBtn.disabled = false;
        }
        
        setButtonsEnabled(false);
    }
}

function hideProgressModal() {
    console.log('Hiding progress modal');
    const modal = document.getElementById('progressModal');
    const cancelBtn = document.getElementById('cancelJobBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    
    if (modal) {
        modal.classList.add('hidden');
    }
    
    if (cancelBtn) {
        cancelBtn.classList.add('hidden');
        cancelBtn.removeAttribute('data-job-id');
    }
    
    if (closeBtn) {
        closeBtn.classList.add('hidden');
    }
    
    setButtonsEnabled(true);
    
    if (statusInterval) {
        clearInterval(statusInterval);
        statusInterval = null;
    }
}

function updateProgress(progress, statusText) {
    console.log(`Progress update: ${progress}% - ${statusText}`);
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    const statusEl = document.getElementById('progressStatus');
    
    if (fill) fill.style.width = progress + '%';
    if (text) text.textContent = progress + '%';
    if (statusEl) statusEl.textContent = statusText;
}

// ========== CANCEL JOB ==========

async function cancelJob(jobId) {
    if (!confirm('Are you sure you want to cancel this job?')) {
        return;
    }
    
    try {
        const response = await fetch(`/cancel/${jobId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Job cancelled successfully');
            
            if (statusInterval) {
                clearInterval(statusInterval);
                statusInterval = null;
            }
            
            hideProgressModal();
            setButtonsEnabled(true);
            loadJobs();
        } else {
            alert('Error: ' + (data.error || 'Failed to cancel job'));
        }
    } catch (error) {
        console.error('Cancel error:', error);
        alert('Failed to cancel job: ' + error.message);
    }
}

// ========== DISABLE/ENABLE BUTTONS ==========

function setButtonsEnabled(enabled) {
    const processBtn = document.getElementById('processBtn');
    const generateTranscriptBtn = document.getElementById('generateTranscriptBtn');
    const generateVoiceBtn = document.getElementById('generateVoiceBtn');
    const effectCheckboxes = document.querySelectorAll('.effect-header input[type="checkbox"]');
    const settingControls = document.querySelectorAll('.setting-group select, .setting-group input');
    
    if (processBtn) processBtn.disabled = !enabled;
    if (generateTranscriptBtn) generateTranscriptBtn.disabled = !enabled;
    if (generateVoiceBtn) generateVoiceBtn.disabled = !enabled;
    
    effectCheckboxes.forEach(checkbox => {
        checkbox.disabled = !enabled;
    });
    
    settingControls.forEach(control => {
        control.disabled = !enabled;
    });
}

// ========== STATUS CHECK ==========

function startStatusCheck(jobId) {
    console.log('Starting status check for job:', jobId);
    
    if (statusInterval) {
        clearInterval(statusInterval);
    }
    
    statusInterval = setInterval(async () => {
        try {
            const response = await fetch(`/status/${jobId}`);
            const data = await response.json();
            
            console.log('Status update:', data);
            updateProgress(data.progress, data.status);
            
            if (data.status === 'completed') {
                console.log('Job completed');
                clearInterval(statusInterval);
                document.getElementById('progressStatus').textContent = 'Complete!';
                document.getElementById('closeModalBtn').classList.remove('hidden');
                document.getElementById('cancelJobBtn').classList.add('hidden');
                
                setButtonsEnabled(true);
                loadJobs();
                
                if (data.output_url) {
                    setTimeout(() => {
                        if (confirm('Download edited video?')) {
                            window.location.href = data.output_url;
                        }
                    }, 500);
                }
            } else if (data.status === 'error') {
                console.error('Job error:', data.error);
                clearInterval(statusInterval);
                document.getElementById('progressStatus').textContent = 'Error: ' + (data.error || 'Unknown error');
                document.getElementById('closeModalBtn').classList.remove('hidden');
                document.getElementById('cancelJobBtn').classList.add('hidden');
                
                setButtonsEnabled(true);
            } else if (data.status === 'cancelled') {
                console.log('Job cancelled');
                clearInterval(statusInterval);
                document.getElementById('progressStatus').textContent = 'Cancelled';
                document.getElementById('closeModalBtn').classList.remove('hidden');
                document.getElementById('cancelJobBtn').classList.add('hidden');
                
                setButtonsEnabled(true);
                loadJobs();
            }
        } catch (error) {
            console.error('Status check failed:', error);
        }
    }, 1000);
}

// ========== LOAD JOBS ==========

async function loadJobs() {
    try {
        const response = await fetch('/jobs');
        const jobs = await response.json();
        displayJobs(jobs);
    } catch (error) {
        console.error('Failed to load jobs:', error);
    }
}

function displayJobs(jobs) {
    const jobsList = document.getElementById('jobsList');
    
    if (!jobsList) {
        console.error('Jobs list element not found');
        return;
    }
    
    if (jobs.length === 0) {
        jobsList.innerHTML = '<p class="no-jobs">No active jobs</p>';
        return;
    }
    
    let html = '';
    jobs.slice().reverse().forEach(job => {
        let actions = '';
        
        if (job.status === 'completed') {
            actions = `<button class="download-btn" onclick="window.location.href='/download/${job.id}'">⬇️ Download</button>`;
        } else if (job.status === 'processing' || job.status === 'queued') {
            actions = `
                <span>${job.progress}%</span>
                <button class="cancel-job-btn" onclick="cancelJob('${job.id}')">✖ Cancel</button>
            `;
        } else {
            actions = `<span>${job.progress}%</span>`;
        }
        
        html += `
            <div class="job-item ${job.status}">
                <div class="job-header">
                    <span class="job-filename">${truncateFilename(job.filename, 20)}</span>
                    <span class="job-status ${job.status}">${job.status}</span>
                </div>
                <div class="job-progress">
                    <div class="job-progress-fill" style="width: ${job.progress}%"></div>
                </div>
                <div class="job-actions">
                    ${actions}
                </div>
                <div class="job-time">${job.created_at || ''}</div>
            </div>
        `;
    });
    
    jobsList.innerHTML = html;
}

function truncateFilename(name, maxLength) {
    if (!name) return '';
    if (name.length <= maxLength) return name;
    return name.substr(0, maxLength-3) + '...';
}

// ========== DARK MODE TOGGLE ==========

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const toggle = document.getElementById('themeToggle');
    if (document.body.classList.contains('dark-mode')) {
        toggle.textContent = '☀️';
        localStorage.setItem('darkMode', 'enabled');
    } else {
        toggle.textContent = '🌙';
        localStorage.setItem('darkMode', 'disabled');
    }
}

// Check saved dark mode preference
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    const toggle = document.getElementById('themeToggle');
    if (toggle) toggle.textContent = '☀️';
}


// ========== DOWNLOADER FUNCTIONS ==========

let currentDownloadJobId = null;

// Elements
const downloadUrl = document.getElementById('downloadUrl');
const downloadType = document.getElementById('downloadType');
const downloadQuality = document.getElementById('downloadQuality');
const downloadBtn = document.getElementById('downloadBtn');
const qualityGroup = document.getElementById('qualityGroup');
const urlPreview = document.getElementById('urlPreview');
const previewTitle = document.getElementById('previewTitle');
const previewUploader = document.getElementById('previewUploader');
const previewDuration = document.getElementById('previewDuration');
const previewThumbnail = document.getElementById('previewThumbnail');
const downloadResult = document.getElementById('downloadResult');
const downloadLink = document.getElementById('downloadLink');

// URL input change - get video info
if (downloadUrl) {
    let timeoutId;
    downloadUrl.addEventListener('input', function() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            const url = this.value.trim();
            if (url && (url.includes('youtube.com') || url.includes('youtu.be') || 
                        url.includes('facebook.com') || url.includes('tiktok.com'))) {
                getUrlInfo(url);
            } else {
                urlPreview.classList.add('hidden');
            }
        }, 1000);
    });
}

// Download type change
if (downloadType) {
    downloadType.addEventListener('change', function() {
        if (this.value === 'mp3') {
            qualityGroup.style.display = 'none';
        } else {
            qualityGroup.style.display = 'block';
        }
    });
}

// Download button click
if (downloadBtn) {
    downloadBtn.addEventListener('click', startDownload);
}

async function getUrlInfo(url) {
    try {
        const formData = new FormData();
        formData.append('url', url);
        
        const response = await fetch('/url-info', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            previewTitle.textContent = data.title || 'Unknown Title';
            previewUploader.textContent = data.uploader || 'Unknown Uploader';
            if (data.duration) {
                const minutes = Math.floor(data.duration / 60);
                const seconds = data.duration % 60;
                previewDuration.textContent = `Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            if (data.thumbnail) {
                previewThumbnail.src = data.thumbnail;
            }
            urlPreview.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Failed to get video info:', error);
    }
}

async function startDownload() {
    const url = downloadUrl.value.trim();
    
    if (!url) {
        alert('Please enter a URL');
        return;
    }
    
    const fileType = downloadType.value;
    const quality = downloadQuality.value;
    
    showProgressModal('Downloading... (This may take a moment)');
    
    const formData = new FormData();
    formData.append('url', url);
    formData.append('file_type', fileType);
    formData.append('quality', quality);
    
    try {
        const response = await fetch('/download-url', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentDownloadJobId = data.job_id;
            startDownloadStatusCheck(data.job_id);
        } else {
            hideProgressModal();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        hideProgressModal();
        alert('Download failed: ' + error.message);
    }
}

function startDownloadStatusCheck(jobId) {
    if (statusInterval) {
        clearInterval(statusInterval);
    }
    
    statusInterval = setInterval(async () => {
        try {
            const response = await fetch(`/status/${jobId}`);
            const data = await response.json();
            
            updateProgress(data.progress, data.status);
            
            if (data.status === 'completed') {
                clearInterval(statusInterval);
                hideProgressModal();
                
                // Show download link
                downloadResult.classList.remove('hidden');
                downloadLink.href = `/download-file/${jobId}`;
                
                // Load jobs list
                loadJobs();
                
            } else if (data.status === 'error') {
                clearInterval(statusInterval);
                hideProgressModal();
                alert('Download error: ' + data.error);
            }
        } catch (error) {
            console.error('Status check failed:', error);
        }
    }, 1000);
}

// Show downloader panel function
window.showDownloader = function() {
    downloadResult.classList.add('hidden');
    downloadUrl.value = '';
    urlPreview.classList.add('hidden');
    showFeature('downloader');
}
