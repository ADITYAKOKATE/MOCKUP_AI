<h1 align="center">
  <img src="https://img.shields.io/badge/MockUp-AI-6366f1?style=for-the-badge&logoColor=white" alt="MockUp AI"/>
</h1>

<p align="center"><strong>Strive to conquer.</strong></p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/MERN%20Stack-Full%20Stack-61DAFB?style=flat-square&logo=react" /></a>
  <a href="#"><img src="https://img.shields.io/badge/AI-Phi--3%20Mini%20%7C%20YOLOv8-009688?style=flat-square&logo=python" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Exams-GATE%20%7C%20JEE%20%7C%20NEET-f59e0b?style=flat-square" /></a>
  <a href="#"><img src="https://img.shields.io/badge/License-ISC-6366f1?style=flat-square" /></a>
  <a href="https://github.com/ADITYAKOKATE/MOCKUP_AI/pulls"><img src="https://img.shields.io/badge/PRs-Welcome-22c55e?style=flat-square" /></a>
</p>

---

## 🔴 Problem Statement

> *"Competitive exam preparation today is highly data-driven, yet most students are unable to effectively use the data generated from mock tests and practice exams. Scores, ranks, and percentiles alone do not explain **why** a student is underperforming or **what** actions will lead to meaningful improvement."*

Students who give 50+ mock tests still struggle because:
- Raw scores give no **actionable direction** — they say you failed, not *why* or *where*.
- Topic-level weakness is invisible in aggregate percentiles.
- There is no system that **adapts** the next test based on what you got wrong.
- No way to detect **cheating patterns** in self-administered practice tests.
- The gap between "practicing more" and "practicing smarter" is never bridged.

---

## 💡 Proposed Solution — MockUp AI

**MockUp AI** is an AI-powered learning and productivity platform designed to bridge this gap. It transforms raw exam and mock test data into **personalized, actionable insights** that help students learn faster, study smarter, and become exam-ready with confidence.

By combining intelligent analytics, adaptive learning paths, and real-time exam simulation, the platform acts as a **virtual mentor** that continuously understands a student's strengths, weaknesses, and learning behaviour.

As more data is generated, the system evolves — refining recommendations, detecting performance decay, auto-generating targeted questions, and optimizing study effort for maximum score improvement.

<p align="center">
  <img src="frontend/public/Screenshot 2026-02-21 172437.png" alt="MockUp AI — Dashboard" width="100%" style="border-radius:12px"/>
</p>



---

<div align="center">

## 🎬 Project Resources

<table>
  <tr>
    <td align="center" width="50%">
      <a href="https://github.com/ADITYAKOKATE/MOCKUP_AI/blob/main/frontend/public/MOCKUP%20AI.pdf">
        <img src="https://img.shields.io/badge/📄%20View%20Presentation-PDF-FF6B6B?style=for-the-badge&logoColor=white" alt="View PDF Presentation"/>
      </a>
      <br/>
      <sub><b>Full project slides & documentation</b></sub>
    </td>
    <td align="center" width="50%">
      <a href="YOUR_YOUTUBE_LINK_HERE">
        <img src="https://img.shields.io/badge/🎬%20Live%20Demo-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Live Demo"/>
      </a>
      <br/>
      <sub><b>Watch the full live demonstration</b></sub>
    </td>
  </tr>
</table>

</div>

---

## 🧠 How It Actually Works — System Deep Dive

### 1. Strength Score Algorithm
After every test submission, the platform runs a **Bayesian Weighted Strength Algorithm** on each topic and subject:

```
Strength = (Prior × Weight + CurrentScore × Attempts) / (Weight + Attempts)

Where CurrentScore = (Accuracy × 0.60) + (Speed × 0.25) + (Consistency × 0.15)
```

| Component | Weight | Logic |
|---|---|---|
| **Accuracy** | 60% | Correct / Attempted × 100 |
| **Speed** | 25% | Penalty if avg time > expected; speed only rewarded if accuracy is also high |
| **Consistency** | 15% | Based on total attempts — rewards habitual practice |
| **Bayesian Prior** | Damped | New users start at strength=100 and decay as they attempt questions |

