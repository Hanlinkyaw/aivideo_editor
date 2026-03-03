// ========================================
// AI Video Editor Pro - Complete JavaScript
// Version: 4.0 (Fixed all reference errors)
// ========================================

// ========== GLOBAL VARIABLES ==========
let currentJobId = null;
let statusInterval = null;
let currentTranscriptId = null;
let currentVoiceId = null;
let currentDownloadJobId = null;
let previewVideo = null;
let currentPreviewId = null;

// ========== WHEN PAGE LOADS ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded - Initializing...');
    
    // Check login status
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

// ========== FEATURE NAVIGATION ==========
window.showFeature = function(feature) {
    console.log('🎯 Feature clicked:', feature);
    
    // Hide hero and features
    const hero = document.querySelector('.hero');
    const featuresGrid = document.querySelector('.features-grid');
    
    if (hero) hero.classList.add('hidden');
    if (featuresGrid) featuresGrid.classList.add('hidden');
    
    // Show main content
    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.classList.remove('hidden');
    
    // Hide all panels
    document.querySelectorAll('.feature-panel').forEach(p => p.classList.add('hidden'));
    
    // Show selected panel - FIXED HERE
    let panelId;
    if (feature === 'voice-clone') {
        panelId = 'voiceclonePanel';  // Capital C
    } else {
        panelId = feature + 'Panel';  // editorPanel, downloaderPanel, etc
    }
    
    const selectedPanel = document.getElementById(panelId);
    if (selectedPanel) {
        selectedPanel.classList.remove('hidden');
        console.log('✅ Showing panel:', panelId);
    } else {
        console.error('❌ Panel not found:', panelId);
        // Try alternative naming
        if (feature === 'voice-clone') {
            const altPanel = document.getElementById('voiceclonePanel');
            if (altPanel) {
                altPanel.classList.remove('hidden');
                console.log('✅ Found alternative panel');
            }
        }
    }
};

// ========== LOAD JOBS WITH ERROR HANDLING ==========
async function loadJobs() {
    try {
        const response = await fetch('/jobs');
        
        // Check if response is OK
        if (!response.ok) {
            console.error('Jobs API returned:', response.status);
            return;
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Response is not JSON:', contentType);
            return;
        }
        
        const jobs = await response.json();
        displayJobs(jobs);
    } catch (error) {
        console.error('Failed to load jobs:', error);
        // Don't show error to user, just log it
    }
}

window.hideAllFeatures = function() {
    console.log('🏠 Going back to home');
    
    // Show hero and features grid
    const hero = document.querySelector('.hero');
    const featuresGrid = document.querySelector('.features-grid');
    
    if (hero) hero.classList.remove('hidden');
    if (featuresGrid) featuresGrid.classList.remove('hidden');
    
    // Hide main content
    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.classList.add('hidden');
    
    // Clean up preview if any
    cleanupPreview();
};

// ========== DARK MODE TOGGLE ==========
window.toggleDarkMode = function() {
    console.log('🌓 Toggling dark mode');
    
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    
    if (!toggle) {
        console.error('❌ Theme toggle button not found');
        return;
    }
    
    // Toggle dark mode class
    const isDarkMode = body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        // Switch to light mode
        body.classList.remove('dark-mode');
        toggle.textContent = '🌙';
        toggle.title = 'Switch to Dark Mode';
        localStorage.setItem('darkMode', 'disabled');
        console.log('🌞 Switched to light mode');
    } else {
        // Switch to dark mode
        body.classList.add('dark-mode');
        toggle.textContent = '☀️';
        toggle.title = 'Switch to Light Mode';
        localStorage.setItem('darkMode', 'enabled');
        console.log('🌙 Switched to dark mode');
    }
    
    // Force a repaint to ensure styles are applied
    void body.offsetWidth;
};

// Check saved dark mode preference on load
document.addEventListener('DOMContentLoaded', function() {
    // Check if dark mode was enabled
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.textContent = '☀️';
            toggle.title = 'Switch to Light Mode';
        }
    }
});

