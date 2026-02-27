// ========================================
// AI Video Editor Pro - Complete JavaScript
// Version: 2.0 (with Home Page & Video Preview)
// ========================================

// ========== GLOBAL VARIABLES ==========
let currentJobId = null;
let statusInterval = null;
let currentTranscriptId = null;
let currentVoiceId = null;
let currentDownloadJobId = null;
let previewVideo = null;
let currentPreviewId = null;
let previewCleanupTimer = null;

// ========== DOM CONTENT LOADED ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded - Initializing...');
    
    // Check login status first
    checkLoginStatus();
    
    // Initialize all event listeners
    initEventListeners();
    
    // Load jobs list
    loadJobs();
    setInterval(loadJobs, 3000);
    
    // Check saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        const toggle = document.getElementById('themeToggle');
        if (toggle) toggle.textContent = '☀️';
    }
});

// ========== INITIALIZE ALL EVENT LISTENERS ==========
function initEventListeners() {
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // ===== VIDEO EDITOR ELEMENTS =====
    initVideoEditorListeners();
    
    // ===== TRANSCRIPT ELEMENTS =====
    initTranscriptListeners();
    
    // ===== VOICE GENERATOR ELEMENTS =====
    initVoiceListeners();
    
    // ===== VOICE CLONE ELEMENTS =====
    initVoiceCloneListeners();
    
    // ===== DOWNLOADER ELEMENTS =====
    initDownloaderListeners();
    
    // ===== MODAL ELEMENTS =====
    initModalListeners();
    
    // ===== EFFECT TOGGLES =====
    initEffectToggles();
    
    // ===== RANGE INPUTS =====
    initRangeInputs();
}

// ========== VIDEO EDITOR LISTENERS ==========
function initVideoEditorListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const videoInput = document.getElementById('videoInput');
    const processBtn = document.getElementById('processBtn');
    
    if (uploadArea && videoInput) {
        // Click to upload
        uploadArea.addEventListener('click', () => {
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
                videoInput.files = files;
                handleVideoSelect(files[0]);
            }
        });
        
        // File input change
        videoInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleVideoSelect(e.target.files[0]);
            }
        });
    }
    
    if (processBtn) {
        processBtn.addEventListener('click', uploadVideo);
    }
}

// ========== TRANSCRIPT LISTENERS ==========
function initTranscriptListeners() {
    const transcriptUploadArea = document.getElementById('transcriptUploadArea');
    const transcriptFileInput = document.getElementById('transcriptFileInput');
    const generateTranscriptBtn = document.getElementById('generateTranscriptBtn');
    
    if (transcriptUploadArea && transcriptFileInput) {
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
        
        transcriptFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleTranscriptFileSelect(e.target.files[0]);
            }
        });
    }
    
    if (generateTranscriptBtn) {
        generateTranscriptBtn.addEventListener('click', generateTranscript);
    }
}

// ========== VOICE GENERATOR LISTENERS ==========
function initVoiceListeners() {
    const voiceText = document.getElementById('voiceText');
    const textCount = document.getElementById('textCount');
    const generateVoiceBtn = document.getElementById('generateVoiceBtn');
    
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
    
    if (generateVoiceBtn) {
        generateVoiceBtn.addEventListener('click', generateVoice);
    }
}

// ========== VOICE CLONE LISTENERS ==========
function initVoiceCloneListeners() {
    const cloneUploadArea = document.getElementById('cloneUploadArea');
    const cloneAudioInput = document.getElementById('cloneAudioInput');
    const cloneVoiceBtn = document.getElementById('cloneVoiceBtn');
    
    if (cloneUploadArea && cloneAudioInput) {
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
        
        cloneAudioInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleCloneFileSelect(e.target.files[0]);
            }
        });
    }
    
    if (cloneVoiceBtn) {
        cloneVoiceBtn.addEventListener('click', cloneVoice);
    }
}

// ========== DOWNLOADER LISTENERS ==========
function initDownloaderListeners() {
    const downloadUrl = document.getElementById('downloadUrl');
    const downloadType = document.getElementById('downloadType');
    const downloadBtn = document.getElementById('downloadBtn');
    const qualityGroup = document.getElementById('qualityGroup');
    
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
                    document.getElementById('urlPreview').classList.add('hidden');
                }
            }, 1000);
        });
    }
    
    if (downloadType && qualityGroup) {
        downloadType.addEventListener('change', function() {
            if (this.value === 'mp3') {
                qualityGroup.style.display = 'none';
            } else {
                qualityGroup.style.display = 'block';
            }
        });
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', startDownload);
    }
}

