const state = {
  questions: [],
  currentIndex: 0,
  reviewFilter: null,
  sourceText: '',
  wrongAnswers: [],
  quizHistory: []
};

const elements = {
  fileInput: document.querySelector('#file-input'),
  fileStatus: document.querySelector('#file-status'),
  message: document.querySelector('#message'),
  quizPanel: document.querySelector('#quiz-panel'),
  finalPanel: document.querySelector('#final-panel'),
  progress: document.querySelector('#progress'),
  progressBar: document.querySelector('#progress-bar'),
  score: document.querySelector('#score'),
  questionNavigation: document.querySelector('#question-navigation'),
  questionType: document.querySelector('#question-type'),
  questionText: document.querySelector('#question-text'),
  selectionHint: document.querySelector('#selection-hint'),
  answerOptions: document.querySelector('#answer-options'),
  result: document.querySelector('#result'),
  resultHeading: document.querySelector('#result-heading'),
  correctAnswer: document.querySelector('#correct-answer'),
  explanationText: document.querySelector('#explanation-text'),
  confirmButton: document.querySelector('#confirm-button'),
  previousButton: document.querySelector('#previous-button'),
  nextButton: document.querySelector('#next-button'),
  finalScore: document.querySelector('#final-score'),
  finalMessage: document.querySelector('#final-message'),
  restartButton: document.querySelector('#restart-button'),
  summaryTotal: document.querySelector('#summary-total'),
  summaryCorrect: document.querySelector('#summary-correct'),
  summaryWrong: document.querySelector('#summary-wrong'),
  summaryUnanswered: document.querySelector('#summary-unanswered'),
  reviewCorrectButton: document.querySelector('#review-correct-button'),
  reviewWrongButton: document.querySelector('#review-wrong-button'),
  reviewUnansweredButton: document.querySelector('#review-unanswered-button')
};

elements.fileInput.addEventListener('change', loadFile);
elements.confirmButton.addEventListener('click', submitAnswer);
elements.previousButton.addEventListener('click', () => moveQuestion(-1));
elements.nextButton.addEventListener('click', showNextQuestion);
elements.restartButton.addEventListener('click', restartQuiz);
elements.reviewCorrectButton.addEventListener('click', () => startReview('correct'));
elements.reviewWrongButton.addEventListener('click', () => startReview('wrong'));
elements.reviewUnansweredButton.addEventListener('click', () => startReview('unanswered'));

// Initialize quiz history on app startup
initializeQuizHistory();
loadQuizHistoryFromLocalStorage();

// Wire up history file upload
const historyInput = document.querySelector('#history-input');
if (historyInput) {
  historyInput.addEventListener('change', loadHistoryFile);
}

// Wire up export buttons
const exportButton = document.querySelector('#export-button');
if (exportButton) {
  exportButton.addEventListener('click', exportQuizHistoryAsTextFile);
}

const exportHistoryButton = document.querySelector('#export-history-button');
if (exportHistoryButton) {
  exportHistoryButton.addEventListener('click', exportQuizHistoryAsCSV);
}

async function loadFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const questions = parseQuestionBank(text);
    state.questions = questions;
    state.currentIndex = 0;
    state.reviewFilter = null;
    state.sourceText = text;
    elements.fileStatus.textContent = `${file.name} loaded: ${questions.length} questions`;
    showMessage(`Loaded ${questions.length} questions from ${file.name}.`, 'success');
    elements.finalPanel.hidden = true;
    elements.quizPanel.hidden = false;
    renderQuestion();
  } catch (error) {
    state.questions = [];
    elements.quizPanel.hidden = true;
    elements.finalPanel.hidden = true;
    showMessage(error.message, 'error');
  }
}

function parseQuestionBank(text) {
  const normalised = text.replace(/^\s*PASTED\s*$/gim, '').trim();
  const headings = [...normalised.matchAll(/^Question\s+(\d+)\s*$/gim)];
  if (headings.length === 0) throw new Error('No question headings were found in this file.');

  const parsed = [];
  const invalidDuplicates = [];
  headings.forEach((heading, index) => {
    const start = heading.index + heading[0].length;
    const end = index + 1 < headings.length ? headings[index + 1].index : normalised.length;
    const question = parseQuestionBlock(heading[1], normalised.slice(start, end));
    if (question.errors.length > 0) {
      invalidDuplicates.push({ question, index });
    } else {
      parsed.push(question);
    }
  });

  const validNumbers = new Set(parsed.map(question => question.number));
  const realErrors = invalidDuplicates.filter(item => !validNumbers.has(item.question.number));
  if (realErrors.length > 0) {
    throw new Error(`Question ${realErrors[0].question.number} is invalid: ${realErrors[0].question.errors[0]}`);
  }

  const questions = [];
  const seen = new Set();
  parsed.forEach(question => {
    if (!seen.has(question.number)) {
      seen.add(question.number);
      questions.push(question);
    }
  });
  if (questions.length === 0) throw new Error('No complete questions were found in this file.');
  return questions;
}

