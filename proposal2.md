# Lightweight Quiz History Tracking - Proposal

## Objective
Record wrongly answered quiz questions without using a heavy database, keeping the solution simple and accessible.

---

## Proposed Approaches

### Option 1: JSON File Storage ⭐ (Recommended)
**Best for**: Web apps with backend, Node.js applications

**Structure:**
```json
{
  "quiz_history": [
    {
      "id": 1,
      "quiz_name": "Math Quiz 1",
      "question": "What is 2+2?",
      "your_answer": "5",
      "correct_answer": "4",
      "date": "2026-09-09",
      "category": "Basic Math"
    },
    {
      "id": 2,
      "quiz_name": "Science Quiz 1",
      "question": "What is H2O?",
      "your_answer": "Hydrogen",
      "correct_answer": "Water",
      "date": "2026-09-09",
      "category": "Chemistry"
    }
  ]
}
```

**Advantages:**
- ✅ Human-readable and structured
- ✅ Easy to parse in JavaScript/Node.js
- ✅ Can be version controlled in Git
- ✅ Simple file I/O operations

**Disadvantages:**
- ❌ Not ideal for very large datasets (performance degrades)
- ❌ Requires manual file locking if concurrent access needed

---

### Option 2: CSV File ✅ (Simple & Accessible)
**Best for**: Quick analysis, Excel/Google Sheets integration

**Structure:**
```csv
QuizName,Question,YourAnswer,CorrectAnswer,Date,Category
Math Quiz 1,What is 2+2?,5,4,2026-09-09,Basic Math
Science Quiz 1,What is H2O?,Hydrogen,Water,2026-09-09,Chemistry
```

**Advantages:**
- ✅ Opens in Excel/Google Sheets
- ✅ Universal format
- ✅ Very lightweight
- ✅ Easy to analyze and sort

**Disadvantages:**
- ❌ No nested data support
- ❌ Quote escaping issues with commas in text

---

### Option 3: Markdown Table (File-based) 📝
**Best for**: Documentation, Git-friendly tracking

**Structure:**
```markdown
| Quiz | Question | Your Answer | Correct Answer | Date | Category |
|------|----------|-------------|----------------|------|----------|
| Math Quiz 1 | What is 2+2? | 5 | 4 | 2026-09-09 | Basic Math |
| Science Quiz 1 | What is H2O? | Hydrogen | Water | 2026-09-09 | Chemistry |
```

**Advantages:**
- ✅ Readable in GitHub/GitLab
- ✅ Version control friendly
- ✅ Can be rendered as documentation
- ✅ No parsing libraries needed

**Disadvantages:**
- ❌ Hard to parse programmatically
- ❌ Not scalable for large datasets

---

### Option 4: SQLite Database (Lightweight DB) 💾
**Best for**: Scalable queries, complex filtering

**Setup:**
```javascript
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./quiz_history.db');

db.run(`
  CREATE TABLE IF NOT EXISTS quiz_history (
    id INTEGER PRIMARY KEY,
    quiz_name TEXT,
    question TEXT,
    your_answer TEXT,
    correct_answer TEXT,
    date TEXT,
    category TEXT
  )
`);
```

**Advantages:**
- ✅ Fast queries and filtering
- ✅ Lightweight (~500KB for 1000+ records)
- ✅ Built-in SQL operations
- ✅ ACID compliance

**Disadvantages:**
- ❌ Requires SQLite library
- ❌ Binary file (harder to version control)
- ❌ Slightly more complex to set up

---

### Option 5: Browser localStorage (Client-side only)
**Best for**: Web-only solutions without backend

**JavaScript:**
```javascript
// Save a wrong answer
const wrongAnswer = {
  quiz_name: "Math Quiz 1",
  question: "What is 2+2?",
  your_answer: "5",
  correct_answer: "4",
  date: new Date().toISOString(),
  category: "Basic Math"
};

let history = JSON.parse(localStorage.getItem('quiz_history')) || [];
history.push(wrongAnswer);
localStorage.setItem('quiz_history', JSON.stringify(history));

// Retrieve all wrong answers
const allWrong = JSON.parse(localStorage.getItem('quiz_history'));
```

**Advantages:**
- ✅ No backend needed
- ✅ Data persists in browser
- ✅ No server setup required
- ✅ Very simple implementation

**Disadvantages:**
- ❌ Limited storage (~5-10MB per domain)
- ❌ Browser-dependent (no sync across devices)
- ❌ Data lost if cache cleared

---

### Option 6: Plain Text Log File (Minimal Overhead)
**Best for**: Extremely simple, append-only tracking

**Structure:**
```
[2026-09-09] Math Quiz 1 | Q: What is 2+2? | Your: 5 | Correct: 4 | Category: Basic Math
[2026-09-09] Science Quiz 1 | Q: What is H2O? | Your: Hydrogen | Correct: Water | Category: Chemistry
```

**Advantages:**
- ✅ Minimal overhead
- ✅ Human-readable
- ✅ Append-only (fast writes)
- ✅ No parsing needed

**Disadvantages:**
- ❌ Hard to query specific records
- ❌ No structured data

---

## Recommendation Summary

| Use Case | Best Option |
|----------|------------|
| Web app with backend (Node.js/Express) | **Option 1: JSON** |
| Quick analysis & Excel export | **Option 2: CSV** |
| GitHub documentation & version control | **Option 3: Markdown Table** |
| Complex queries & filtering | **Option 4: SQLite** |
| Browser-only (no backend) | **Option 5: localStorage** |
| Minimal overhead logging | **Option 6: Plain Text** |

---

## Suggested Implementation Path

1. **Start with Option 1 (JSON)** or **Option 2 (CSV)**
   - Easiest to implement
   - Can be manually reviewed
   - Export-friendly

2. **Upgrade to Option 4 (SQLite)** if/when:
   - Dataset grows beyond 1000 records
   - Need complex filtering (by date, category, etc.)
   - Want reporting features

3. **For web frontend**: Use **Option 5 (localStorage)** with backend sync to Option 1/2/4

---

## Next Steps
- Decide based on your tech stack (Node.js, Python, pure frontend, etc.)
- Pick one approach and implement a basic version
- Create the data file/structure
- Write functions to add, retrieve, and filter records
