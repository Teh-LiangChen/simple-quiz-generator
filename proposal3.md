# Question Bank Format Quiz History Storage - Implementation Proposal

## Overview
Use localStorage to store wrong answers in JSON format during quiz, with ability to export as a text file in the original question bank format for easy review and reuse.

---

## Export File Format

### Export Filename Pattern
```
wrong[ORIGINAL_QUIZ_NAME].txt
```

**Examples:**
- Original: `prelim2526.txt` → Export: `wrongprelim2526.txt`
- Original: `national2526.txt` → Export: `wrongnational2526.txt`

### Export Content Format
Wrong answers are saved in the same format as the original question bank file:

```
Question 1
[question text]
a) [option a]
b) [option b]
c) [option c]
d) [option d]
Correct Answer: [answer]
Explanation: [explanation if available]

Question 3
[question text]
a) [option a]
b) [option b]
c) [option c]
d) [option d]
Correct Answer: [answer]
Explanation: [explanation if available]

Question 7
...
```

### Example Export File: `wrongprelim2526.txt`

```
Question 1
What is 2+2?
a) 3
b) 4
c) 5
d) 6
Correct Answer: b
Explanation: Basic arithmetic: 2 + 2 = 4

Question 3
Which planet is closest to the sun?
a) Venus
b) Mercury
c) Earth
d) Mars
Correct Answer: b
Explanation: Mercury is the closest planet to the sun

Question 12
What is the chemical formula for salt?
a) NaC
b) NaCl
c) NaClO
d) NaCl2
Correct Answer: b
Explanation: Sodium Chloride (table salt) has the formula NaCl
```

---

## Data Flow & Storage Architecture

### 1. **In-Memory State** (app.js)
```
User takes quiz → Wrong answer submitted → Record stored in state.wrongAnswers[]
```

### 2. **Browser localStorage** (JSON Format)
```javascript
// Store format in localStorage (key: 'quiz_wrong_answers')
{
  "quiz_wrong_answers": [
    {
      "quiz_name": "prelim2526.txt",
      "question_number": 1,
      "question": "What is 2+2?",
      "options": ["3", "4", "5", "6"],
      "correct_answer": "b",
      "explanation": "Basic arithmetic: 2 + 2 = 4"
    },
    ...
  ]
}
```

### 3. **Text File Export** (On-Demand Download)
When user clicks "Export wrong answers", convert localStorage JSON to question bank format and trigger download as `.txt` file:
```
Filename: wrongprelim2526.txt

Question 1
What is 2+2?
a) 3
b) 4
c) 5
d) 6
Correct Answer: b
Explanation: Basic arithmetic: 2 + 2 = 4
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
  wrongAnswers: []  // ✅ NEW: Track wrong answers in memory
};
```

### Step 2: Initialize localStorage on App Start
```javascript
function initializeQuizHistory() {
  // Load previously saved wrong answers from localStorage
  const saved = localStorage.getItem('quiz_wrong_answers');
  if (saved) {
    try {
      state.wrongAnswers = JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load quiz history:', error);
      state.wrongAnswers = [];
    }
  }
}

// Call this when app starts (in your file load or initialization)
initializeQuizHistory();
```

### Step 3: Record Wrong Answer to localStorage
```javascript
function recordWrongAnswer(question) {
  const record = {
    quiz_name: getQuizName(), // Extract from sourceText
    question_number: question.number,
    question: question.text,
    options: question.options || [], // Array of answer options
    correct_answer: question.answer, // e.g., 'b' for option b
    explanation: question.explanation || '' // Explanation text if available
  };

  state.wrongAnswers.push(record);
  saveQuizHistoryToLocalStorage();
  console.log('Wrong answer recorded:', record);
}

function saveQuizHistoryToLocalStorage() {
  localStorage.setItem('quiz_wrong_answers', JSON.stringify(state.wrongAnswers));
}
```

### Step 4: Call recordWrongAnswer in submitAnswer()
Modify your existing `submitAnswer()` function to record wrong answers:

```javascript
function submitAnswer() {
  // ... existing answer validation code ...

  if (userAnswerIsWrong) {
    // ✅ NEW: Record wrong answer to localStorage
    recordWrongAnswer(currentQuestion);
  }

  // ... rest of existing code ...
}
```

### Step 5: Export Quiz History as Question Bank Format
```javascript
function exportQuizHistoryAsTextFile() {
  if (state.wrongAnswers.length === 0) {
    alert('No wrong answers to export yet.');
    return;
  }

  // Get original quiz name and remove .txt extension
  const originalQuizName = state.wrongAnswers[0].quiz_name;
  const baseFileName = originalQuizName.replace('.txt', '');
  
  // Generate export filename: wrong[name].txt
  const exportFileName = `wrong${baseFileName}.txt`;

  // Format questions in question bank format
  let fileContent = '';
  
  state.wrongAnswers.forEach((record, index) => {
    // Question heading
    fileContent += `Question ${record.question_number}\n`;
    
    // Question text
    fileContent += `${record.question}\n`;
    
    // Answer options (a, b, c, d, etc.)
    if (record.options && record.options.length > 0) {
      record.options.forEach((option, idx) => {
        const optionLabel = String.fromCharCode(97 + idx); // a, b, c, d...
        fileContent += `${optionLabel}) ${option}\n`;
      });
    }
    
    // Correct answer
    fileContent += `Correct Answer: ${record.correct_answer}\n`;
    
    // Explanation (if available)
    if (record.explanation) {
      fileContent += `Explanation: ${record.explanation}\n`;
    }
    
    // Add blank line between questions (except after last)
    if (index < state.wrongAnswers.length - 1) {
      fileContent += '\n';
    }
  });

  // Download file
  downloadFile(fileContent, exportFileName, 'text/plain');
}

function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();button" class="secondary-button" type="button">📥 Export wrong answers</button>
</div>
```

### Step 7: Wire Up Export Button (app.js)
```javascript
const exportButton = document.querySelector('#export-button');
if (exportButton) {
  exportButton.addEventListener('click', exportQuizHistoryAsTextFile
```javascript
function clearQuizHistory() {
  if (confirm('Are you sure you want to delete all wrong answers? This cannot be undone.')) {
    state.wrongAnswers = [];
    localStorage.removeItem('quiz_wrong_answers');
    console.log('Quiz history cleared');
  }
}

// Add button if needed
const clearButton = document.querySelector('#clear-history-button');
if (clearButton) {
  clearButton.addEventListener('click', clearQuizHistory);
}
```

---

## Functionality Check (After Implementation)

### Pre-Implementation Checklist
- ✅ Backup your current `app.js` and `index.html` files
- ✅ Review all code snippets before implementing
- ✅ Identify where `submitAnswer()` function is in your code

### Step-by-Step Verification

#### 1. **Verify State Initialization** ✓
- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Take a quiz and submit a wrong answer
- [ ] In Console, type: `console.log(state.wrongAnswers)`
- [ ] **Expected Result**: Should show an array with the wrong answer record
```javascript
// Expected output:
[
  {
    "quiz_name": "prelim2526.txt",
    "question_number": 1,
    "question": "What is 2+2?",
    "options": ["3", "4", "5", "6"],
    "correct_answer": "b",
    "explanation": "Basic arithmetic: 2 + 2 = 4"
  }
]
```

#### 2. **Verify localStorage Persistence** ✓
- [ ] In DevTools Console, type: `localStorage.getItem('quiz_wrong_answers')`
- [ ] **Expected Result**: Should return JSON string of wrong answers
- [ ] Close and reopen the browser tab
- [ ] Type the same command again
- [ ] **Expected Result**: Data should persist (same JSON string appears)

#### 3. **Verify Multiple Wrong Answers** ✓
- [ ] Answer another question wrong in the same quiz
- [ ] In Console, type: `state.wrongAnswers.length`
- [ ] **Expected Result**: Should show `2` (or however many you got wrong)
- [ ] Verify each record has unique question numbers

#### 4. **Verify Export Button Appears** ✓
- [ ] Complete the quiz (reach the final panel with summary)
- [ ] Look for button labeled "📥 Export wrong answers"
- [ ] **Expected Result**: Button should be visible in the review-actions section
- [ ] Open DevTools Inspector (right-click → Inspect)
- [ ] Find `id="export-button"` element
- [ ] **Expected Result**: Element should exist in HTML

#### 5. **Verify Export Functionality** ✓
- [ ] Click the "📥 Export wrong answers" button
- [ ] A file download should start automatically
- [ ] **Expected Filename**: `wrongprelim2526.txt` (or your quiz name)
- [ ] **Expected Result**: File downloads with name pattern `wrong[quizname].txt`

#### 6. **Verify Export File Content** ✓
- [ ] Open the downloaded `.txt` file in a text editor
- [ ] **Check for**:
  - ✓ "Question [number]" headings
  - ✓ Full question text
  - ✓ Answer options (a), b), c), d))
  - ✓ "Correct Answer: [letter]" line
  - ✓ "Explanation:" with explanation text
  - ✓ Blank lines between questions
- [ ] **Example should look like**:
```
Question 1
What is 2+2?
a) 3
b) 4
c) 5
d) 6
Correct Answer: b
Explanation: Basic arithmetic: 2 + 2 = 4