// ========== INITIALIZE EVENT LISTENERS ==========
function initEventListeners() {
    console.log('🔧 Initializing event listeners');
    
    // Theme Toggle - Remove existing listener and add new one
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        // Remove any existing click listeners
        themeToggle.removeEventListener('click', toggleDarkMode);
        // Add fresh click listener
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleDarkMode();
        });
        console.log('✅ Theme toggle listener attached');
    } else {
        console.error('❌ Theme toggle button not found during initialization');
    }
    
    // Back/Home buttons
    const backBtn = document.querySelector('.feature-nav-btn.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', hideAllFeatures);
    }
    
    // Feature nav buttons
    document.querySelectorAll('.feature-nav-btn:not(.back-btn)').forEach(btn => {
        btn.addEventListener('click', function() {
            const feature = this.id.replace('nav', '').toLowerCase();
            showFeature(feature);
        });
    });
    
    // Feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('h3').textContent.toLowerCase();
            
            if (title.includes('video editor')) {
                showFeature('editor');
            } else if (title.includes('downloader')) {
                showFeature('downloader');
            } else if (title.includes('transcript')) {
                showFeature('transcript');
            } else if (title.includes('voice generator')) {
                showFeature('voice');
            } else if (title.includes('voice clone')) {
                showFeature('voice-clone');
            }
        });
    });
    
    // Initialize other listeners
    initVideoEditorListeners();
    initTranscriptListeners();
    initVoiceListeners();
    initVoiceCloneListeners();
    initDownloaderListeners();
    initModalListeners();
    initEffectToggles();
    initRangeInputs();
    
    console.log('✅ All event listeners initialized');
}

// ========== VIDEO EDITOR LISTENERS ==========
function initVideoEditorListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const videoInput = document.getElementById('videoInput');
    const processBtn = document.getElementById('processBtn');
    
    if (uploadArea && videoInput) {
        uploadArea.addEventListener('click', () => videoInput.click());
        
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
            if (e.dataTransfer.files.length > 0) {
                videoInput.files = e.dataTransfer.files;
                handleVideoSelect(e.dataTransfer.files[0]);
            }
        });
        
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

// ========== VIDEO PREVIEW ==========
function handleVideoSelect(file) {
    if (file.type.startsWith('video/')) {
        document.getElementById('fileInfo').classList.remove('hidden');
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = formatFileSize(file.size);
        document.getElementById('processBtn').disabled = false;
        
        // Show preview
        const previewSection = document.getElementById('previewSection');
        previewSection.classList.remove('hidden');
        
        const videoUrl = URL.createObjectURL(file);
        const videoPreview = document.getElementById('videoPreview');
        videoPreview.src = videoUrl;
        previewVideo = videoPreview;
        
        initPreviewControls();
    } else {
        alert('Please select a video file');
    }
}

function initPreviewControls() {
    if (!previewVideo) return;
    
    const playPauseBtn = document.getElementById('playPauseBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    
    playPauseBtn.addEventListener('click', () => {
        if (previewVideo.paused) {
            previewVideo.play();
            playPauseBtn.textContent = '⏸️ Pause';
        } else {
            previewVideo.pause();
            playPauseBtn.textContent = '▶️ Play';
        }
    });
    
    muteBtn.addEventListener('click', () => {
        previewVideo.muted = !previewVideo.muted;
        muteBtn.textContent = previewVideo.muted ? '🔊 Unmute' : '🔇 Mute';
    });
    
    volumeSlider.addEventListener('input', (e) => {
        previewVideo.volume = e.target.value;
    });
    
    previewVideo.addEventListener('ended', () => {
        playPauseBtn.textContent = '▶️ Play';
    });
}

function cleanupPreview() {
    const previewSection = document.getElementById('previewSection');
    const videoPreview = document.getElementById('videoPreview');
    
    if (videoPreview && videoPreview.src) {
        URL.revokeObjectURL(videoPreview.src);
        videoPreview.src = '';
    }
    
    if (previewSection) previewSection.classList.add('hidden');
    
    document.getElementById('fileInfo').classList.add('hidden');
    document.getElementById('videoInput').value = '';
    document.getElementById('processBtn').disabled = true;
    
    previewVideo = null;
}

// ========== TRANSCRIPT ==========
function initTranscriptListeners() {
    const uploadArea = document.getElementById('transcriptUploadArea');
    const fileInput = document.getElementById('transcriptFileInput');
    const generateBtn = document.getElementById('generateTranscriptBtn');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                document.getElementById('transcriptFileInfo').classList.remove('hidden');
                document.getElementById('transcriptFileName').textContent = e.target.files[0].name;
                document.getElementById('transcriptFileSize').textContent = formatFileSize(e.target.files[0].size);
            }
        });
    }
    
    if (generateBtn) {
        generateBtn.addEventListener('click', generateTranscript);
    }
}

