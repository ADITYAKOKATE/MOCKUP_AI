# Scraping Architecture (Examside.com)

This project uses a modular scraping architecture designed for `questions.examside.com`.

## 1. Core Engine (`scripts/scraper_engine.py`)
This is the central module that implements the **DRY (Don't Repeat Yourself)** principle. It handles:
-   **DB Connection**: Connects to MongoDB (`loop` DB).
-   **Crawler**:
    -   Visits the Exam Landing Page (e.g., `/past-years/jee/jee-main`).
    -   Extracts all hierarchical Subject/Topic links.
    -   Visits each Topic Page.
-   **Extraction Logic**:
    -   Identifies Question Blocks (`div.card`, `div.p-4`).
    -   Extracts Question Text (preserves content).
    -   Extracts Options (A, B, C, D) and Explanations.
    -   **Deduplication**: Checks `(question_text, exam_name)` to prevent duplicates.
-   **Schema Compliance**: Saves data matching `models/Question.js`.

## 2. Data Processing & Frontend Compatibility (IMPORTANT)

The scraper performs specific cleaning to ensure data is "Frontend Ready", especially for scientific/math content.

### A. LaTeX & Math Handling
*   **Strategy**: **Preserve & Wrap**.
*   **Delimiters**: The scraper explicitly **PRESERVES** `$$` delimiters found in the source HTML.
*   **Heuristic Wrapping**: 
    If an option contains LaTeX characters (e.g., `\` or `{}`) but is *missing* delimiters, the scraper automatically wraps it in `$$` (e.g., `\frac{1}{2}` → `$$\frac{1}{2}$$`).
*   **Frontend Implication**: The frontend must use a LaTeX renderer like **MathJax** or **KaTeX**. Any text wrapped in `$$` should be treated as display math.

### B. Question Types
The scraper automatically detects the `type` field:
1.  **MCQ (Multiple Choice)**: Default. Single correct option derived from `correctOption: "A"`.
2.  **MSQ (Multiple Select)**: Detected if `correct_options` is an array (e.g., `["A", "C"]`). Stored as `type: "MSQ"` and `correctAnswer: "A,C"`.
3.  **NAT (Numerical Answer)**: Detected if `options` array is empty OR if the answer is numeric (e.g., `answer: 5.5`). Stored as `type: "NAT"`.

### C. Explanations / Solutions
*   **Extraction**: Scraped from hidden `<script>` tags (typically `solution: "..."` or `explanation: "..."` keys in SvelteKit data).
*   **Cleaning**: Unicode escapes (`\u003C`) are decoded to standard text/HTML.

### D. HTML Cleaning
*   **Tag Stripping**: Most HTML tags (`<div>`, `<span>`) are stripped to leave clean text.
*   **Whitespace**: Collapsed to single spaces to prevent layout breakage.

## 3. Exam Scripts (`scripts/run_*.py`)
These are lightweight "Driver Scripts". Each script Configures the Engine for a specific exam.

| Script | Target Exam (Slug) | Display Name |
| :--- | :--- | :--- |
| `run_jee_main.py` | `jee/jee-main` | JEE Main |
| `run_jee_advanced.py` | `jee/jee-advanced` | JEE Advanced |
| `run_neet.py` | `medical/neet` | NEET |
| `run_mht_cet.py` | `engineering/mht-cet` | MHT CET |
| `run_gate.py` | `gate/{stream}` | GATE {STREAM} |

## 4. Usage
Run via npm commands defined in `package.json`:

```bash
# GATE Streams
npm run import:gate-cse
npm run import:gate-ece
npm run import:gate-da

# Other Exams
npm run import:jee-main
npm run import:neet
```

## 5. Extending
To add a new exam (e.g., BITSAT):
1.  Check URL slug on `examside.com` (e.g., `engineering/bitsat`).
2.  Create `scripts/run_bitsat.py`.
3.  Import `scraper_engine` and call `scrape_exam("engineering/bitsat", "BITSAT", ...)`.
4.  Add command to `package.json`.
