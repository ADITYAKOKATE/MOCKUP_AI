# Personalized Performance Schema System - Documentation

## Overview
This system automatically creates and manages personalized performance tracking schemas for each exam a user selects. It tracks performance across all subjects and topics, calculates strength scores, and provides AI-ready recommendations for weak areas.

## Architecture

### 1. Exam Structure Configuration
**File**: `backend/config/examStructure.js`

Defines the complete hierarchy of subjects and topics for each exam:
- **JEE Main**: Physics, Chemistry, Mathematics (23-27 topics each)
- **JEE Advanced**: Physics, Chemistry, Mathematics (12-23 topics each)
- **NEET**: Physics, Chemistry, Biology (19 topics each)
- **GATE CSE**: 10 subjects (Engineering Math, Algorithms, OS, etc.)
- **GATE ECE**: 9 subjects (Networks, Signals, Communications, etc.)

### 2. Performance Model Enhancements
**File**: `backend/models/Performance.js`

#### New Static Methods:

**`initializeExamPerformance(userId, examName)`**
- Automatically creates performance schema when user selects an exam
- Pre-populates all subjects and topics with initial zero values
- Initializes difficulty and importance stats
- Called during signup and profile updates

**`calculateStrength(stats, expectedAvgTime)`**
- Returns strength score (0-100) based on:
  - **Accuracy** (60 points): Correct/Total × 100
  - **Speed** (25 points): Time efficiency compared to expected
  - **Consistency** (15 points): Number of attempts
- Returns `null` if topic not attempted yet

**`getPerformanceAnalysis(userId, examName)`**
- Returns comprehensive analysis with:
  - Global stats
  - Subject-wise performance with strength scores
  - Topic-wise performance with strength scores
  - Categorized weak topics (strength < 50)
  - Categorized strong topics (strength >= 75)

**`getWeakTopics(userId, examName, threshold, limit)`**
- Returns topics below strength threshold (default: 60)
- Prioritizes unattempted topics first
- Then sorts by lowest strength
- Perfect for AI-recommended test generation

**`initializeMultipleExams(userId, examNames)`**
- Batch initialization for multiple exams
- Used when user adds multiple exams to profile

### 3. Auth Controller Integration
**File**: `backend/controllers/auth.controller.js`

#### Registration Flow:
```javascript
User signs up → Creates User & UserProfile → Initializes Performance Schema
```
- Automatically calls `Performance.initializeExamPerformance()` for selected exam
- Non-blocking: Registration succeeds even if performance init fails

#### Profile Update Flow:
```javascript
User updates profile → Detects new exams → Initializes Performance Schemas
```
- Compares old and new exam lists
- Initializes schemas only for newly added exams
- Supports multiple exam additions in one update

### 4. Analysis API Endpoints
**File**: `backend/controllers/analysis.controller.js`
**Routes**: `backend/routes/analysis.routes.js`

#### Available Endpoints:

**GET `/api/analysis/overview`**
- Returns overview of all exams with global stats
- Shows subject count, topic count, questions attempted

**GET `/api/analysis/:examName`**
- Detailed performance analysis for specific exam
- Includes weak and strong topics categorization

**GET `/api/analysis/:examName/weak-topics`**
- **Primary endpoint for AI recommendations**
- Query params: `threshold` (default: 60), `limit` (default: 10)
- Returns prioritized list of weak topics
- Includes priority levels: 'unattempted', 'high', 'medium'

**GET `/api/analysis/:examName/topic-strengths`**
- All topics with strength scores
- Sorted by strength (highest first)
- Includes accuracy and average time

**GET `/api/analysis/:examName/subject-performance`**
- Subject-level performance summary
- Strength scores for each subject
- Useful for high-level insights

## Data Flow

### 1. User Signup/Profile Update
```
User selects exam → Performance schema initialized → All topics set to null/0
```

### 2. Test Attempt
```
User takes test → Answers questions → Performance.updatePerformance() called
→ Updates global, subject, topic, difficulty, importance stats
→ Recalculates accuracy
```

### 3. AI Recommendation
```
Frontend requests weak topics → API queries Performance.getWeakTopics()
→ Returns prioritized weak areas → AI generates targeted test
```

## Strength Score Calculation

### Formula:
```
Strength = Accuracy Score (0-60) + Speed Score (0-25) + Consistency Score (0-15)
```

### Breakdown:

**Accuracy Score** (0-60 points):
- Most important factor
- `(Correct / Total) × 100 × 0.6`

**Speed Score** (0-25 points):
- ≤ 70% of expected time: 25 points
- ≤ 100% of expected time: 20 points
- ≤ 130% of expected time: 15 points
- ≤ 150% of expected time: 10 points
- > 150% of expected time: 5 points

**Consistency Score** (0-15 points):
- ≥ 20 attempts: 15 points
- ≥ 10 attempts: 12 points
- ≥ 5 attempts: 8 points
- < 5 attempts: 5 points

### Interpretation:
- **0-40**: Critical weakness - High priority
- **40-60**: Needs improvement - Medium priority
- **60-75**: Good - Low priority
- **75-100**: Strong - No action needed
- **null**: Not attempted - Highest priority

## Usage Examples

### For Frontend Developers:

#### Get weak topics for AI recommendations:
```javascript
const response = await fetch('/api/analysis/JEE Main/weak-topics?threshold=60&limit=5', {
  headers: { Authorization: `Bearer ${token}` }
});
const { weakTopics } = await response.json();
// Use weakTopics to generate AI-recommended tests
```

#### Display performance dashboard:
```javascript
const analysis = await fetch('/api/analysis/JEE Main', {
  headers: { Authorization: `Bearer ${token}` }
});
const { subjects, topics, weakTopics, strongTopics } = await analysis.json();
```

### For AI Integration:

```javascript
// Get user's weak topics
const weakTopics = await Performance.getWeakTopics(userId, 'JEE Main', 60, 10);

// Generate test focusing on weak areas
const questions = await Question.find({
  exam: 'JEE Main',
  topic: { $in: weakTopics.map(t => t.topic) }
}).limit(30);
```

## Benefits

✅ **Automatic**: No manual setup required
✅ **Personalized**: Unique schema per user per exam
✅ **Scalable**: Supports multiple exams per user
✅ **AI-Ready**: Easy to query weak topics for recommendations
✅ **Comprehensive**: Tracks performance at multiple levels (global, subject, topic, difficulty)
✅ **Insightful**: Strength scores provide clear actionable insights
✅ **Non-blocking**: Performance initialization doesn't block user operations

## Future Enhancements

1. **Time-based Analysis**: Track performance trends over time
2. **Comparative Analysis**: Compare with peer performance
3. **Adaptive Thresholds**: Dynamic strength thresholds based on exam difficulty
4. **Topic Dependencies**: Consider prerequisite topics in recommendations
5. **Custom Weights**: Allow users to customize strength calculation weights