async function generateTranscript() {
    const fileInput = document.getElementById('transcriptFileInput');
    const urlInput = document.getElementById('transcriptUrl');
    const language = document.getElementById('transcriptLanguage').value;
    
    if (!fileInput.files[0] && !urlInput.value) {
        alert('Please select a file or enter a URL');
        return;
    }
    
    showProgressModal('Generating Transcript...');
    
    const formData = new FormData();
    if (fileInput.files[0]) formData.append('file', fileInput.files[0]);
    if (urlInput.value) formData.append('url', urlInput.value);
    formData.append('language', language);
    
    try {
        const response = await fetch('/transcript', { method: 'POST', body: formData });
        const data = await response.json();
        
        if (response.ok) {
            hideProgressModal();
            document.getElementById('transcriptResult').classList.remove('hidden');
            document.getElementById('transcriptContent').textContent = data.transcript;
            currentTranscriptId = data.transcript_id;
            loadJobs();
        } else {
            hideProgressModal();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        hideProgressModal();
        alert('Transcript failed: ' + error.message);
    }
}

// ========== VOICE GENERATOR ==========
function initVoiceListeners() {
    const textarea = document.getElementById('voiceText');
    const count = document.getElementById('textCount');
    const generateBtn = document.getElementById('generateVoiceBtn');
    
    if (textarea && count) {
        textarea.addEventListener('input', function() {
            count.textContent = this.value.length;
            if (this.value.length > 5000) {
                this.value = this.value.substring(0, 5000);
                count.textContent = 5000;
            }
        });
    }
    
    if (generateBtn) {
        generateBtn.addEventListener('click', generateVoice);
    }
}

async function generateVoice() {
    const text = document.getElementById('voiceText').value;
    const language = document.getElementById('voiceLanguage').value;
    const voiceType = document.getElementById('voiceType').value;
    
    if (!text) {
        alert('Please enter some text');
        return;
    }
    
    showProgressModal('Generating Voice...');
    
    const formData = new FormData();
    formData.append('text', text);
    formData.append('language', language);
    formData.append('voice_type', voiceType);
    
    try {
        const response = await fetch('/voice', { method: 'POST', body: formData });
        const data = await response.json();
        
        if (response.ok) {
            hideProgressModal();
            document.getElementById('voiceResult').classList.remove('hidden');
            const audio = document.getElementById('voiceAudio');
            audio.src = data.audio_url;
            audio.load();
            currentVoiceId = data.voice_id;
            loadJobs();
        } else {
            hideProgressModal();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        hideProgressModal();
        alert('Voice generation failed: ' + error.message);
    }
}

// ========== VOICE CLONE ==========
function initVoiceCloneListeners() {
    const uploadArea = document.getElementById('cloneUploadArea');
    const fileInput = document.getElementById('cloneAudioInput');
    const cloneBtn = document.getElementById('cloneVoiceBtn');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                document.getElementById('cloneFileInfo').classList.remove('hidden');
                document.getElementById('cloneFileName').textContent = e.target.files[0].name;
            }
        });
    }
    
    if (cloneBtn) {
        cloneBtn.addEventListener('click', cloneVoice);
    }
}

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
        const response = await fetch('/voice-clone', { method: 'POST', body: formData });
        const data = await response.json();
        
        if (response.ok) {
            hideProgressModal();
            document.getElementById('voiceResult').classList.remove('hidden');
            const audio = document.getElementById('voiceAudio');
            audio.src = data.audio_url;
            audio.load();
            alert('Voice cloned successfully!');
        } else {
            hideProgressModal();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        hideProgressModal();
        alert('Voice clone failed: ' + error.message);
    }
}

// ========== DOWNLOADER ==========
function initDownloaderListeners() {
    const urlInput = document.getElementById('downloadUrl');
    const downloadBtn = document.getElementById('downloadBtn');
    
    if (urlInput) {
        let timeout;
        urlInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (this.value.trim()) getUrlInfo(this.value.trim());
            }, 1000);
        });
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', startDownload);
    }
}

