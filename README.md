# 🎬 AI Video Editor Pro - မြန်မာလမ်းညွှန်

AI နည်းပညာသုံး ဗီဒီယိုတည်းဖြတ်ရေး Platform ဖြစ်ပြီး ဗီဒီယိုအကျိုးသက်ရောက်မှုများ၊ မြန်မာစာတမ်းထုတ်ခြင်းနှင့် AI အသံပွားခြင်းတို့ ပါဝင်သည်။

**CI/CD Status: ✅ Working perfectly with correct secret names!**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.11-green)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## 📋 ပထမအဆင့် - လိုအပ်ချက်များ (Prerequisites)

### လိုအပ်သော Tools များ
| Tool | အနည်းဆုံး Version | ရှင်းလင်းချက် |
|------|-------------------|---------------|
| Python | 3.11 | (3.9-3.11 ကြားဖြစ်ရမည်) |
| FFmpeg | Latest | ဗီဒီယို/အသံ Processing အတွက် |
| Git | Latest | Code ကို Clone လုပ်ရန် |
| RAM | 4GB | 8GB ရှိရန် အကြံပြုသည် |
| Disk Space | 10GB | Model များအတွက် |

---

## 🍎 MacBook တွင် တပ်ဆင်နည်း (အဆင့်ဆင့်)

### အဆင့် ၁ - လိုအပ်သော Tools များ Install လုပ်ခြင်း

#### 1.1 Homebrew တပ်ဆင်ခြင်း (မရှိသေးပါက)
```bash
# Terminal ဖွင့်ပြီး အောက်ပါကော်ပီကူးထည့်ပါ
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Homebrew အလုပ်လုပ်မလုပ် စစ်ဆေးခြင်း
brew --version
```

#### 1.2 Python 3.11 တပ်ဆင်ခြင်း
```bash
# Python 3.11 ကို Install လုပ်ခြင်း
brew install python@3.11

# Python Version စစ်ဆေးခြင်း
python3.11 --version
# Python 3.11.x လို့ပြရမည်
```

#### 1.3 FFmpeg တပ်ဆင်ခြင်း (ဗီဒီယို/အသံအတွက်)
```bash
# FFmpeg Install လုပ်ခြင်း
brew install ffmpeg

# FFmpeg အလုပ်လုပ်မလုပ် စစ်ဆေးခြင်း
ffmpeg -version
```

#### 1.4 Git တပ်ဆင်ခြင်း (မရှိသေးပါက)
```bash
# Git Install လုပ်ခြင်း
brew install git

# Git Version စစ်ဆေးခြင်း
git --version
```

#### 1.5 Wget တပ်ဆင်ခြင်း (Download အတွက်)
```bash
brew install wget
```

### အဆင့် ၂ - Project ကို Download လုပ်ခြင်း

#### 2.1 Project Folder ဖန်တီးခြင်း
```bash
# ကိုယ်ထည့်ချင်တဲ့နေရာကိုသွားပါ (Desktop, Documents, etc)
cd ~/Desktop

# Project အတွက် Folder အသစ်ဆောက်ခြင်း
mkdir AI_Video_Editor

cd AI_Video_Editor
```

#### 2.2 GitHub မှ Project ကို Clone လုပ်ခြင်း
```bash
# GitHub repository ကို Clone လုပ်ခြင်း
git clone https://github.com/Hanlinkyaw/aivideo_editor.git .
```

### အဆင့် ၃ - Virtual Environment ဖန်တီးခြင်း

#### 3.1 Virtual Environment ဆောက်ခြင်း
```bash
# Python 3.11 နဲ့ Virtual Environment ဆောက်ခြင်း
python3.11 -m venv venv

# Virtual Environment ထဲဝင်ခြင်း (Activate)
source venv/bin/activate

# အောင်မြင်ရင် (venv) ဆိုပြီး Terminal မှာပေါ်လာမည်
# (venv) yourname@MacBook video_editor_project %
```

#### 3.2 Pip ကို Update လုပ်ခြင်း
```bash
# Virtual Environment ထဲမှာရှိစဉ်
pip install --upgrade pip
```

### အဆင့် ၄ - လိုအပ်သော Packages များ Install လုပ်ခြင်း

#### 4.1 Packages အားလုံး တစ်ခါတည်း Install လုပ်ခြင်း
```bash
# Virtual Environment ထဲမှာရှိစဉ်
pip install -r requirements.txt
```

#### 4.2 Voice Clone အတွက် (Optional - Python 3.9-3.11 လိုအပ်သည်)
```bash
# Virtual Environment ထဲမှာရှိစဉ်
pip install TTS==0.22.0 torch==2.1.0 torchaudio==2.1.0
```

#### 4.3 Packages အားလုံး စစ်ဆေးခြင်း
```bash
# Install ဖြစ်ထားတဲ့ Packages စာရင်းကြည့်ခြင်း
pip list
```

### အဆင့် ၅ - Project Folder Structure ပြင်ဆင်ခြင်း

#### 5.1 လိုအပ်သော Directories များ ဖန်တီးခြင်း
```bash
# Virtual Environment ထဲမှာရှိစဉ်
mkdir -p uploads outputs audio transcripts previews data

# Directories စစ်ဆေးခြင်း
ls -la
```

#### 5.2 Folder Permissions သတ်မှတ်ခြင်း
```bash
# Folder များကို Read/Write ခွင့်ပေးခြင်း
chmod -R 755 uploads outputs audio transcripts previews data
```

### အဆင့် ၆ - Application ကို Run ခြင်း

