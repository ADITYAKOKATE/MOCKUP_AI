# Exam Mentor AI 🎓

**Exam Mentor AI** is an advanced, AI-powered exam preparation platform designed to help students excel in competitive exams like **GATE, JEE, and NEET**. 

The platform combines a robust examination engine with personalized **AI insights**, detailed performance analytics, and a seamless user experience to identify weak areas and improve learning outcomes.

## 🚀 Key Features

### 👨‍🎓 For Students
- **Smart Dashboard**: Real-time view of performance trends, recent activity, and AI-recommended actions.
- **Comprehensive Test Engine**: 
  - Full-screen, secure test interface mimicking real exam environments.
  - Support for multiple question types (MCQ, NAT, MSQ).
  - Subject-wise, Topic-wise, and Full-length Mock Tests.
- **AI Personal Tutor 🤖**: 
  - **Instant Feedback**: Get personalized, encouraging explanations for why an answer was wrong or right.
  - **Logic Gap Analysis**: AI identifies if you rushed, guessed, or misunderstood a concept.
- **Performance Analytics**: 
  - Deep dive into strong vs. weak topics.
  - Time management analysis.
  - Comparative stats with peer averages.

### 👨‍🏫 For Admins
- **Question Management**: Bulk upload questions via Excel/CSV or manual entry.
- **User Management**: Manage student profiles and access.
- **Analytics & Reports**: View aggregate data on student performance and system usage.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **Visualization**: Recharts (for performance graphs)
- **Math Rendering**: KaTeX (for formulas)
- **HTTP Client**: Axios & Fetch API

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Authentication**: JWT & Bcrypt
- **File Handling**: Multer (Uploads)

### AI Microservice 🧠
- **Framework**: FastAPI (Python)
- **Model**: GPT4All (Phi-3 Mini 4k Instruct)
- **Functionality**: Local LLM inference for question analysis and generation.

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)
- **MongoDB** (Local or Atlas URL)

### 1. Clone the Repository
```bash
git clone https://github.com/ADITYAKOKATE/ExamMentorAi.git
cd ExamMentorAi
```

### 2. Backend Setup
The backend handles API requests and database interactions.

```bash
cd backend

# Install Node dependencies
npm install

# Install Python dependencies for AI/Data scripts
pip install -r requirements.txt
```

#### Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/exam_mentor_ai
DB_NAME=exam_mentor_ai
JWT_SECRET=your_super_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### 3. AI Service Setup
The AI service runs as a separate Python process (FastAPI).

```bash
# Inside /backend directory

# Download the LLM model (Phi-3-mini)
# This will download the model to backend/llmModel/
npm run model:download
```

### 4. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install
```

> **Note**: The frontend currently points to `http://localhost:5000/api` by default. Ensure your backend is running on port 5000.

---

## 🏃‍♂️ Running the Application

You need to run the Backend, AI Service, and Frontend simultaneously.

### Terminal 1: Backend
```bash
cd backend
npm start
# OR for development
npm run dev
```

### Terminal 2: AI Service
```bash
cd backend
python ai_service.py
# Runs on http://localhost:5001
```

### Terminal 3: Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## 📂 Project Structure

```
ExamMentorAi/
├── backend/
│   ├── controllers/      # Logic for API endpoints
│   ├── models/           # Mongoose schemas (User, Question, Attempt)
│   ├── routes/           # API Routes definitions
│   ├── scripts/          # Python scripts for data import (GATE/JEE questions)
│   ├── ai_service.py     # FastAPI Server for AI Logic
│   └── server.js         # Entry point for Node backend
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Main application pages (Dashboard, Test, Auth)
│   │   ├── services/     # API service connectors
│   │   └── context/      # React Context (Auth State)
│   └── vite.config.js    # Vite configuration
│
└── README.md
```

## 🧪 Data Import Scripts
The project includes powerful scripts to seed your database with exam questions.

```bash
cd backend
# Example: Import GATE CSE questions
npm run import:gate-cse

# Example: Import JEE Main questions
npm run import:jee-main
```

## 🤝 Contribution
Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License
This project is licensed under the ISC License.