async function getUrlInfo(url) {
    const formData = new FormData();
    formData.append('url', url);
    
    try {
        const response = await fetch('/url-info', { method: 'POST', body: formData });
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('previewTitle').textContent = data.title || 'Unknown';
            document.getElementById('previewUploader').textContent = data.uploader || 'Unknown';
            document.getElementById('previewThumbnail').src = data.thumbnail || '';
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
    
    // Show non-blocking progress notification
    showDownloadProgress('Download started...');
    
    const formData = new FormData();
    formData.append('url', url);
    formData.append('file_type', document.getElementById('downloadType').value);
    formData.append('quality', document.getElementById('downloadQuality').value);
    
    try {
        const response = await fetch('/download-url', { method: 'POST', body: formData });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.job_id) {
            currentDownloadJobId = data.job_id;
            startDownloadStatusCheck(data.job_id);
            // Show success message
            showDownloadProgress('Download in progress... You can continue using the app!');
        } else {
            hideDownloadProgress();
            alert('Error: ' + (data.error || 'Unknown error occurred'));
        }
    } catch (error) {
        hideDownloadProgress();
        console.error('Download failed:', error);
        
        // Handle specific error types
        if (error.message.includes('Unexpected token')) {
            alert('Session expired. Please refresh the page and login again.');
        } else if (error.message.includes('401')) {
            alert('Please login to download files.');
        } else if (error.message.includes('403')) {
            alert('You do not have permission to download files.');
        } else {
            alert('Download failed: ' + error.message);
        }
    }
}

// ========== UTILITY FUNCTIONS ==========
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

// ========== PROGRESS MODAL ==========
function showProgressModal(title) {
    document.getElementById('progressModal').classList.remove('hidden');
    document.getElementById('modalTitle').textContent = title || 'Processing...';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';
    document.getElementById('progressStatus').textContent = 'Starting...';
    document.getElementById('cancelJobBtn').classList.remove('hidden');
    document.getElementById('closeModalBtn').classList.add('hidden');
    setButtonsEnabled(false);
}

function hideProgressModal() {
    document.getElementById('progressModal').classList.add('hidden');
    setButtonsEnabled(true);
    if (statusInterval) {
        clearInterval(statusInterval);
        statusInterval = null;
    }
}

function updateProgress(progress, status) {
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = progress + '%';
    document.getElementById('progressStatus').textContent = status;
}

function setButtonsEnabled(enabled) {
    document.getElementById('processBtn').disabled = !enabled;
    document.getElementById('generateTranscriptBtn').disabled = !enabled;
    document.getElementById('generateVoiceBtn').disabled = !enabled;
    document.getElementById('cloneVoiceBtn').disabled = !enabled;
    document.getElementById('downloadBtn').disabled = !enabled;
}

// ========== JOB MANAGEMENT ==========
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
    if (!jobsList) return;
    
    if (jobs.length === 0) {
        jobsList.innerHTML = '<p class="no-jobs">No active jobs</p>';
        return;
    }
    
    let html = '';
    jobs.slice().reverse().forEach(job => {
        html += `
            <div class="job-item ${job.status}">
                <div class="job-header">
                    <span class="job-filename">${truncateFilename(job.filename, 20)}</span>
                    <span class="job-status ${job.status}">${job.status}</span>
                </div>
                <div class="job-progress">
                    <div class="job-progress-fill" style="width: ${job.progress}%"></div>
                </div>
            </div>
        `;
    });
    
    jobsList.innerHTML = html;
}

function truncateFilename(name, max) {
    if (!name || name.length <= max) return name || '';
    return name.substr(0, max-3) + '...';
}

