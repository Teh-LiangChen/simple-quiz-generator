# Revision Quiz Generator

A simple AI generated browser-based quiz generator for revision. The app reads questions, answers, and explanations from a local text file and presents them as an interactive quiz.

The app uses only:

- HTML
- CSS
- JavaScript

There is no backend, database, framework, or build step. The selected question file is processed locally in the browser and is not uploaded.

## Features

- Load a local `.txt` question bank.
- Support single-answer multiple-choice questions.
- Support multiple-answer multiple-choice questions.
- Support true/false questions.
- Reveal the correct answer and explanation after submission.
- Navigate directly to any question.
- Move to the previous or next question.
- Preserve selected answers and submitted results while navigating.
- Show correct, wrong, and unanswered question states.
- Finish the quiz with unanswered questions after confirmation.
- Display a final summary with total, correct, wrong, unanswered, score, and percentage.
- Review correct, wrong, or unanswered questions separately.
- Restart the current quiz.

## Files

- `index.html` - Page structure and quiz interface.
- `styles.css` - Layout, responsive styling, and visual states.
- `app.js` - File loading, parsing, quiz state, navigation, scoring, and summaries.
- `Question Bank/Example_Question_file.txt` - Public example question bank covering all supported question types.

## Running the App

Because this is a static app, it can be opened directly in a browser. A local server is recommended for a more reliable browser environment.

### Using Python

Open a terminal in the project folder and run:

```text
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Stop the server with `Ctrl+C` when finished.

## How to Use the App

1. Open the app in a browser.
2. Select **Choose file**.
3. Select a supported `.txt` question bank, such as `Question Bank/Example_Question_file.txt`.
4. Read the displayed question and select an answer.
5. Select **Confirm answer**.
6. Read the result, correct answer, and explanation.
7. Use **Next question**, **Previous question**, or the question navigation bar to move around the quiz.
8. Select any question number to jump directly to that question.
9. Finish the quiz from the final question.
10. If questions are unanswered, confirm that you want to finish.
11. Use the summary actions to review correct, wrong, or unanswered questions.

Answered questions cannot be changed during the current quiz session. Selecting **Restart quiz** clears all answers and starts again from Question 1.

## Question File Format

Each question starts with a heading such as `Question 1` and ends with an `Answer:` and an `Explanation:` line.

### Single-answer multiple choice

```text
Question 1
Which color is made by mixing blue and yellow?
A. Green
B. Orange
C. Purple
D. Red
Answer: A
Explanation: Mixing blue and yellow creates green.
```

### Multiple-answer multiple choice

Separate multiple correct option letters with commas:

```text
Question 2
Which of the following are fruits?
A. Apple
B. Carrot
C. Banana
D. Potato
Answer: A, C
Explanation: Apples and bananas are fruits. Carrots and potatoes are vegetables.
```

### True or false

True/false questions do not need lettered options:

```text
Question 3
The Earth orbits the Sun.
Answer: True
Explanation: The Earth travels around the Sun once approximately every year.
```

## File Parsing Rules

- Blank lines are ignored.
- Option labels must use the form `A.`, `B.`, `C.`, or `D.`.
- Answers may contain spaces after commas.
- Explanations may contain multiple lines.
- Every question must have an answer and explanation.
- Multiple-answer responses must refer to valid option letters.
- Incomplete duplicate question blocks are ignored when a complete block with the same question number exists.
- Invalid question files produce an error message instead of starting the quiz.

## Git Repository Note

The `.gitignore` file excludes everything inside `Question Bank` except `Example_Question_file.txt`. This keeps personal or sensitive question banks, such as `prelim2526.txt`, out of the GitHub repository while providing a safe file that demonstrates the required format.

## Browser Compatibility

The app requires a modern browser with support for:

- The File API
- JavaScript modules are not required
- Standard HTML, CSS, and JavaScript APIs

No internet connection is required after the app files are available locally, except that the current stylesheet references Google Fonts for typography.
