// ========================================
// AI Video Editor - Complete JavaScript
// Includes: Upload, Progress, Effects, Dark Mode, Cancel Job
// ========================================

// Global variables
let currentJobId = null;
let statusInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded - Initializing...');
    
    // Get elements
    const uploadArea = document.getElementById('uploadArea');
    const videoInput = document.getElementById('videoInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const processBtn = document.getElementById('processBtn');
    
    // Check if elements exist
    if (!uploadArea || !videoInput) {
        console.error('Required elements not found!');
        return;
    }
    
    // ========== UPLOAD AREA HANDLING ==========
    
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
    
    // ========== EFFECT TOGGLES ==========
    
    // Toggle effect options when clicking on header
    document.querySelectorAll('.effect-header').forEach(header => {
        header.addEventListener('click', function(e) {
            // Don't toggle if clicking on checkbox
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
    
    // Blur enabled checkbox
    const blurEnabled = document.getElementById('blurEnabled');
    if (blurEnabled) {
        blurEnabled.addEventListener('change', function() {
            const options = document.getElementById('blurOptions');
            if (options) options.classList.toggle('hidden', !this.checked);
        });
    }
    
    // Glitch enabled checkbox
    const glitchEnabled = document.getElementById('glitchEnabled');
    if (glitchEnabled) {
        glitchEnabled.addEventListener('change', function() {
            const options = document.getElementById('glitchOptions');
            if (options) options.classList.toggle('hidden', !this.checked);
        });
    }
    
    // Old film enabled checkbox
    const oldfilmEnabled = document.getElementById('oldfilmEnabled');
    if (oldfilmEnabled) {
        oldfilmEnabled.addEventListener('change', function() {
            const options = document.getElementById('oldfilmOptions');
            if (options) options.classList.toggle('hidden', !this.checked);
        });
    }
    
    // Speed enabled checkbox
    const speedEnabled = document.getElementById('speedEnabled');
    if (speedEnabled) {
        speedEnabled.addEventListener('change', function() {
            const options = document.getElementById('speedOptions');
            if (options) options.classList.toggle('hidden', !this.checked);
        });
    }
    
    // Noise reduction checkbox
    const noiseReduction = document.getElementById('noiseReduction');
    if (noiseReduction) {
        noiseReduction.addEventListener('change', function() {
            const options = document.getElementById('noiseOptions');
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
    
    // Transition enabled checkbox
    const transitionEnabled = document.getElementById('transitionEnabled');
    if (transitionEnabled) {
        transitionEnabled.addEventListener('change', function() {
            const options = document.getElementById('transitionOptions');
            if (options) options.classList.toggle('hidden', !this.checked);
        });
    }
    
    // Music enabled checkbox
    const musicEnabled = document.getElementById('musicEnabled');
    if (musicEnabled) {
        musicEnabled.addEventListener('change', function() {
            const options = document.getElementById('musicOptions');
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
    
    // Glitch intensity display
    const glitchIntensity = document.getElementById('glitchIntensity');
    const glitchValue = document.getElementById('glitchValue');
    if (glitchIntensity && glitchValue) {
        glitchIntensity.addEventListener('input', function() {
            glitchValue.textContent = this.value;
        });
    }
    
    // Scratch intensity display
    const scratchIntensity = document.getElementById('scratchIntensity');
    const scratchValue = document.getElementById('scratchValue');
    if (scratchIntensity && scratchValue) {
        scratchIntensity.addEventListener('input', function() {
            scratchValue.textContent = this.value;
        });
    }
    
    // Speed factor display
    const speedFactor = document.getElementById('speedFactor');
    const speedValue = document.getElementById('speedValue');
    if (speedFactor && speedValue) {
        speedFactor.addEventListener('input', function() {
            speedValue.textContent = this.value + 'x';
        });
    }
    
    // Noise strength display
    const noiseStrength = document.getElementById('noiseStrength');
    const noiseValue = document.getElementById('noiseValue');
    if (noiseStrength && noiseValue) {
        noiseStrength.addEventListener('input', function() {
            noiseValue.textContent = this.value;
        });
    }
    
    // Text size display
    const textSize = document.getElementById('textSize');
    const textSizeValue = document.getElementById('textSizeValue');
    if (textSize && textSizeValue) {
        textSize.addEventListener('input', function() {
            textSizeValue.textContent = this.value;
        });
    }
    
    // Music volume display
    const musicVolume = document.getElementById('musicVolume');
    const musicVolumeValue = document.getElementById('musicVolumeValue');
    if (musicVolume && musicVolumeValue) {
        musicVolume.addEventListener('input', function() {
            musicVolumeValue.textContent = Math.round(this.value * 100) + '%';
        });
    }
    
    // ========== PROCESS BUTTON ==========
    
    if (processBtn) {
        processBtn.addEventListener('click', uploadVideo);
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
    setInterval(loadJobs, 3000); // Refresh every 3 seconds
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
        }
    } catch (error) {
        console.error('Failed to check login status:', error);
    }
}

async function logout() {
    try {
        const response = await fetch('/logout');
        const data = await response.json();
        if (response.ok) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Logout failed:', error);
    }
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
            
            // Clear status check interval
            if (statusInterval) {
                clearInterval(statusInterval);
                statusInterval = null;
            }
            
            // Hide progress modal
            hideProgressModal();
            
            // Enable buttons
            setButtonsEnabled(true);
            
            // Reload jobs list
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
    const effectCheckboxes = document.querySelectorAll('.effect-header input[type="checkbox"]');
    const settingControls = document.querySelectorAll('.setting-group select, .setting-group input');
    const uploadArea = document.getElementById('uploadArea');
    
    if (processBtn) {
        processBtn.disabled = !enabled;
    }
    
    effectCheckboxes.forEach(checkbox => {
        checkbox.disabled = !enabled;
    });
    
    settingControls.forEach(control => {
        control.disabled = !enabled;
    });
    
    if (uploadArea) {
        if (enabled) {
            uploadArea.style.opacity = '1';
            uploadArea.style.pointerEvents = 'auto';
        } else {
            uploadArea.style.opacity = '0.5';
            uploadArea.style.pointerEvents = 'none';
        }
    }
}

// ========== UPLOAD VIDEO ==========

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
    
    // Show progress modal
    showProgressModal();
    
    // Create form data
    const formData = new FormData();
    formData.append('video', file);
    
    // Get all form values safely
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
        console.log('Sending fetch request to /upload');
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            currentJobId = data.job_id;
            
            // Store job ID in cancel button
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

// ========== PROGRESS MODAL FUNCTIONS ==========

function showProgressModal() {
    console.log('Showing progress modal');
    const modal = document.getElementById('progressModal');
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    const status = document.getElementById('progressStatus');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelJobBtn');
    
    if (modal) {
        modal.classList.remove('hidden');
        if (fill) fill.style.width = '0%';
        if (text) text.textContent = '0%';
        if (status) status.textContent = 'Processing...';
        if (closeBtn) closeBtn.classList.add('hidden');
        if (cancelBtn) {
            cancelBtn.classList.remove('hidden');
            cancelBtn.disabled = false;
        }
        
        // Disable buttons during processing
        setButtonsEnabled(false);
    } else {
        console.error('Progress modal not found');
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
    
    // Enable buttons
    setButtonsEnabled(true);
    
    // Clear status check interval
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
                
                // Enable buttons
                setButtonsEnabled(true);
                
                loadJobs();
                
                // Show preview and download options
                if (data.preview_url) {
                    setTimeout(() => {
                        if (confirm('Video completed! Would you like to preview it?')) {
                            window.open(data.preview_url, '_blank');
                        }
                    }, 500);
                } else if (data.output_url) {
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
                
                // Enable buttons
                setButtonsEnabled(true);
            } else if (data.status === 'cancelled') {
                console.log('Job cancelled');
                clearInterval(statusInterval);
                document.getElementById('progressStatus').textContent = 'Cancelled';
                document.getElementById('closeModalBtn').classList.remove('hidden');
                document.getElementById('cancelJobBtn').classList.add('hidden');
                
                // Enable buttons
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
