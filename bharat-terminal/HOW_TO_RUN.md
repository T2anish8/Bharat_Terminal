# 🇮🇳 HOW TO RUN BHARAT TERMINAL
### Complete Step-by-Step Guide (Windows)

---

## WHAT YOU NEED INSTALLED FIRST

Before anything, make sure these are installed on your PC:

| Tool | Check if installed | Download |
|------|-------------------|----------|
| Python 3.10+ | Open CMD → type `python --version` | python.org |
| Node.js 18+ | Open CMD → type `node --version` | nodejs.org |
| pip | Open CMD → type `pip --version` | comes with Python |

---

## STEP 1 — Extract the ZIP

Extract `bharat-terminal-FIXED.zip` anywhere, for example:
```
C:\Users\YourName\Desktop\bharat-terminal\
```

You should see these folders inside:
```
bharat-terminal/
├── backend/        ← Python FastAPI server
├── frontend/       ← React UI
├── START_BACKEND.bat
└── START_FRONTEND.bat
```

---

## STEP 2 — Start the Backend (Python server)

**Open Command Prompt (CMD)** and run these commands ONE BY ONE:

```cmd
cd C:\Users\YourName\Desktop\bharat-terminal\backend
```

Then install all Python packages:
```cmd
pip install -r requirements.txt
```
⏳ This takes 2-5 minutes. Wait for it to finish.

Then start the server:
```cmd
uvicorn main:app --reload --port 8000
```

✅ You will see this when it works:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

🚨 KEEP THIS WINDOW OPEN. Do NOT close it.

---

## STEP 3 — Start the Frontend (React UI)

**Open a NEW Command Prompt window** and run:

```cmd
cd C:\Users\YourName\Desktop\bharat-terminal\frontend
```

Install Node packages (first time only):
```cmd
npm install
```
⏳ Takes 1-2 minutes.

Then start the UI:
```cmd
npm run dev
```

✅ You will see:
```
  VITE v5.x.x  ready

  ➜  Local:   http://localhost:5173/
```

---

## STEP 4 — Open in Browser

Open your browser and go to:
```
http://localhost:5173
```

You should see the terminal with live data loading.

---

## QUICK CHECK — Is everything working?

Open these URLs in your browser to verify:

| URL | What you should see |
|-----|-------------------|
| http://localhost:8000 | `{"app":"Bharat Terminal","status":"running"}` |
| http://localhost:8000/docs | FastAPI interactive docs page |
| http://localhost:8000/api/market/status | Market open/closed status |
| http://localhost:5173 | The full terminal UI |

---

## COMMON ERRORS & FIXES

### ❌ "python is not recognized"
→ Python not installed. Download from python.org
→ During install, CHECK ✅ "Add Python to PATH"

### ❌ "pip is not recognized"
```cmd
python -m pip install -r requirements.txt
```

### ❌ "uvicorn is not recognized"
```cmd
pip install uvicorn
```
Then try again.

### ❌ "npm is not recognized"
→ Node.js not installed. Download from nodejs.org

### ❌ Chart shows blank / price shows ₹0.00
→ Backend is not running. Go to Step 2.
→ Check http://localhost:8000 in browser — should show JSON.

### ❌ "ModuleNotFoundError: No module named 'fastapi'"
```cmd
pip install fastapi uvicorn yfinance pandas numpy scikit-learn textblob vaderSentiment cachetools pytz feedparser beautifulsoup4
```

### ❌ Port already in use
```cmd
uvicorn main:app --reload --port 8001
```
Then in frontend/src/store/useStore.js change API port to 8001.

---

## SHORTCUT — Just double-click!

Instead of typing commands, you can:
1. Double-click `START_BACKEND.bat` → installs + starts backend
2. Double-click `START_FRONTEND.bat` → installs + starts frontend
3. Open http://localhost:5173

---

## BOTH WINDOWS MUST STAY OPEN

```
┌─────────────────────────┐   ┌─────────────────────────┐
│  CMD Window 1           │   │  CMD Window 2           │
│  (Backend - Python)     │   │  (Frontend - Node)      │
│                         │   │                         │
│  uvicorn main:app       │   │  npm run dev            │
│  running on port 8000   │   │  running on port 5173   │
│                         │   │                         │
│  🚨 KEEP OPEN           │   │  🚨 KEEP OPEN           │
└─────────────────────────┘   └─────────────────────────┘
         ↓                              ↓
    http://localhost:8000       http://localhost:5173
    (API, not for viewing)      (Open this in browser)
```