Question 3
Which planet is closest to the sun?
...
```

#### 7. **Test Data Persistence Across Sessions** ✓
- [ ] Export wrong answers file
- [ ] Close the entire browser window
- [ ] Reopen the app in a new browser tab
- [ ] Take another quiz and get a different question wrong
- [ ] Export again
- [ ] **Expected Result**: New export file should contain BOTH old and new wrong answers

#### 8. **Test with Different Quiz Files** ✓
- [ ] Load `prelim2526.txt`, take quiz, export
- [ ] Verify filename is `wrongprelim2526.txt`
- [ ] Load `national2526.txt`, take quiz, export
- [ ] Verify filename is `wrongnational2526.txt`
- [ ] **Expected Result**: Filename correctly reflects which quiz was taken

#### 9. **Verify Clear History Function (Optional)** ✓
- [ ] If you added the clear function, test it:
  - [ ] In Console: `clearQuizHistory()`
  - [ ] Confirm dialog appears
  - [ ] Click "OK"
  - [ ] Check: `localStorage.getItem('quiz_wrong_answers')`
  - [ ] **Expected Result**: Should return `null` (cleared)

#### 10. **Test Edge Cases** ✓
- [ ] **No wrong answers scenario**:
  - [ ] Get all questions right in a quiz
  - [ ] Click export button
  - [ ] **Expected Result**: Alert saying "No wrong answers to export yet."
- [ ] **Large number of questions**:
  - [ ] Get 50+ questions wrong
  - [ ] Export and verify all are in file
  - [ ] **Expected Result**: File contains all wrong answers

### Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| Export button doesn't appear | Verify button HTML is added with `id="export-button"` |
| Export button doesn't download | Check browser console for errors, verify `downloadFile()` function |
| Wrong answers not saving | Verify `recordWrongAnswer()` is called in `submitAnswer()` |
| localStorage empty | Check if browser allows localStorage, verify initialization |
| Export file is empty | Verify `state.wrongAnswers` has data before export |
| Filename is wrong | Verify `getQuizName()` returns correct filename with `.txt` |
| Formatting looks odd in export | Check that options array is populated correctly in records |

### Common Errors & Fixes

**Error: "Cannot read property 'wrongAnswers' of undefined"**
- ✅ Fix: Ensure `state` object is declared at the top of `app.js`

**Error: "exportQuizHistoryAsTextFile is not defined"**
- ✅ Fix: Verify function is declared before the event listener

**Error: Export file has no content**
- ✅ Fix: Ensure wrong answers were actually recorded (check console logs)

**Export doesn't work but no errors**
- ✅ Fix: Verify `downloadFile()` function is implemented correctly

---

## Storage Limits & Considerations

| Aspect | Details |
|--------|---------|
| **Storage Method** | Browser localStorage (JSON) |
| **Storage Limit** | ~5-10MB per domain (varies by browser) |
| **Estimated Capacity** | ~1000-2000 wrong answers |
| **Data Loss Risk** | ⚠️ Lost if browser cache/cookies are cleared |
| **Data Persistence** | ✅ Survives page refreshes and app restarts |
| **Accessibility** | ✅ Export as CSV anytime to backup or analyze |
| **Multi-Device Sync** | ❌ No (browser-only, local data) |
| **No Backend Required** | ✅ Pure frontend solution |
| **Best Practice** | Export CSV periodically to backup locally |

---

## User Workflow

```
1. User loads quiz from Question Bank (no server needed)
2. Takes quiz, answers questions
3. When submitting WRONG answer:
   ✅ Record is saved to state.wrongAnswers[]
   ✅ Record is automatically persisted to localStorage