A topic is classified as:
- 🟢 **Strong** — Strength ≥ 75
- 🟡 **Weak** — Strength 40–74
- 🔴 **Critical** — Strength < 40
- ⚪ **Not Attempted** — No attempts

---

### 2. AI Proctoring Engine

The proctoring system runs two parallel computer-vision models during every test session:

```
Webcam Frame (base64)
        │
        ▼
┌───────────────────────────────┐
│  YOLOv8n (Object Detection)   │  ← Detects: cell phone (class 67, conf > 0.40)
│       yolov8n.pt              │
└────────────┬──────────────────┘
             │ If clean →
             ▼
┌───────────────────────────────┐
│  OpenCV Haar Cascade          │  ← Detects: no face / multiple faces
│  haarcascade_frontalface      │
└────────────┬──────────────────┘
             │ If face found →
             ▼
┌───────────────────────────────┐
│  Baseline Comparison          │  ← Calibrated at test start
│  Position shift > 50px        │  ← HIGH_MOVEMENT
│  Size ratio < 0.6 or > 1.6   │  ← LEANING_BACK / LEANING_FORWARD
└───────────────────────────────┘
```

**Violation types detected:** `E_DEVICE_DETECTED` · `NO_FACE` · `MULTIPLE_FACES` · `HIGH_MOVEMENT` · `LEANING_BACK` · `TAB_SWITCH`

Each violation is **timestamped**, **photographed** (screenshot saved to `/uploads/evidence/`), and logged to the `TestSession.proctoringLogs` array. After **5 cumulative warnings**, the session is **auto-terminated** and the attempt is saved as `status: "terminated"`.

---

### 3. Luna AI — On-Device LLM Tutor

Luna is powered by **GPT4All + Phi-3 Mini 4k Instruct** running 100% locally with no internet required.

**Capabilities:**

| Endpoint | What it does |
|---|---|
| `POST /explain` | Generates a personalised explanation for why a specific answer was right/wrong, comparing user's answer vs. correct answer |
| `POST /generate-questions` | Uses few-shot prompting with 2 real examples from the DB to generate new MCQ questions in JSON format for a topic |

**Auto Question Generation Flow:**
```
Test Submitted
     │
     ▼
Performance.updatePerformance() runs
     │
     ▼
calculateStrength() → detects strength DROP
     │  (strength < 100 AND strength decreasing)
     ▼
QuestionGenerator.generateForTopic()
     │
     ▼
FastAPI /generate-questions called with:
  - subject, topic, difficulty, exam_type
  - 2 example questions from same topic (few-shot)
     │
     ▼
Phi-3 Mini generates 3 new MCQ questions
     │
     ▼
Questions saved to DB with isAiGenerated: true, generatedFor: userId
     │
     ▼
Appear in next Topic Test for that user
```

---

### 4. Test Engine — 6 Modes

| Mode | Questions | Duration | Logic |
|---|---|---|---|
| **Full Mock Test** | Per exam pattern | Exam-exact (e.g. 180 min) | Fetches questions per `ExamPattern` schema with subject-wise quotas |
| **Subject Wise** | 20 | 60 min | Distributes evenly across all topics in the chosen subject |
| **Topic-wise Test** | Up to 30 | 25 min | Fetches from DB filtered by topic regex + AI-generated questions |
| **Custom Drill** | Custom | Custom | User defines subject mix and limits |
| **Revision Test** | From weak history | Variable | High-importance questions from past wrong answers |
| **AI Recommended** | 20–30 | 25–45 min | Built from `Performance.getWeakTopics()` sorted by `lastStrengthDrop` and weakness score |

---

### 5. Performance Analytics Engine

Every submission triggers `Performance.updatePerformance()` which updates a **nested Map-of-Maps** structure in MongoDB:

```
Performance (one document per user)
├── userId
└── exams (Map)
    └── "JEE Main" → ExamData
        ├── globalStats        { totalAttempted, totalCorrect, totalWrong, totalTime, averageAccuracy }
        ├── questionStats      Map<questionId, { status, attemptsCount, lastTimeTaken }>
        ├── subjectStats       Map<subjectName, StatsObject + strength>
        ├── topicStats         Map<topicName,   StatsObject + strength + lastStrengthDrop>
        ├── difficultyStats    Map<"Low"|"Medium"|"High", StatsObject>
        └── importanceStats    Map<"1"..."10", StatsObject>
```

The frontend `Analysis` page renders:
- **Subject Comparison Radar Chart** — using Recharts `RadarChart` component
- **Per-Topic Cards** — classified as Weak / Critical / Not Attempted with colour coding
- **Time analysis** — avg time per question per topic
- **Correct / Wrong / Unattempted** breakdown per category

---

## 📸 Platform Screenshots

### Dashboard — Real-Time Performance Command Center
<img src="frontend/public/Screenshot 2026-02-21 172437.png" alt="Dashboard" width="100%"/>

> **4 live KPI cards**: Total Tests · Average Score · Accuracy · Study Time. Below: last test performance card (gradient banner), Study Streak, and AI-recommended next actions.

---

### Mock Tests — 6 Practice Modes
<img src="frontend/public/Screenshot 2026-02-21 172459.png" alt="Mock Tests" width="100%"/>

> Choose from **Full Test** (real exam simulation), **Subject Wise**, **Topic-wise**, **Custom Drill**, **Revision Test**, and **AI Recommended**. Each card shows type, description, and a direct start link.

---

### My Tests — Complete Attempt History
<img src="frontend/public/Screenshot 2026-02-21 172518.png" alt="My Tests" width="100%"/>

> Every attempt is logged: score, time taken, accuracy %. Sessions flagged and auto-terminated by the proctoring engine appear with a bold **TERMINATED** badge and show the number of violations logged.

---

### Analysis — Radar-Level Subject Intelligence
<img src="frontend/public/Screenshot 2026-02-21 172629.png" alt="Analysis" width="100%"/>

> **Subject Comparison radar chart** for all GATE-CS subjects. Per-topic cards below show attempted count, accuracy %, correct/wrong split, avg time, and strength level (Weak / Critical / Not Attempted).

---

### Secure Test Interface — Full Exam Simulation
<img src="frontend/public/Screenshot 2026-02-21 172712.png" alt="Test Interface" width="100%"/>

> Full-screen interface with countdown timer, question palette for navigation, MCQ/NAT/MSQ support, **live proctoring webcam feed** (top-right), flag-for-review, and Submit/Quit controls.

---

### Proctoring Integrity Report — Zero Tolerance
<img src="frontend/public/Screenshot 2026-02-21 172804.png" alt="Proctoring Report" width="100%"/>

> After a flagged session, a detailed **Integrity Report** is generated. Each violation (phone detected, no face, etc.) shows the captured screenshot, violation type, and exact timestamp. **"Action Required"** banner at the top when session was terminated.

---

### Luna AI — Personal Exam Mentor
<img src="frontend/public/Screenshot 2026-02-21 173332.png" alt="Luna AI" width="100%"/>

> **Luna** (Phi-3 Mini, runs 100% locally) provides instant chat-based tutoring. Push-to-talk voice mode included. Conversation history is stored per user. Ask Luna to explain a concept, break down a wrong answer, or quiz you on a topic.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      React Frontend                         │
│     Vite · Tailwind CSS · Recharts · KaTeX · Axios         │
│     Dashboard · Tests · Analysis · Luna · Admin             │
└───────────────────────┬────────────────────────────────────┘
                        │  REST/JSON  (Port 5000)
┌───────────────────────▼────────────────────────────────────┐
│              Node.js + Express  API Server                  │
│  JWT Auth · Mongoose · Multer · Cloudinary · QuestionGen   │
│  /api/auth  /api/test  /api/ai  /api/analysis  /api/dash   │
└──────────────┬────────────────────────┬────────────────────┘
               │                        │  HTTP  (Port 5001)