#### 6.1 Application စတင်ခြင်း
```bash
# Virtual Environment ထဲမှာရှိစဉ်
python app.py

# သို့မဟုတ် start.sh ကိုသုံးပါ
./start.sh
```

Expected output:
```
======================================================================
🎬 AI Video Editor Web App - Complete Edition
======================================================================
📁 Upload folder: .../uploads
📁 Output folder: .../outputs
📁 Audio folder: .../audio
📁 Transcript folder: .../transcripts
🌐 URL: http://localhost:5555
======================================================================
```

#### 6.2 Browser ဖွင့်ခြင်း

Open http://localhost:5555 in your browser.

### အဆင့် ၇ - Testing စစ်ဆေးခြင်း
7.1 Registration လုပ်ခြင်း
Web Page ပေါ်မှာ Register ကိုနှိပ်ပါ

Username, Email, Password ထည့်ပါ

Register နှိပ်ပါ

#### 7.2 Login ဝင်ခြင်း
1. Login ကိုနှိပ်ပါ
2. Username နဲ့ Password ထည့်ပါ
3. Login နှိပ်ပါ

#### 7.3 Video Editor စမ်းခြင်း
1. Video Editor Tab ကိုရွေးပါ
2. Video File တစ်ခု Upload လုပ်ပါ
3. Effects များရွေးချယ်ပါ
4. Process Video နှိပ်ပါ

---

## 🚀 အမိန့်ပေးစာများ အကျဉ်းချုပ် (Quick Commands)

### Virtual Environment သုံးနည်း
```bash
# Virtual Environment ထဲဝင်ရန် (Project လုပ်တိုင်း လုပ်ရမည်)
cd ~/Desktop/video_editor_project
source venv/bin/activate

# Virtual Environment မှထွက်ရန်
deactivate

# Virtual Environment ရှိမရှိစစ်ဆေးရန်
which python
# /Users/.../video_editor_project/venv/bin/python လို့ပြရမည်
```

### App Run နည်း
```bash
# Virtual Environment ထဲမှာရှိစဉ်
python app.py

# သို့မဟုတ် start.sh ကိုသုံးပါ
./start.sh

# နောက်ခံမှာ Run ချင်ရင် (Background)
nohup python app.py &

# နောက်ခံကို ပြန်ကြည့်ချင်ရင်
jobs
```

### Folder Permissions ပြင်နည်း
```bash
# တစ်ခါတည်း အားလုံးကို Permission ပေးခြင်း
chmod -R 755 uploads outputs audio transcripts previews
```

### Port စစ်ဆေးနည်း
```bash
# Port 5555 ကိုဘယ် Process ကသုံးနေလဲကြည့်ခြင်း
lsof -i :5555

# Process ကိုသတ်ချင်ရင်
kill -9 [PID]
```

---

## ❗ အဖြစ်များသော Error များနှင့် ဖြေရှင်းနည်း

### Error 1: ModuleNotFoundError
```
ModuleNotFoundError: No module named 'flask_login'
```
ဖြေရှင်းနည်း:
```bash
which python
pip install -r requirements.txt
```

### Error 2: MoviePy Import Error
```
No module named 'moviepy.editor'
```
ဖြေရှင်းနည်း:
```bash
pip uninstall moviepy -y
pip install moviepy==1.0.3
```

### Error 3: FFmpeg Not Found
```
FFMpeg is not installed
```
ဖြေရှင်းနည်း:
```bash
# Mac
brew install ffmpeg
# Linux
sudo apt install ffmpeg
```

### Error 4: Permission Denied
```
Permission denied: 'uploads/file.mp4'
```
ဖြေရှင်းနည်း:
```bash
chmod -R 755 uploads outputs audio transcripts previews
```

### Error 5: Port Already in Use
```
Address already in use - port 5555
```
ဖြေရှင်းနည်း:
```bash
lsof -i :5555
kill -9 [PID]
```

---

## 📁 Project Folder Structure (ဖိုင်တည်ဆောက်ပုံ)
```
aivideo_editor/
├── app.py                 # Main Application (အဓိက Program)
├── start.sh               # Local dev launcher
├── requirements.txt       # Package စာရင်း
├── Dockerfile             # Docker Config
├── docker-compose.yml     # Docker Compose Config
│
├── static/                # CSS, JS ဖိုင်များ
│   ├── style.css
│   └── script.js
│
├── templates/             # HTML Templates
│   ├── index.html
│   ├── login.html
│   └── register.html
│
├── uploads/               # Video တင်ထားရာနေရာ
├── outputs/               # Video ထွက်လာရာနေရာ
├── audio/                 # အသံဖိုင်များ
├── transcripts/           # စာတမ်းများ
├── previews/              # Preview ပုံများ
│
├── data/                  # Database directory
│   └── users.db           # SQLite database
└── venv/                  # Virtual Environment
```

---

## 🎯 အသုံးပြုနည်း အကျဉ်းချုပ်
1. Terminal ဖွင့်ပါ
2. Project Folder ထဲသွားပါ
3. `./start.sh` ကို Run ပါ (သို့မဟုတ် `source venv/bin/activate && python app.py`)
4. Browser ဖွင့်ပါ: http://localhost:5555
5. အလုပ်ပြီးရင်: `Ctrl+C` နှိပ်ပြီး `deactivate` ရိုက်ပါ

---

## 📞 အကူအညီရယူရန်
- GitHub Issues မှတစ်ဆင့်
- Email ပို့ရန်: hanlinkyaw89@outlook.com
