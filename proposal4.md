# Quiz Performance History Feature - CSV Database Proposal

## Overview
Track quiz performance history using a simple CSV file as the database. Records are loaded at app startup and new performance records are appended after each quiz completion.

---

## CSV Schema & Structure

### Column Headers
```csv
Timestamp,QuizName,CorrectCount,WrongCount,TotalCount,WronglyAnsweredQuestions
```

### Detailed Column Definitions

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `Timestamp` | String | ISO 8601 timestamp when quiz completed | `2026-09-09T14:30:45Z` |
| `QuizName` | String | Name of the quiz/question bank file | `prelim2526.txt` |
| `CorrectCount` | Integer | Number of questions answered correctly | `12` |
| `WrongCount` | Integer | Number of questions answered incorrectly | `5` |
| `TotalCount` | Integer | Total number of questions in the quiz | `17` |
| `WronglyAnsweredQuestions` | String | Comma-separated list of question numbers | `1,3,7,12,15` |

---

## Example CSV Data: `quiz_history.csv`

```csv
Timestamp,QuizName,CorrectCount,WrongCount,TotalCount,WronglyAnsweredQuestions
2026-09-08T10:15:30Z,prelim2526.txt,15,5,20,1,3,7,12,15
2026-09-08T11:45:20Z,national2526.txt,18,2,20,5,9
2026-09-09T14:30:45Z,prelim2526.txt,16,4,20,2,6,14,18
```

---

## File Storage & Directory Structure

### Expected File Location
```
Revision Program/
├── app.js
├── index.html
├── styles.css
├── quiz_history.csv          (← Main history database)
├── Question Bank/
│   ├── prelim2526.txt
│   └── national2526.txt
```

### CSV File Initialization
- File name: `quiz_history.csv`
- Location: Root of application directory
- Auto-created if doesn't exist (with headers only)
- Persists between app sessions

---

## Data Flow & Architecture

### 1. **App Startup** (Load existing history)
```
App loads → Read quiz_history.csv → Parse into state.quizHistory[] → Display in History Section
```

### 2. **Quiz Completion** (Record new performance)
```
Quiz finishes → Calculate performance metrics → Create CSV row → Append to state.quizHistory[] → Export/Download updated CSV
```

### 3. **In-Memory Storage** (app.js)
```javascript
// Store format in memory
const state = {
  questions: [],
  currentIndex: 0,
  reviewFilter: null,
  sourceText: '',
  wrongAnswers: [],
  quizHistory: [  // ✅ NEW: Quiz performance history
    {
      timestamp: "2026-09-08T10:15:30Z",
      quiz_name: "prelim2526.txt",
      correct_count: 15,
      wrong_count: 5,
      total_count: 20,
      wrongly_answered_questions: [1, 3, 7, 12, 15]
    },
    ...
  ]
};
```

### 4. **CSV Format** (For storage/export)
```csv
Timestamp,QuizName,CorrectCount,WrongCount,TotalCount,WronglyAnsweredQuestions
2026-09-08T10:15:30Z,prelim2526.txt,15,5,20,"1,3,7,12,15"
2026-09-08T11:45:20Z,national2526.txt,18,2,20,"5,9"
```

---

## Implementation Steps

### Step 1: Extend State Object (app.js)
```javascript
const state = {
  questions: [],
  currentIndex: 0,
  reviewFilter: null,
  sourceText: '',
  wrongAnswers: [],
  quizHistory: []  // ✅ NEW: Quiz performance records
};
```

### Step 2: Upload CSV File Handler (index.html)
Add a file input to load existing quiz_history.csv:

```html
<section class="history-panel" aria-labelledby="history-heading">
  <div>
    <p class="section-label">Quiz History</p>
    <h2 id="history-heading">Load your quiz history</h2>
    <p id="history-status" class="muted">No history loaded yet.</p>
  </div>
  <label class="file-button" for="history-input">Upload quiz_history.csv</label>
  <input id="history-input" type="file" accept=".csv,text/csv">
</section>

<div id="history-display" class="history-display" hidden>
  <h3>Quiz Performance History</h3>
  <table id="history-table" class="history-table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Quiz Name</th>
        <th>Correct</th>
        <th>Wrong</th>
        <th>Total</th>
        <th>Score %</th>
        <th>Wrong Questions</th>
      </tr>
    </thead>
    <tbody id="history-tbody"></tbody>
  </table>
  <button id="export-history-button" class="secondary-button" type="button">📥 Download history.csv</button>
</div>
```