┌──────────────▼──────────┐  ┌──────────▼──────────────────┐
│  MongoDB Database        │  │  FastAPI AI Microservice     │
│  Users · Questions       │  │  Phi-3 Mini 4k (GPT4All)    │
│  Attempts · TestSessions │  │  YOLOv8n (Object Detection) │
│  Performances · Patterns │  │  OpenCV (Face Detection)     │
└──────────────────────────┘  └──────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React + Vite | 18 |
| **Styling** | Tailwind CSS | 3 |
| **Charts** | Recharts | Latest |
| **Math Rendering** | KaTeX | Latest |
| **HTTP Client** | Axios | Latest |
| **Backend** | Node.js + Express.js | 18+ |
| **Database** | MongoDB + Mongoose | 7+ |
| **Auth** | JWT + Bcrypt | — |
| **File Storage** | Multer + Cloudinary | — |
| **AI LLM** | GPT4All + Phi-3 Mini 4k Instruct | Q4_0 GGUF |
| **Object Detection** | YOLOv8n (Ultralytics) | v8 |
| **Face Detection** | OpenCV Haar Cascade | cv2 |
| **AI Framework** | FastAPI + Uvicorn | — |

---

## 📂 Project Structure

```
ExamMentorAi/
│
├── backend/
│   ├── controllers/
│   │   ├── test.controller.js       # All 6 test modes + session management + submission
│   │   ├── ai.controller.js         # AI recommendations + question explanation
│   │   ├── analysis.controller.js   # Radar charts + topic breakdowns
│   │   ├── dashboard.controller.js  # KPI aggregation + streak tracking
│   │   ├── auth.controller.js       # JWT login/register + performance init
│   │   └── question.controller.js   # Admin CRUD + bulk import
│   │
│   ├── models/
│   │   ├── Performance.js           # Bayesian strength algorithm, Map-of-Maps schema
│   │   ├── Attempt.js               # Per-test results + proctoring logs
│   │   ├── TestSession.js           # Live session state + violation tracking
│   │   ├── Question.js              # MCQ/NAT/MSQ schema + isAiGenerated flag
│   │   ├── ExamPattern.js           # Exam structure (duration, marks, sections)
│   │   ├── User.js                  # Auth credentials
│   │   └── UserProfile.js           # Extended profile data
│   │
│   ├── routes/                      # Express routers (auth, test, ai, analysis, etc.)
│   ├── services/
│   │   └── QuestionGenerator.js     # Triggers AI question generation on strength drop
│   ├── utils/
│   │   └── constants.js             # Exam structures, GATE/JEE/NEET subject-topic maps
│   ├── scripts/                     # Python data-import scripts (CSV → MongoDB)
│   ├── ai_service.py                # FastAPI: Luna chat, question gen, YOLOv8, OpenCV
│   ├── yolov8n.pt                   # YOLOv8 nano weights (~6.5 MB)
│   ├── llmModel/                    # Phi-3 Mini GGUF weights (~2 GB, downloaded separately)
│   └── server.js                    # Express entry point
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── dashboard/           # Dashboard KPIs, streak, last-test card
│       │   ├── tests/               # All test modes UI, test interface, results, review
│       │   ├── analysis/            # Radar chart, subject/topic breakdown cards
│       │   ├── aiInsights/          # Luna AI chat interface
│       │   ├── auth/                # Login, Register
│       │   └── settings/            # User profile settings
│       ├── layouts/
│       │   └── Sidebar.jsx          # Navigation sidebar with exam switcher
│       ├── hooks/
│       │   └── useProctoring.js     # Webcam init, frame capture, violation detection loop
│       ├── components/              # Shared: modals, charts, buttons, skeletons
│       ├── services/                # Axios API wrappers for each route group
│       └── context/                 # AuthContext — JWT storage + user state
│
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites

| Tool | Required Version |
|---|---|
| Node.js | v18+ |
| Python | v3.9+ |
| MongoDB | 6+ (local or Atlas) |

---

### Step 1 — Clone

```bash
git clone https://github.com/ADITYAKOKATE/MOCKUP_AI.git
cd MOCKUP_AI
```

### Step 2 — Backend Setup

```bash
cd backend