function parseQuestionBlock(number, block) {
  const lines = block.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const answerIndex = lines.findIndex(line => /^Answer\s*:/i.test(line));
  const explanationIndex = lines.findIndex(line => /^Explanation\s*:/i.test(line));
  const options = [];
  lines.forEach(line => {
    const option = line.match(/^([A-D])\.\s*(.+)$/i);
    if (option) options.push({ key: option[1].toUpperCase(), text: option[2].trim() });
  });

  const errors = [];
  if (answerIndex < 0) errors.push('missing Answer label');
  if (explanationIndex < 0) errors.push('missing Explanation label');
  if (answerIndex >= 0 && explanationIndex >= 0 && explanationIndex <= answerIndex) errors.push('Explanation must follow Answer');

  const promptLines = lines.slice(0, answerIndex >= 0 ? answerIndex : lines.length).filter(line => !/^[A-D]\.\s+/i.test(line));
  const prompt = promptLines.join(' ').trim();
  if (!prompt) errors.push('missing question text');

  const answerText = answerIndex >= 0 ? lines[answerIndex].replace(/^Answer\s*:\s*/i, '').trim() : '';
  const explanation = explanationIndex >= 0 ? lines.slice(explanationIndex).join(' ').replace(/^Explanation\s*:\s*/i, '').trim() : '';
  const isTrueFalse = options.length === 0 && /\b(true|false)\b/i.test(answerText);
  if (!isTrueFalse && options.length === 0) errors.push('missing answer options');
  if (isTrueFalse && !/^(true|false)$/i.test(answerText)) errors.push('true/false answer must be True or False');

  const answers = isTrueFalse ? [answerText.toLowerCase()] : answerText.split(',').map(answer => answer.trim().toUpperCase()).filter(Boolean);
  if (!isTrueFalse && answers.some(answer => !options.some(option => option.key === answer))) errors.push('answer refers to an unknown option');

  return {
    number: Number(number),
    prompt,
    options,
    answers,
    explanation,
    type: isTrueFalse ? 'true-false' : answers.length > 1 ? 'multiple' : 'single',
    errors
  };
}

function renderQuestion() {
  const question = state.questions[state.currentIndex];
  const visibleQuestions = getVisibleQuestions();
  const visiblePosition = visibleQuestions.indexOf(state.currentIndex) + 1;
  const submitted = question.submitted;
  elements.progress.textContent = state.reviewFilter ? `Review ${visiblePosition} of ${visibleQuestions.length}` : `Question ${state.currentIndex + 1} of ${state.questions.length}`;
  elements.progressBar.style.width = `${(visiblePosition / visibleQuestions.length) * 100}%`;
  elements.score.textContent = `Score ${getCounts().correct}`;
  renderQuestionNavigation();
  elements.questionType.textContent = question.type === 'multiple' ? 'Multiple answers' : question.type === 'true-false' ? 'True or false' : 'Single answer';
  elements.questionText.textContent = question.prompt;
  elements.selectionHint.textContent = question.type === 'multiple' ? 'Select every answer that applies.' : 'Select one answer.';
  elements.answerOptions.innerHTML = '';

  const options = question.type === 'true-false' ? [{ key: 'true', text: 'True' }, { key: 'false', text: 'False' }] : question.options;
  options.forEach(option => {
    const label = document.createElement('label');
    label.className = 'option';
    const input = document.createElement('input');
    input.type = question.type === 'multiple' ? 'checkbox' : 'radio';
    input.name = 'answer';
    input.value = option.key;
    const key = document.createElement('span');
    key.className = 'option-letter';
    key.textContent = question.type === 'true-false' ? '' : `${option.key}.`;
    const text = document.createElement('span');
    text.textContent = option.text;
    label.append(input, key, text);
    elements.answerOptions.append(label);
  });

  const selectedAnswers = new Set(question.selected || []);
  elements.answerOptions.querySelectorAll('input').forEach(input => {
    input.checked = selectedAnswers.has(input.value.toLowerCase());
    input.disabled = submitted;
  });
  elements.result.classList.toggle('incorrect', submitted && !question.correct);
  elements.resultHeading.textContent = question.correct ? 'Correct answer' : 'Not quite';
  elements.correctAnswer.textContent = question.type === 'true-false' ? titleCase(question.answers[0]) : question.answers.join(', ');
  elements.explanationText.textContent = question.explanation;
  elements.result.hidden = !submitted;
  elements.confirmButton.hidden = submitted;
  elements.confirmButton.disabled = false;
  elements.nextButton.hidden = false;
  elements.nextButton.textContent = isLastVisibleQuestion() ? 'View summary' : 'Next question';
  elements.previousButton.hidden = !hasPreviousVisibleQuestion();
}