### Step 3: Parse CSV File on Upload
```javascript
const historyInput = document.querySelector('#history-input');
if (historyInput) {
  historyInput.addEventListener('change', loadHistoryFile);
}

function loadHistoryFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const csvContent = e.target.result;
      const quizHistory = parseQuizHistoryCSV(csvContent);
      state.quizHistory = quizHistory;
      saveQuizHistoryToLocalStorage();
      displayQuizHistory();
      updateHistoryStatus(`Loaded ${quizHistory.length} quiz records`);
    } catch (error) {
      console.error('Failed to load history:', error);
      updateHistoryStatus(`Error loading file: ${error.message}`, 'error');
    }
  };
  reader.readAsText(file);
}

function parseQuizHistoryCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return []; // Only headers, no data

  const headers = lines[0].split(',');
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 6) continue; // Skip invalid lines

    const record = {
      timestamp: values[0],
      quiz_name: values[1],
      correct_count: parseInt(values[2]) || 0,
      wrong_count: parseInt(values[3]) || 0,
      total_count: parseInt(values[4]) || 0,
      wrongly_answered_questions: values[5]
        .split(',')
        .map(q => parseInt(q.trim()))
        .filter(q => !isNaN(q))
    };

    records.push(record);
  }

  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}
```

### Step 4: Save & Load from localStorage
```javascript
function saveQuizHistoryToLocalStorage() {
  localStorage.setItem('quiz_history', JSON.stringify(state.quizHistory));
}

function loadQuizHistoryFromLocalStorage() {
  const saved = localStorage.getItem('quiz_history');
  if (saved) {
    try {
      state.quizHistory = JSON.parse(saved);
      displayQuizHistory();
    } catch (error) {
      console.error('Failed to load quiz history from localStorage:', error);
      state.quizHistory = [];
    }
  }
}

// Call on app startup
loadQuizHistoryFromLocalStorage();
```

### Step 5: Record Quiz Performance After Quiz Completes
Modify your quiz completion handler:

```javascript
function completeQuiz() {
  // Calculate performance metrics
  const correctCount = state.questions.filter(q => q.answered === q.answer).length;
  const wrongAnsweredQuestions = state.questions
    .map((q, idx) => q.answered && q.answered !== q.answer ? q.number : null)
    .filter(n => n !== null);
  const wrongCount = wrongAnsweredQuestions.length;
  const totalCount = state.questions.length;

  // Create history record
  const historyRecord = {
    timestamp: new Date().toISOString(),
    quiz_name: getQuizName(),
    correct_count: correctCount,
    wrong_count: wrongCount,
    total_count: totalCount,
    wrongly_answered_questions: wrongAnsweredQuestions
  };

  // Add to history
  state.quizHistory.push(historyRecord);
  saveQuizHistoryToLocalStorage();
  
  console.log('Quiz performance recorded:', historyRecord);
}
```

### Step 6: Display Quiz History
```javascript
function displayQuizHistory() {
  if (state.quizHistory.length === 0) {
    document.querySelector('#history-display').hidden = true;
    return;
  }

  const tbody = document.querySelector('#history-tbody');
  tbody.innerHTML = '';

  state.quizHistory.forEach(record => {
    const scorePercent = ((record.correct_count / record.total_count) * 100).toFixed(1);
    const wrongQuestionsStr = record.wrongly_answered_questions.join(', ') || 'N/A';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(record.timestamp)}</td>
      <td>${record.quiz_name}</td>
      <td>${record.correct_count}</td>
      <td>${record.wrong_count}</td>
      <td>${record.total_count}</td>
      <td>${scorePercent}%</td>
      <td>${wrongQuestionsStr}</td>
    `;
    tbody.appendChild(row);
  });

  document.querySelector('#history-display').hidden = false;
}

function formatDate(iso8601String) {
  const date = new Date(iso8601String);
  return date.toLocaleString(); // e.g., "9/9/2026, 2:30:45 PM"
}