// ========== MODAL LISTENERS ==========
function initModalListeners() {
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelJobBtn = document.getElementById('cancelJobBtn');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideProgressModal);
    }
    
    if (cancelJobBtn) {
        cancelJobBtn.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id');
            if (jobId) {
                cancelJob(jobId);
            }
        });
    }
}

// ========== EFFECT TOGGLES ==========
function initEffectToggles() {
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
    
    // Text enabled checkbox
    const textEnabled = document.getElementById('textEnabled');
    if (textEnabled) {
        textEnabled.addEventListener('change', function() {
            const options = document.getElementById('textOptions');
            if (options) options.classList.toggle('hidden', !this.checked);
        });
    }
}

// ========== RANGE INPUTS ==========
function initRangeInputs() {
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
}

// ========== FEATURE NAVIGATION ==========
window.showFeature = function(feature) {
    // Hide hero section and features grid
    document.querySelector('.hero').classList.add('hidden');
    document.querySelector('.features-grid').classList.add('hidden');
    
    // Show main content
    document.getElementById('mainContent').classList.remove('hidden');
    
    // Show the selected feature panel
    showFeaturePanel(feature);
};

window.showFeaturePanel = function(feature) {
    // Clean up preview if leaving editor
    if (feature !== 'editor') {
        cleanupPreview();
    }
    
    // Hide all feature panels
    document.querySelectorAll('.feature-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    
    // Show selected panel
    const panelId = `${feature}Panel`;
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.remove('hidden');
    }
    
    // Update active state on nav buttons
    document.querySelectorAll('.feature-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const navBtnId = `nav${feature.charAt(0).toUpperCase()}${feature.slice(1)}`;
    const navBtn = document.getElementById(navBtnId);
    if (navBtn) {
        navBtn.classList.add('active');
    }
};

window.hideAllFeatures = function() {
    // Show hero section and features grid
    document.querySelector('.hero').classList.remove('hidden');
    document.querySelector('.features-grid').classList.remove('hidden');
    
    // Hide main content
    document.getElementById('mainContent').classList.add('hidden');
    
    // Clean up preview
    cleanupPreview();
};

// ========== VIDEO PREVIEW FUNCTIONS ==========
function handleVideoSelect(file) {
    if (file.type.startsWith('video/')) {
        // Show file info
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const processBtn = document.getElementById('processBtn');
        
        if (fileInfo) fileInfo.classList.remove('hidden');
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = formatFileSize(file.size);
        if (processBtn) processBtn.disabled = false;
        
        // Create preview
        createVideoPreview(file);
        
        console.log('File accepted:', file.name);
    } else {
        alert('Please select a video file');
    }
}

async function createVideoPreview(file) {
    try {
        // Show preview section
        const previewSection = document.getElementById('previewSection');
        previewSection.classList.remove('hidden');
        
        // Create object URL for local preview
        const videoUrl = URL.createObjectURL(file);
        const videoPreview = document.getElementById('videoPreview');
        videoPreview.src = videoUrl;
        
        // Store preview video element
        previewVideo = videoPreview;
        
        // Initialize preview controls
        initPreviewControls();
        
        // Upload to server for server-side preview
        await uploadForServerPreview(file);
        
        // Auto-cleanup after 1 hour
        if (previewCleanupTimer) {
            clearTimeout(previewCleanupTimer);
        }
        previewCleanupTimer = setTimeout(() => {
            cleanupPreview();
        }, 3600000); // 1 hour
        
    } catch (error) {
        console.error('Preview creation error:', error);
    }
}

async function uploadForServerPreview(file) {
    const formData = new FormData();
    formData.append('video', file);
    
    try {
        const response = await fetch('/preview-upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentPreviewId = data.preview_id;
            console.log('Server preview ready:', data);
        }
    } catch (error) {
        console.error('Server preview upload error:', error);
    }
}

function initPreviewControls() {
    if (!previewVideo) return;
    
    const playPauseBtn = document.getElementById('playPauseBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (previewVideo.paused) {
                previewVideo.play();
                playPauseBtn.textContent = '⏸️ Pause';
            } else {
                previewVideo.pause();
                playPauseBtn.textContent = '▶️ Play';
            }
        });
    }
    
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            previewVideo.muted = !previewVideo.muted;
            muteBtn.textContent = previewVideo.muted ? '🔊 Unmute' : '🔇 Mute';
        });
    }
    
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            previewVideo.volume = e.target.value;
        });
    }
    
    // Video ended event
    previewVideo.addEventListener('ended', () => {
        if (playPauseBtn) playPauseBtn.textContent = '▶️ Play';
    });
}