function submitAnswer() {
  if (state.submitted) return;
  const question = state.questions[state.currentIndex];
  const selected = [...elements.answerOptions.querySelectorAll('input:checked')].map(input => input.value.toLowerCase()).sort();
  if (selected.length === 0) {
    showMessage('Select an answer before confirming.', 'error');
    return;
  }

  const expected = [...question.answers].map(answer => answer.toLowerCase()).sort();
  const correct = selected.length === expected.length && selected.every((answer, index) => answer === expected[index]);
  question.selected = selected;
  question.submitted = true;
  question.correct = correct;
  
  // Record wrong answer for Proposal 3
  if (!correct) {
    recordWrongAnswer(question);
  }
  
  elements.score.textContent = `Score ${getCounts().correct}`;
  elements.result.classList.toggle('incorrect', !correct);
  elements.resultHeading.textContent = correct ? 'Correct answer' : 'Not quite';
  elements.correctAnswer.textContent = question.type === 'true-false' ? titleCase(question.answers[0]) : question.answers.join(', ');
  elements.explanationText.textContent = question.explanation;
  elements.result.hidden = false;
  elements.confirmButton.hidden = true;
  elements.nextButton.hidden = false;
  elements.nextButton.textContent = isLastVisibleQuestion() ? 'View summary' : 'Next question';
  elements.answerOptions.querySelectorAll('input').forEach(input => { input.disabled = true; });
  renderQuestionNavigation();
}

function showNextQuestion() {
  if (isLastVisibleQuestion()) return finishQuiz();
  moveQuestion(1);
}

function restartQuiz() {
  state.currentIndex = 0;
  state.reviewFilter = null;
  state.questions.forEach(question => {
    delete question.selected;
    delete question.submitted;
    delete question.correct;
  });
  elements.finalPanel.hidden = true;
  elements.quizPanel.hidden = false;
  renderQuestion();
}

function moveQuestion(direction) {
  saveCurrentSelection();
  const visibleQuestions = getVisibleQuestions();
  const position = visibleQuestions.indexOf(state.currentIndex);
  const nextPosition = position + direction;
  if (nextPosition >= 0 && nextPosition < visibleQuestions.length) {
    state.currentIndex = visibleQuestions[nextPosition];
    renderQuestion();
  }
}

function jumpToQuestion(index) {
  saveCurrentSelection();
  state.currentIndex = index;
  renderQuestion();
}

function saveCurrentSelection() {
  const question = state.questions[state.currentIndex];
  if (!question || question.submitted) return;
  question.selected = [...elements.answerOptions.querySelectorAll('input:checked')].map(input => input.value.toLowerCase());
}

function getVisibleQuestions() {
  if (!state.reviewFilter) return state.questions.map((_, index) => index);
  return state.questions.map((question, index) => ({ question, index })).filter(item => {
    if (state.reviewFilter === 'unanswered') return !item.question.submitted;
    return item.question.submitted && (state.reviewFilter === 'correct' ? item.question.correct : !item.question.correct);
  }).map(item => item.index);
}

function hasPreviousVisibleQuestion() {
  return getVisibleQuestions().indexOf(state.currentIndex) > 0;
}

function isLastVisibleQuestion() {
  const visibleQuestions = getVisibleQuestions();
  return visibleQuestions.indexOf(state.currentIndex) === visibleQuestions.length - 1;
}