# Node.js dependencies
npm install

# Python dependencies (FastAPI, GPT4All, OpenCV, Ultralytics)
pip install -r requirements.txt
```

#### 🔑 Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/exam_mentor_ai
DB_NAME=exam_mentor_ai
JWT_SECRET=replace_with_a_strong_secret_min_32_chars

# Cloudinary — for proctoring evidence screenshots
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 3 — Download AI Model *(one-time · ~2 GB)*

```bash
# Inside /backend
npm run model:download
# Downloads Phi-3-mini-4k-instruct.Q4_0.gguf → backend/llmModel/
```

> The YOLOv8n weights (`yolov8n.pt`, ~6.5 MB) are already included in the repo.

### Step 4 — Frontend Setup

```bash
cd ../frontend
npm install
```

> Frontend connects to `http://localhost:5000/api` by default.

---

## 🚀 Running the Application

You need **3 terminals** running simultaneously:

```bash
# Terminal 1 — Node.js API
cd backend && npm run dev
# Runs on → http://localhost:5000

# Terminal 2 — AI Microservice (Luna + Proctoring)
cd backend && python ai_service.py
# Runs on → http://localhost:5001
# First startup takes ~30s to load Phi-3 Mini into RAM

# Terminal 3 — React Frontend
cd frontend && npm run dev
# Runs on → http://localhost:5173
```

Open **`http://localhost:5173`**, register an account, and select your exam (JEE Main / GATE CS / NEET).

---

## 🌱 Seeding the Database

Bulk-import official past-year questions from CSV:

```bash
cd backend

npm run import:gate-cse     # GATE Computer Science questions
npm run import:jee-main     # JEE Main questions
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register + initialize Performance schema |
| `POST` | `/api/auth/login` | JWT login |
| `POST` | `/api/test/start-full-test` | Start a full mock test |
| `POST` | `/api/test/start-subject-test` | Start a subject-wise test |
| `POST` | `/api/test/start-topic-test` | Start a topic-wise test |
| `POST` | `/api/test/session/:id/response` | Save answer (auto-persisted) |
| `POST` | `/api/test/session/:id/log-violation` | Log proctoring violation + save screenshot |
| `POST` | `/api/test/session/:id/submit` | Submit test + trigger performance update |
| `GET`  | `/api/ai/recommendations` | Get AI-recommended tests from weak topics |
| `POST` | `/api/ai/explain-question` | Get Luna's explanation for a question |
| `GET`  | `/api/analysis` | Get full performance radar + breakdown |
| `GET`  | `/api/dashboard` | Get KPI stats for current exam |

---

## 🗺️ Roadmap

- [ ] Voice-based answer input (speech-to-text)
- [ ] Adaptive difficulty using Reinforcement Learning
- [ ] Mobile PWA for offline revision
- [ ] Multi-language question support
- [ ] Peer leaderboard and gamification
- [ ] Predicted rank / percentile estimation

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "feat: describe your change"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## � Team — NightShades

| Role | Name |
|---|---|
| 👑 **Team Leader** | Aditya Kokate |
| 🧑‍💻 Member | Prathmesh Bhoir |
| 🧑‍💻 Member | Ojas Patil |
| 🧑‍💻 Member | Sawli Sangale |
| 🧑‍💻 Member | Kiran Padwal |



## �📄 License

ISC © [Aditya Kokate](https://github.com/ADITYAKOKATE/MOCKUP_AI)

---

<p align="center">
  If MockUp AI helped you prepare smarter, please ⭐ the repo!<br/>
  <a href="https://github.com/ADITYAKOKATE/MOCKUP_AI">github.com/ADITYAKOKATE/MOCKUP_AI</a>
</p>