4. Quiz ends, summary shown
5. User clicks "📥 Export wrong answers as CSV"
6. CExport Format** | ✅ Question bank format (.txt) for easy review |
| **Multi-Device Sync** | ❌ No (browser-only, local data) |
| **No Backend Required** | ✅ Pure frontend solution |
| **Best Practice** | Export periodically to backup wrong answers locally |

---

## User Workflow

```
1. User loads quiz from Question Bank (no server needed)
2. Takes quiz, answers questions
3. When submitting WRONG answer:
   ✅ Record is saved to state.wrongAnswers[]
   ✅ Record is automatically persisted to localStorage
4. Quiz ends, summary shown
5. User clicks "📥 Export wrong answers"
6. Text file downloads: wrongprelim2526.txt (or appropriate quiz name)
7. User can open in text editor or import back into quiz app
8. File contains only the questions they got wrong in original format
9. Data persists in browser until cache is cleared
```

---

## Export File Example

**Filename**: `wrongprelim2526.txt`

**Content** (in question bank format):
```
Question 1
What is 2+2?
a) 3
b) 4
c) 5
d) 6
Correct Answer: b
Explanation: Basic arithmetic: 2 + 2 = 4

Question 3
Which planet is closest to the sun?
a) Venus
b) Mercury
c) Earth
d) Mars
Correct Answer: b
Explanation: Mercury is the closest planet to the sun

Question 12
What is the chemical formula for salt?
a) NaC
b) NaCl
c) NaClO
d) NaCl2
Correct Answer: b
Explanation: Sodium Chloride (table salt) has the formula NaCl
```

---

## Setup Instructions

### No Backend Required! ✅
Just add the code snippets above to your existing `app.js` and `index.html`.

1. **Add initialization** in your app startup:
   ```javascript
   initializeQuizHistory();
   ```

2. **Add recording** when answer is submitted:
   ```javascript
   if (userAnswerIsWrong) {
     recordWrongAnswer(currentQuestion);
   }
   ```

3. **Add export button** to UI and wire it up
4. **Done!** No server, no dependencies needed.

---

## Features & Benefits

### Core Features ✅
- ✅ Record wrong answers during quiz
- ✅ Store in browser's localStorage (persistent)
- ✅ Export as question bank format (.txt)
- ✅ No backend server required
- ✅ Maintains original question format for consistency

### Advantages
- **Easy Review**: Open exported file in text editor
- **Reusable**: Can load wrong answers file back into quiz app
- **Familiar Format**: Same format as original question banks
- **Portable**: Share .txt file easily with others
- **Lightweight**: No database or server needed

### Future Enhancements
- 📊 Display statistics (wrong answer count by category)
- 🔄 Clear/delete individual records
- 📈 Track progress over time
- 🏆 Compare performance across quizzes
- 🔍 Filter by date range or quiz name
- 📁 Merge multiple wrong answer files

---

## Summary

| Aspect | Details |
|--------|---------|
| **Storage Method** | Browser localStorage (JSON format) |
| **File Export Format** | Question bank format (.txt) |
| **Filename Pattern** | `wrong[original_name].txt` |
| **Capacity** | ~1000-2000 records (localStorage ~5-10MB limit) |
| **Data Persistence** | ✅ Survives page refreshes and app restarts |
| **Data Backup** | Export