function renderQuestionNavigation() {
  elements.questionNavigation.innerHTML = '';
  getVisibleQuestions().forEach(index => {
    const question = state.questions[index];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `question-link ${index === state.currentIndex ? 'current' : ''} ${question.submitted ? (question.correct ? 'correct' : 'wrong') : ''}`;
    button.textContent = index + 1;
    button.title = question.submitted ? (question.correct ? 'Correct answer' : 'Wrong answer') : 'Unanswered';
    button.setAttribute('aria-label', `Question ${index + 1}, ${button.title}`);
    button.addEventListener('click', () => jumpToQuestion(index));
    elements.questionNavigation.append(button);
  });
}

function getCounts() {
  return state.questions.reduce((counts, question) => {
    if (!question.submitted) counts.unanswered += 1;
    else if (question.correct) counts.correct += 1;
    else counts.wrong += 1;
    return counts;
  }, { correct: 0, wrong: 0, unanswered: 0 });
}

function finishQuiz() {
  saveCurrentSelection();
  const counts = getCounts();
  if (counts.unanswered > 0 && !window.confirm(`You have ${counts.unanswered} unanswered questions. Finish the quiz anyway?`)) return;
  
  // Record quiz performance for Proposal 4
  completeQuiz();
  
  state.reviewFilter = null;
  elements.quizPanel.hidden = true;
  elements.finalPanel.hidden = false;
  elements.summaryTotal.textContent = state.questions.length;
  elements.summaryCorrect.textContent = counts.correct;
  elements.summaryWrong.textContent = counts.wrong;
  elements.summaryUnanswered.textContent = counts.unanswered;
  elements.finalScore.textContent = `Score: ${counts.correct} / ${state.questions.length} (${Math.round((counts.correct / state.questions.length) * 100)}%)`;
  elements.finalMessage.textContent = counts.correct === state.questions.length ? 'Perfect score. Excellent work.' : 'Review a result category to strengthen your weaker topics.';
  
  // Update history display
  displayQuizHistory();
}

function startReview(filter) {
  const visibleQuestions = state.questions.map((question, index) => ({ question, index })).filter(item => {
    if (filter === 'unanswered') return !item.question.submitted;
    return item.question.submitted && (filter === 'correct' ? item.question.correct : !item.question.correct);
  });
  if (visibleQuestions.length === 0) {
    showMessage(`There are no ${filter} questions to review.`, 'error');
    return;
  }
  state.reviewFilter = filter;
  state.currentIndex = visibleQuestions[0].index;
  elements.finalPanel.hidden = true;
  elements.quizPanel.hidden = false;
  renderQuestion();
}

function showMessage(text, type) {
  elements.message.textContent = text;
  elements.message.className = `message ${type === 'success' ? 'success' : ''}`;
  elements.message.hidden = false;
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

// ===== PROPOSAL 3: Wrong Answers Export Feature =====

function initializeQuizHistory() {
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

function getQuizName() {
  const fileInput = document.querySelector('#file-input');
  if (fileInput && fileInput.files.length > 0) {
    return fileInput.files[0].name;
  }
  return 'quiz.txt';
}

function recordWrongAnswer(question) {
  const record = {
    quiz_name: getQuizName(),
    question_number: question.number,
    question: question.prompt,
    options: question.options.map(opt => opt.text) || [],
    correct_answer: question.answers[0],
    explanation: question.explanation || ''
  };

  state.wrongAnswers.push(record);
  saveQuizHistoryToLocalStorage();
  console.log('Wrong answer recorded:', record);
}

function saveQuizHistoryToLocalStorage() {
  localStorage.setItem('quiz_wrong_answers', JSON.stringify(state.wrongAnswers));
}

function exportQuizHistoryAsTextFile() {
  if (state.wrongAnswers.length === 0) {
    alert('No wrong answers to export yet.');
    return;
  }

  const originalQuizName = state.wrongAnswers[0].quiz_name;
  const baseFileName = originalQuizName.replace('.txt', '');
  const exportFileName = `wrong${baseFileName}.txt`;

  let fileContent = '';
  
  state.wrongAnswers.forEach((record, index) => {
    fileContent += `Question ${record.question_number}\n`;
    fileContent += `${record.question}\n`;
    
    if (record.options && record.options.length > 0) {
      record.options.forEach((option, idx) => {
        const optionLabel = String.fromCharCode(97 + idx);
        fileContent += `${optionLabel}) ${option}\n`;
      });
    }
    
    fileContent += `Correct Answer: ${record.correct_answer}\n`;
    
    if (record.explanation) {
      fileContent += `Explanation: ${record.explanation}\n`;
    }
    
    if (index < state.wrongAnswers.length - 1) {
      fileContent += '\n';
    }
  });

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
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ===== PROPOSAL 4: Quiz Performance History Feature =====

function loadHistoryFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const csvContent = e.target.result;
      const records = parseQuizHistoryCSV(csvContent);
      state.quizHistory = records;
      saveQuizHistoryToLocalStorageHistory();
      displayQuizHistory();
      updateHistoryStatus(`Loaded ${records.length} quiz records`, 'success');
    } catch (error) {
      console.error('Error loading history file:', error);
      updateHistoryStatus('Error loading file: ' + error.message, 'error');
    }
  };
  reader.readAsText(file);
}

function parseQuizHistoryCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 6) continue;

    const record = {
      timestamp: values[0],
      quiz_name: values[1],
      correct_count: parseInt(values[2]),
      wrong_count: parseInt(values[3]),
      total_count: parseInt(values[4]),
      wrongly_answered_questions: values[5].split(',').map(q => parseInt(q.trim())).filter(q => !isNaN(q))
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

function loadQuizHistoryFromLocalStorage() {
  const saved = localStorage.getItem('quiz_history');
  if (saved) {
    try {
      state.quizHistory = JSON.parse(saved);
      if (state.quizHistory.length > 0) {
        displayQuizHistory();
        updateHistoryStatus(`${state.quizHistory.length} quiz records loaded from device`);
      }
    } catch (error) {
      console.error('Failed to load quiz history:', error);
      state.quizHistory = [];
    }
  }
}

function saveQuizHistoryToLocalStorageHistory() {
  localStorage.setItem('quiz_history', JSON.stringify(state.quizHistory));
}

function completeQuiz() {
  const counts = getCounts();
  const wronglyAnswered = state.questions
    .map((q, idx) => q.submitted && !q.correct ? q.number : null)
    .filter(n => n !== null);

  const historyRecord = {
    timestamp: new Date().toISOString(),
    quiz_name: getQuizName(),
    correct_count: counts.correct,
    wrong_count: counts.wrong,
    total_count: state.questions.length,
    wrongly_answered_questions: wronglyAnswered
  };

  state.quizHistory.push(historyRecord);
  saveQuizHistoryToLocalStorageHistory();
  console.log('Quiz performance recorded:', historyRecord);
}

function displayQuizHistory() {
  if (state.quizHistory.length === 0) {
    const historyDisplay = document.querySelector('#history-display');
    if (historyDisplay) {
      historyDisplay.hidden = true;
    }
    return;
  }

  const tbody = document.querySelector('#history-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  state.quizHistory.forEach(record => {
    const scorePercent = ((record.correct_count / record.total_count) * 100).toFixed(1);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(record.timestamp)}</td>
      <td>${record.quiz_name}</td>
      <td>${record.correct_count}</td>
      <td>${record.wrong_count}</td>
      <td>${record.total_count}</td>
      <td>${scorePercent}%</td>
      <td>${record.wrongly_answered_questions.join(', ')}</td>
    `;
    tbody.appendChild(row);
  });

  const historyDisplay = document.querySelector('#history-display');
  if (historyDisplay) {
    historyDisplay.hidden = false;
  }
}

function formatDate(iso8601String) {
  const date = new Date(iso8601String);
  return date.toLocaleString();
}

function updateHistoryStatus(message, type = 'success') {
  const statusElement = document.querySelector('#history-status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = `muted ${type === 'error' ? 'error' : ''}`;
  }
}

function exportQuizHistoryAsCSV() {
  if (state.quizHistory.length === 0) {
    alert('No quiz history to export.');
    return;
  }

  const headers = ['Timestamp', 'QuizName', 'CorrectCount', 'WrongCount', 'TotalCount', 'WronglyAnsweredQuestions'];

  const rows = state.quizHistory.map(record => [
    record.timestamp,
    record.quiz_name,
    record.correct_count,
    record.wrong_count,
    record.total_count,
    `"${record.wrongly_answered_questions.join(',')}"` 
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  downloadFile(csvContent, 'quiz_history.csv', 'text/csv');
}

if (typeof module !== 'undefined') module.exports = { parseQuestionBank, parseQuestionBlock };