function updateHistoryStatus(message, type = 'success') {
  const statusElement = document.querySelector('#history-status');
  statusElement.textContent = message;
  statusElement.className = `muted ${type === 'error' ? 'error' : ''}`;
}
```

### Step 7: Export Updated History as CSV
```javascript
function exportQuizHistoryAsCSV() {
  if (state.quizHistory.length === 0) {
    alert('No quiz history to export.');
    return;
  }

  // CSV headers
  const headers = ['Timestamp', 'QuizName', 'CorrectCount', 'WrongCount', 'TotalCount', 'WronglyAnsweredQuestions'];

  // Convert records to CSV rows
  const rows = state.quizHistory.map(record => [
    record.timestamp,
    record.quiz_name,
    record.correct_count,
    record.wrong_count,
    record.total_count,
    `"${record.wrongly_answered_questions.join(',')}"` // Wrap in quotes
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Download file
  downloadFile(csvContent, 'quiz_history.csv', 'text/csv');
}

const exportHistoryButton = document.querySelector('#export-history-button');
if (exportHistoryButton) {
  exportHistoryButton.addEventListener('click', exportQuizHistoryAsCSV);
}
```

### Step 8: Add Styling (styles.css)
```css
.history-panel {
  padding: 2rem;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.history-display {
  padding: 2rem;
  background: white;
  border-radius: 8px;
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.history-table thead {
  background: #007bff;
  color: white;
}

.history-table th,
.history-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.history-table tbody tr:hover {
  background: #f9f9f9;
}

.history-table tbody tr:nth-child(even) {
  background: #fafafa;
}

.error {
  color: #dc3545;
}
```

---

## Functionality Check (After Implementation)

### Pre-Implementation Checklist
- ✅ Backup your current `app.js`, `index.html`, and `styles.css` files
- ✅ Review all code snippets before implementing
- ✅ Identify where quiz completion is triggered in your code

### Step-by-Step Verification

#### 1. **Verify State Initialization** ✓
- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Type: `console.log(state.quizHistory)`
- [ ] **Expected Result**: Should show an empty array `[]` initially
- [ ] If data exists: Should show array of history records

#### 2. **Verify localStorage Persistence** ✓
- [ ] In DevTools Console, type: `localStorage.getItem('quiz_history')`
- [ ] **Expected Result**: Should return `null` (empty) or JSON string of records
- [ ] Close and reopen the browser tab
- [ ] Type the same command again
- [ ] **Expected Result**: Data should persist

#### 3. **Verify History Upload Button Appears** ✓
- [ ] Look for "Upload quiz_history.csv" button on the page
- [ ] **Expected Result**: Button should be visible
- [ ] Open DevTools Inspector (F12 → Inspector)
- [ ] Find `id="history-input"` element
- [ ] **Expected Result**: File input element should exist

#### 4. **Verify CSV Upload & Parsing** ✓
- [ ] Click "Upload quiz_history.csv" button
- [ ] Select `example_quiz_history.csv` (provided template)
- [ ] **Expected Result**: Success message appears: "Loaded X quiz records"
- [ ] In Console, type: `state.quizHistory.length`
- [ ] **Expected Result**: Should show number of records (e.g., `3`)

#### 5. **Verify History Table Display** ✓
- [ ] After uploading CSV, check page for history table
- [ ] **Expected Result**: Table should display with columns:
  - Date, Quiz Name, Correct, Wrong, Total, Score %, Wrong Questions
- [ ] Verify all records from CSV appear in table
- [ ] Check that score percentages are calculated correctly
  - Formula: `(Correct / Total) * 100` → e.g., 15/20 = 75%

#### 6. **Verify Quiz Completion Recording** ✓
- [ ] Complete a quiz (answer all questions)
- [ ] Reach the final panel (quiz summary)
- [ ] In Console, type: `state.quizHistory.length`
- [ ] **Expected Result**: Should have increased by 1
- [ ] Check the new record: `state.quizHistory[state.quizHistory.length - 1]`
- [ ] **Expected Result**: Should contain:
  ```javascript
  {
    timestamp: "2026-09-10T...",
    quiz_name: "prelim2526.txt",
    correct_count: 15,  // your score
    wrong_count: 5,     // your wrong count
    total_count: 20,    // total questions
    wrongly_answered_questions: [1, 3, 7, ...]
  }
  ```

#### 7. **Verify localStorage Auto-Save After Quiz** ✓
- [ ] After completing a quiz
- [ ] In Console, type: `localStorage.getItem('quiz_history')`
- [ ] **Expected Result**: Should contain JSON string with all records including new one

#### 8. **Verify History Table Updates** ✓
- [ ] After completing quiz, table should automatically update
- [ ] New quiz record should appear as new row in table
- [ ] Score % should calculate correctly
- [ ] Wrong questions list should show correct question numbers

#### 9. **Verify Export CSV Functionality** ✓
- [ ] After at least one quiz completion, look for "Download history.csv" button
- [ ] **Expected Result**: Button should be visible in history section
- [ ] Click the button
- [ ] **Expected Result**: `quiz_history.csv` file should download
- [ ] Open downloaded file in text editor
- [ ] **Expected Content**:
  ```csv
  Timestamp,QuizName,CorrectCount,WrongCount,TotalCount,WronglyAnsweredQuestions
  2026-09-10T14:30:45Z,prelim2526.txt,15,5,20,"1,3,7,12,15"
  ```

#### 10. **Test Re-uploading Exported CSV** ✓
- [ ] Export history as CSV (Step 9)
- [ ] Restart browser/reload app
- [ ] Upload the exported CSV file
- [ ] **Expected Result**: All records should reload correctly
- [ ] Table should display exactly as before

#### 11. **Test with Multiple Quizzes** ✓
- [ ] Complete quizzes from different files (prelim2526.txt, national2526.txt)
- [ ] Check history table
- [ ] **Expected Result**: All quizzes should appear with correct quiz names
- [ ] Export CSV
- [ ] **Expected Result**: Should show multiple rows with different quiz names

#### 12. **Test Data Accuracy** ✓
- [ ] Complete a quiz and note your score manually
- [ ] Check the history record
- [ ] Verify:
  - [ ] Timestamp matches current time (within seconds)
  - [ ] CorrectCount + WrongCount = TotalCount
  - [ ] Score % = (CorrectCount / TotalCount) * 100
  - [ ] WronglyAnsweredQuestions contains correct question numbers

### Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| Upload button doesn't appear | Verify HTML elements with `id="history-input"` exist |
| CSV upload fails | Check file format is valid CSV, try `example_quiz_history.csv` |
| History table doesn't display | Verify `displayQuizHistory()` is called after upload |
| New quiz not recorded | Verify `completeQuiz()` is called when quiz finishes |
| localStorage empty after reload | Check if browser allows localStorage, not in private mode |
| Export button missing | Verify button HTML with `id="export-history-button"` exists |
| Export file is empty | Check that `state.quizHistory` has data before export |
| Date formatting looks odd | Check `formatDate()` function, browser locale settings |
| Question numbers incorrect | Verify questions have `.number` property populated |

### Common Errors & Fixes

**Error: "parseQuizHistoryCSV is not defined"**
- ✅ Fix: Ensure all functions from Step 3 are added to `app.js`

**Error: "Cannot read property 'quizHistory' of undefined"**
- ✅ Fix: Verify `state` object is declared at top of `app.js` with `quizHistory: []`

**Error: Upload doesn't work**
- ✅ Fix: Verify CSV file headers exactly match:
  ```
  Timestamp,QuizName,CorrectCount,WrongCount,TotalCount,WronglyAnsweredQuestions
  ```

**Error: Table shows NaN for score %**
- ✅ Fix: Verify CorrectCount and TotalCount are numbers, not strings

**Error: wrongly_answered_questions array is empty**
- ✅ Fix: Verify questions are being compared correctly in `completeQuiz()` function

---

## User Workflow

```
1. App loads → Loads quiz_history from localStorage automatically
2. If no history exists, show "No history loaded yet"
3. User can upload existing quiz_history.csv file:
   - Click "Upload quiz_history.csv" button
   - Select file
   - History displays in table
4. User takes a quiz
5. Quiz completes:
   ✅ New performance record created
   ✅ Record added to state.quizHistory
   ✅ Saved to localStorage automatically
6. User can view updated history table
7. User can download updated history.csv for backup
```

---

## Example History Display

### CSV File Content
```csv
Timestamp,QuizName,CorrectCount,WrongCount,TotalCount,WronglyAnsweredQuestions
2026-09-08T10:15:30Z,prelim2526.txt,15,5,20,"1,3,7,12,15"
2026-09-08T11:45:20Z,national2526.txt,18,2,20,"5,9"
2026-09-09T14:30:45Z,prelim2526.txt,16,4,20,"2,6,14,18"
```

### Table Display
| Date | Quiz Name | Correct | Wrong | Total | Score % | Wrong Questions |
|------|-----------|---------|-------|-------|---------|-----------------|
| 9/8/2026, 10:15:30 AM | prelim2526.txt | 15 | 5 | 20 | 75.0% | 1, 3, 7, 12, 15 |
| 9/8/2026, 11:45:20 AM | national2526.txt | 18 | 2 | 20 | 90.0% | 5, 9 |
| 9/9/2026, 2:30:45 PM | prelim2526.txt | 16 | 4 | 20 | 80.0% | 2, 6, 14, 18 |

---

## Storage Mechanism

### Browser localStorage
- **Key**: `quiz_history`
- **Value**: JSON array of performance records
- **Persists**: Until browser cache is cleared
- **Capacity**: ~5-10MB (can hold thousands of records)

### CSV File (External)
- **Filename**: `quiz_history.csv`
- **Location**: User's download folder (after export)
- **Purpose**: Backup and sharing
- **Manual Sync**: User uploads CSV to refresh history

---

## Data Flow

### Loading History
```
[CSV File] → Upload → Parse → state.quizHistory[] → localStorage → Display Table
```

### Recording New Quiz
```
Quiz Complete → Calculate Metrics → Create Record → state.quizHistory[] → localStorage
```

### Exporting History
```
state.quizHistory[] → Convert to CSV → Download quiz_history.csv
```

---

## Setup Instructions

### No Backend Required! ✅
Just add the code snippets above to your existing `app.js`, `index.html`, and `styles.css`.

1. **Add state.quizHistory** to your state object
2. **Add HTML elements** for history upload and display
3. **Add all functions** from Steps 3-8 to app.js
4. **Call loadQuizHistoryFromLocalStorage()** on app startup
5. **Call completeQuiz()** when quiz finishes
6. **Done!** No server, no dependencies needed.

---

## Features & Benefits

### Core Features ✅
- ✅ Load existing quiz history from CSV file
- ✅ Display history in sortable table
- ✅ Auto-record performance after each quiz
- ✅ Persistent storage (localStorage + CSV backup)
- ✅ Export to CSV for backup and sharing
- ✅ No backend server required
- ✅ Performance metrics (score %, wrong questions)

### Advantages
- **Simple Tracking**: CSV is human-readable and Excel-compatible
- **Persistent Data**: Survives browser restarts via localStorage
- **Portable**: Export CSV to share progress or backup
- **No Dependencies**: Pure frontend, native JavaScript
- **Easy to Analyze**: Open CSV in Excel for charts and analysis

### Future Enhancements
- 📊 Display performance charts (progress over time)
- 🎯 Calculate average score across all quizzes
- 📈 Track improvement trends
- 🏆 Show best/worst performing quizzes
- 🔍 Filter history by quiz name or date range
- 📁 Merge multiple history CSV files
- ☁️ Sync history to cloud storage

---

## Summary

| Aspect | Details |
|--------|---------|
| **Storage Method** | Browser localStorage (JSON) + CSV file (external backup) |
| **CSV Filename** | `quiz_history.csv` |
| **CSV Columns** | 6 columns (Timestamp, QuizName, CorrectCount, WrongCount, TotalCount, WronglyAnsweredQuestions) |
| **Data Format** | Comma-separated values with quoted question numbers |
| **Record Creation** | Automatic after each quiz completion |
| **Display** | Sortable HTML table with performance metrics |
| **Export** | Download as CSV anytime for backup |
| **Capacity** | 5000+ records in localStorage, unlimited in CSV files |
| **Persistence** | ✅ Survives browser restarts, requires manual export for permanent backup |
| **Backend Required** | ❌ No - pure frontend solution |
