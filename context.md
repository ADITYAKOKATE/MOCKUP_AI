# mockup – AI‑Driven Exam Performance Analytics Platform
> **File name:** `context.md`

---

## ⚠️ IMPORTANT ENGINEERING INSTRUCTIONS (READ FIRST)

This project **must be modular**, **scalable**, and **maintainable**.

### 🚨 Mandatory Rules (NON‑NEGOTIABLE)

1. Follow **DRY (Don’t Repeat Yourself)** principles strictly  
2. Keep **logic, UI, and data layers separated**  
3. No hard‑coding of exam, branch, subjects, or rules  
4. Everything must be **config‑driven and reusable**  
5. Do **NOT** introduce extra packages for:
   - UI icons → **lucide-react only**
   - Styling → **Tailwind CSS only**
   - Routing → **react-router-dom only**
6. **❗ DO NOT ADD ANY KIND OF MOCK / DUMMY / HARDCODED DATA**
   - No fake users
   - No fake test results
   - No static analysis numbers
   - No placeholder AI output  
   👉 Every value shown in the UI **must come from real user attempts and real backend computation**

Any violation of these rules must be rejected.

---

## 🧠 Project Overview

**mockup** is an AI‑driven exam performance analytics platform focused on **post‑test intelligence**, not just test‑taking.

### Core Idea
> We don’t help students *take* tests.  
> We help them *understand* their performance, *fix weaknesses*, and *prove improvement over time*.

The system:
- Captures question‑level behavior
- Analyzes real performance patterns
- Generates adaptive recommendations
- Adjusts future tests based on actual learning trends

---

## 🧩 Tech Stack (LOCKED)

### Frontend
- React
- Tailwind CSS
- react-router-dom
- lucide-react

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

⚠️ No additional libraries for UI, routing, icons, styling, or charts are allowed.

---

## 📄 Main Application Pages (ONLY 4)

### 1️⃣ Dashboard
**Purpose:** High‑level intelligence & entry point

**Shows (REAL DATA ONLY):**
- Last test score
- Weakest subjects/topics
- Accuracy & time trend
- CTA: **Start Recommended Test**

This page answers:  
> “How am I actually doing right now?”

---

### 2️⃣ Tests
**Purpose:** Controlled test execution & data generation

This page supports **four test types**:

#### ✅ Test Types

1. **Full Test**
   - Simulates a complete exam (e.g., GATE‑like paper)
   - Covers all subjects of the selected paper
   - Used to identify global strengths and weaknesses

2. **Subject Test**
   - Questions from **one selected subject only**
   - Used for focused practice after analysis

3. **AI‑Recommended Test**
   - Generated **only by the AI engine**
   - Based on:
     - Weak subjects/topics
     - Confidence score
     - Past improvement trends
   - User has **no manual control** over configuration

4. **Random Test**
   - User selects **number of questions**
   - Questions are randomly picked from the current paper
   - Still fully tracked and analyzed by the system

#### Test UI Rules
- One question at a time
- Timer per question
- Minimal navigation
- No sections UI
- No review panel
- No unnecessary configuration screens

This page exists **only to generate real behavioral data**.

---

### 3️⃣ Analysis
**Purpose:** Explain *why* performance happened

**Shows (computed, not mocked):**
- Subject‑wise accuracy
- Average time per question
- Mistake types (conceptual, careless, speed, guess)
- Confidence score per subject

This page answers:  
> “Why did I perform this way?”

---

### 4️⃣ AI Insights
**Purpose:** Show intelligence & learning

**Shows (derived from history):**
- Personalized recommendations
- Priority actions (High / Medium / Low)
- Suggested next test type (Full / Subject / AI‑Recommended)
- Improvement comparison across attempts

This page proves:
> “The system learns from real attempts and adapts.”

---

## 🧠 AI Philosophy (IMPORTANT CONTEXT)

This project **does NOT use heavy ML models**.

### What “AI” means here
- Rule‑based adaptive intelligence
- Statistical pattern analysis
- Historical performance comparison
- Dynamic recommendation updates

### What is NOT allowed
- Fake AI responses
- Static recommendation text
- Pre‑filled confidence scores
- Random numbers disguised as intelligence

All AI output **must be computed from stored attempts**.

---

## 🔁 Core Application Flow

Select Exam / Paper
→ Choose Test Type
→ Take Test
→ Store Question Attempts
→ Run AI Analysis
→ Generate Insights
→ Recommend Next Test
→ Retest
→ Prove Improvement

yaml
Copy code

If data is missing, the UI must show **empty / zero states**, not fake content.

---

## 🗂️ Folder Structure (MODULAR)

### Frontend
src/
├── app/
│ ├── App.jsx
│ ├── routes.jsx
│
├── pages/
│ ├── Dashboard/
│ ├── Tests/
│ ├── Analysis/
│ └── AIInsights/
│
├── components/
│ ├── common/
│ ├── charts/
│ └── layout/
│
├── services/
│ ├── api.js
│
├── hooks/
├── utils/
└── styles/

shell
Copy code

### Backend
backend/
├── controllers/
├── services/
│ └── ai/
│ ├── analyzePerformance.js
│ ├── computeConfidence.js
│ ├── generateRecommendations.js
│ └── runAIPipeline.js
│
├── models/
├── routes/
├── utils/
└── config/

yaml
Copy code

---

## 🧱 Modularity Guidelines

- **Pages** → layout + orchestration only
- **Components** → reusable, stateless where possible
- **Services** → business logic & API calls
- **AI logic** → ONLY inside `/services/ai`
- **No cross‑layer coupling**
- **No UI‑level calculations**

---

## 🚫 What mockup Is NOT

- Not just a mock‑test app
- Not an exam conduction engine
- Not a chatbot
- Not a leaderboard app
- Not a demo with fake numbers

Anything that **looks intelligent but isn’t data‑backed** must be removed.

---

## 🏆 Judge‑Ready Summary

> **mockup** is a post‑test intelligence system that analyzes real question‑level behavior, supports multiple test modes, generates adaptive recommendations, and proves improvement over time using explainable AI logic — without fake data.

---

## ✅ Final Reminder

- No mock data
- No shortcuts
- No fake intelligence
- Modularity over speed

This `context.md` file is the **single source of truth** for development and judging.