function cleanupPreview() {
    const previewSection = document.getElementById('previewSection');
    const videoPreview = document.getElementById('videoPreview');
    const fileInfo = document.getElementById('fileInfo');
    const videoInput = document.getElementById('videoInput');
    const processBtn = document.getElementById('processBtn');
    
    // Revoke object URL to free memory
    if (videoPreview && videoPreview.src) {
        URL.revokeObjectURL(videoPreview.src);
        videoPreview.src = '';
    }
    
    // Hide preview section
    if (previewSection) {
        previewSection.classList.add('hidden');
    }
    
    // Hide file info
    if (fileInfo) {
        fileInfo.classList.add('hidden');
    }
    
    // Clear file input
    if (videoInput) {
        videoInput.value = '';
    }
    
    // Disable process button
    if (processBtn) {
        processBtn.disabled = true;
    }
    
    // Clear preview variables
    previewVideo = null;
    currentPreviewId = null;
    
    if (previewCleanupTimer) {
        clearTimeout(previewCleanupTimer);
        previewCleanupTimer = null;
    }
}

// ========== HANDLE FILE SELECT ==========
function handleTranscriptFileSelect(file) {
    const fileInfo = document.getElementById('transcriptFileInfo');
    const fileName = document.getElementById('transcriptFileName');
    const fileSize = document.getElementById('transcriptFileSize');
    
    if (fileInfo) fileInfo.classList.remove('hidden');
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = formatFileSize(file.size);
    console.log('Transcript file accepted:', file.name);
}

function handleCloneFileSelect(file) {
    if (file.type.startsWith('audio/')) {
        const fileInfo = document.getElementById('cloneFileInfo');
        const fileName = document.getElementById('cloneFileName');
        
        if (fileInfo) fileInfo.classList.remove('hidden');
        if (fileName) fileName.textContent = file.name;
        console.log('Clone audio selected:', file.name);
    } else {
        alert('Please select an audio file');
    }
}

// ========== FORMAT FILE SIZE ==========
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ========== TRUNCATE FILENAME ==========
function truncateFilename(name, maxLength) {
    if (!name) return '';
    if (name.length <= maxLength) return name;
    return name.substr(0, maxLength-3) + '...';
}

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
            
            // Hide all features if not logged in
            document.querySelector('.hero').classList.remove('hidden');
            document.querySelector('.features-grid').classList.remove('hidden');
            document.getElementById('mainContent').classList.add('hidden');
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
    
    // Cleanup preview before processing
    cleanupPreview();
    
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

// ========== VOICE CLONE ==========
async function cloneVoice() {
    const audioFile = document.getElementById('cloneAudioInput').files[0];
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

// ========== DOWNLOADER FUNCTIONS ==========
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
            document.getElementById('previewTitle').textContent = data.title || 'Unknown Title';
            document.getElementById('previewUploader').textContent = data.uploader || 'Unknown Uploader';
            if (data.duration) {
                const minutes = Math.floor(data.duration / 60);
                const seconds = data.duration % 60;
                document.getElementById('previewDuration').textContent = `Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            if (data.thumbnail) {
                document.getElementById('previewThumbnail').src = data.thumbnail;
            }
            document.getElementById('urlPreview').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Failed to get video info:', error);
    }
}

async function startDownload() {
    const url = document.getElementById('downloadUrl').value.trim();
    
    if (!url) {
        alert('Please enter a URL');
        return;
    }
    
    const fileType = document.getElementById('downloadType').value;
    const quality = document.getElementById('downloadQuality').value;
    
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
                document.getElementById('downloadResult').classList.remove('hidden');
                document.getElementById('downloadLink').href = `/download-file/${jobId}`;
                
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
        closeBtn.classList.add