// ========== STATUS CHECK ==========
function startStatusCheck(jobId) {
    if (statusInterval) clearInterval(statusInterval);
    
    statusInterval = setInterval(async () => {
        try {
            const response = await fetch(`/status/${jobId}`);
            const data = await response.json();
            
            updateProgress(data.progress, data.status);
            
            if (data.status === 'completed' || data.status === 'error') {
                clearInterval(statusInterval);
                document.getElementById('closeModalBtn').classList.remove('hidden');
                document.getElementById('cancelJobBtn').classList.add('hidden');
                setButtonsEnabled(true);
                loadJobs();
                
                if (data.status === 'completed' && data.output_url) {
                    setTimeout(() => {
                        if (confirm('Download file?')) {
                            window.location.href = data.output_url;
                        }
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Status check failed:', error);
        }
    }, 1000);
}

// ========== DOWNLOAD STATUS ==========
function startDownloadStatusCheck(jobId) {
    if (statusInterval) clearInterval(statusInterval);
    
    statusInterval = setInterval(async () => {
        try {
            const response = await fetch(`/status/${jobId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'completed') {
                clearInterval(statusInterval);
                hideDownloadProgress();
                showDownloadComplete(jobId);
                loadJobs();
            } else if (data.status === 'error') {
                clearInterval(statusInterval);
                hideDownloadProgress();
                alert('Download error: ' + (data.error || 'Unknown error'));
            } else {
                // Update progress message
                showDownloadProgress(`Downloading... ${data.progress || 0}%`);
            }
        } catch (error) {
            console.error('Status check failed:', error);
            // If we get HTML instead of JSON, likely authentication issue
            if (error.message.includes('Unexpected token')) {
                clearInterval(statusInterval);
                hideDownloadProgress();
                alert('Session expired. Please refresh the page and login again.');
                return;
            }
        }
    }, 2000); // Check every 2 seconds instead of 1
}

// ========== NON-BLOCKING PROGRESS FUNCTIONS ==========
function showDownloadProgress(message) {
    // Create or update progress notification
    let progressDiv = document.getElementById('downloadProgress');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'downloadProgress';
        progressDiv.className = 'download-progress';
        document.body.appendChild(progressDiv);
    }
    progressDiv.innerHTML = `
        <div class="progress-content">
            <div class="progress-icon">📥</div>
            <div class="progress-message">${message}</div>
            <button class="progress-close" onclick="hideDownloadProgress()">×</button>
        </div>
    `;
    progressDiv.classList.remove('hidden');
}

function hideDownloadProgress() {
    const progressDiv = document.getElementById('downloadProgress');
    if (progressDiv) {
        progressDiv.classList.add('hidden');
    }
}

function showDownloadComplete(jobId) {
    // Show completion notification
    const progressDiv = document.getElementById('downloadProgress');
    if (progressDiv) {
        progressDiv.innerHTML = `
            <div class="progress-content completed">
                <div class="progress-icon">✅</div>
                <div class="progress-message">Download completed!</div>
                <button class="download-btn" onclick="window.open('/download-file/${jobId}', '_blank')">
                    📥 Download File
                </button>
                <button class="progress-close" onclick="hideDownloadProgress()">×</button>
            </div>
        `;
        progressDiv.classList.remove('hidden');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            hideDownloadProgress();
        }, 10000);
    }
    
    // Show download result in the downloader panel
    showDownloadResult(jobId);
}

function showDownloadResult(jobId) {
    const downloadResult = document.getElementById('downloadResult');
    if (downloadResult) {
        downloadResult.classList.remove('hidden');
        
        // Get file info
        fetch(`/status/${jobId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.filename) {
                    document.getElementById('downloadFileName').textContent = data.filename;
                }
                if (data.file_size) {
                    document.getElementById('downloadFileSize').textContent = formatFileSize(data.file_size);
                }
            })
            .catch(error => {
                console.error('Error getting file info:', error);
                // Show error message to user
                const fileName = document.getElementById('downloadFileName');
                if (fileName) {
                    fileName.textContent = 'Error loading file info';
                }
            });
        
        // Setup download button
        const downloadBtn = document.getElementById('downloadToDeviceBtn');
        if (downloadBtn) {
            downloadBtn.onclick = () => {
                window.location.href = `/download-file/${jobId}`;
            };
        }
        
        // Setup preview button
        const previewBtn = document.getElementById('previewDownloadedBtn');
        if (previewBtn) {
            previewBtn.onclick = () => {
                previewDownloadedFile(jobId);
            };
        }
    }
}

function previewDownloadedFile(jobId) {
    // Show video preview with downloaded file
    const previewSection = document.getElementById('previewSection');
    const videoPreview = document.getElementById('videoPreview');
    
    if (previewSection && videoPreview) {
        videoPreview.src = `/preview-file/${jobId}`;
        previewSection.classList.remove('hidden');
        
        // Scroll to preview
        previewSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// ========== LOGIN STATUS ==========
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
        }
    } catch (error) {
        console.error('Failed to check login status:', error);
    }
}

async function logout() {
    try {
        const response = await fetch('/logout');
        if (response.ok) window.location.reload();
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// ========== EFFECT TOGGLES ==========
function initEffectToggles() {
    const zoomCheck = document.getElementById('zoomEnabled');
    if (zoomCheck) {
        zoomCheck.addEventListener('change', function() {
            document.getElementById('zoomOptions').classList.toggle('hidden', !this.checked);
        });
    }
    
    const freezeCheck = document.getElementById('freezeEnabled');
    if (freezeCheck) {
        freezeCheck.addEventListener('change', function() {
            document.getElementById('freezeOptions').classList.toggle('hidden', !this.checked);
        });
    }
}

function initRangeInputs() {
    const zoomFactor = document.getElementById('zoomFactor');
    if (zoomFactor) {
        zoomFactor.addEventListener('input', function() {
            document.getElementById('zoomFactorValue').textContent = Math.round(this.value * 100) + '%';
        });
    }
}

// ========== MODAL LISTENERS ==========
function initModalListeners() {
    document.getElementById('closeModalBtn').addEventListener('click', hideProgressModal);
    document.getElementById('cancelJobBtn').addEventListener('click', function() {
        if (currentJobId) cancelJob(currentJobId);
    });
}

async function cancelJob(jobId) {
    if (!confirm('Cancel this job?')) return;
    
    try {
        const response = await fetch(`/cancel/${jobId}`, { method: 'POST' });
        if (response.ok) {
            alert('Job cancelled');
            hideProgressModal();
            loadJobs();
        }
    } catch (error) {
        console.error('Cancel error:', error);
    }
}

// ========== UPLOAD VIDEO ==========
async function uploadVideo() {
    const file = document.getElementById('videoInput').files[0];
    if (!file) {
        alert('Please select a video file');
        return;
    }
    
    cleanupPreview();
    showProgressModal('Processing Video...');
    
    const formData = new FormData();
    formData.append('video', file);
    
    // Add form data
    formData.append('split_time', document.getElementById('splitTime').value);
    formData.append('remove_time', document.getElementById('removeTime').value);
    formData.append('output_quality', document.getElementById('outputQuality').value);
    
    // Effects
	// uploadVideo function ထဲက Zoom effect options ကို ဒီလိုပြင်ပါ
// Zoom effect options
formData.append('zoom_enabled', getChecked('zoomEnabled') ? 'on' : 'off');
formData.append('zoom_timed', getChecked('zoomTimed') ? 'on' : 'off');
formData.append('zoom_factor', getRangeValue('zoomFactor', '1.5'));
formData.append('zoom_type', getValue('zoomType', 'in'));
formData.append('zoom_interval', getValue('zoomInterval', '7'));
formData.append('zoom_duration', getValue('zoomDuration', '2')); // ဒီ line ထည့်ဖို့လိုတယ်

// Freeze effect options
formData.append('freeze_enabled', getChecked('freezeEnabled') ? 'on' : 'off');
formData.append('freeze_timed', getChecked('freezeTimed') ? 'on' : 'off');
formData.append('freeze_duration', getValue('freezeDuration', '1'));
formData.append('freeze_interval', getValue('freezeInterval', '5'));

// Mirror effect
formData.append('mirror_enabled', getChecked('mirrorEnabled') ? 'on' : 'off');
formData.append('mirror_type', getValue('mirrorType', 'horizontal'));



        try {
        const response = await fetch('/upload', { method: 'POST', body: formData });
        const data = await response.json();
        
        if (response.ok) {
            currentJobId = data.job_id;
            document.getElementById('cancelJobBtn').setAttribute('data-job-id', currentJobId);
            startStatusCheck(currentJobId);
        } else {
            hideProgressModal();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        hideProgressModal();
        alert('Upload failed: ' + error.message);
    }
}

console.log('✅ Script loaded successfully');
