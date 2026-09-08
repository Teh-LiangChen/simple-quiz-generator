
# Revision Quiz Generator Proposal

## Overview

Create a simple browser-based quiz generator for revision. The user selects a local text file containing questions, answers, and explanations. The application reads the file, creates a quiz, and reveals the correct answer and explanation only after the user submits an answer.

The project will use only:

- HTML for the page structure
- CSS for layout and visual styling
- JavaScript for file loading, question parsing, quiz interaction, and scoring

No backend, database, framework, or build tool is required.

## Input File Format

The selected text file will contain one or more questions using this structure:

```text
Question 1
Question text
A. First option
B. Second option
C. Third option
D. Fourth option
Answer: A
Explanation: Explanation text
```

The parser will identify each question by its `Question` heading and read the following content until the next question. It will use the `Answer:` and `Explanation:` labels to determine the result shown after submission.

The format must support these three question types:

1. **Single-answer multiple choice**
	- The user selects one option.
	- Example answer: `A`

2. **Multiple-answer multiple choice**
	- The user can select more than one option using checkboxes.
	- Example answer: `A, C, D`
	- The answer is correct only when the selected options exactly match the correct options.

3. **True or false**
	- The user selects either `True` or `False`.
	- The answer is checked in the same way as other single-answer questions.

## User Flow

1. The user opens the quiz generator.
2. The user selects a `.txt` file using a file picker.
3. The application validates and parses the file.
4. The first question and its choices are displayed.
5. The user selects an answer and presses **Confirm Answer**.
6. The application displays:
	- Whether the answer is correct
	- The correct answer
	- The explanation
7. The user presses **Next Question** to continue.
8. After the final question, the application displays the final score and an option to restart the quiz or load another file.

The application should prevent confirmation until the user has selected an answer. After an answer is confirmed, the choices should be disabled so the result cannot be changed accidentally.

## Main Interface

The page should contain:

- A file selection area
- A short status message for loading or parsing errors
- A quiz area that shows the current question
- Answer controls appropriate to the question type
- A `Confirm Answer` button
- A result and explanation area, hidden until submission
- A `Next Question` button, shown after submission
- Progress information such as `Question 2 of 20`
- A final score view

The interface should be usable on both desktop and mobile screens. The styling should remain simple, readable, and focused on revision rather than decoration.

## Parsing and Validation Rules

JavaScript should validate the selected file before starting the quiz. It should report a clear error if:

- The file contains no questions.
- A question has no answer.
- A question has no explanation.
- A multiple-choice question has no recognizable options.
- A multiple-answer response contains invalid option letters.
- A question uses an unsupported or inconsistent structure.

The parser should ignore blank lines and allow spaces after labels such as `Answer:` and `Explanation:`. It should preserve the full explanation text, including explanations that continue across multiple lines.

## Quiz Behaviour

- Questions should be presented in the order they appear in the file.
- The score should increase only when the submitted answer is correct.
- Multiple-answer selections should be compared without depending on the order in which the user selects them.
- The correct answer and explanation should remain visible until the user moves to the next question.
- The user should be able to restart the current quiz without selecting the file again.
- Loading another file should reset the current quiz and score.

## Suggested Implementation Structure

The implementation can be organized into three simple responsibilities:

1. **File handling**
	- Open the browser file picker.
	- Read the selected text file with the File API.

2. **Question parsing and quiz state**
	- Convert the text into question objects.
	- Track the current question, selected answers, submitted state, and score.

3. **User interface rendering**
	- Render the question and answer controls.
	- Show validation messages, results, explanations, progress, and the final score.

These responsibilities can remain in a small number of JavaScript functions; no complex architecture is needed for the first version.

## Initial Success Criteria

The first version is complete when a user can:

- Select a supported text file from their computer.
- Generate a quiz containing all three question types.
- Submit single-answer, multiple-answer, and true/false responses.
- See the correct answer and explanation after each submission.
- Track progress and receive a final score.
- Receive understandable feedback when the input file is invalid.

## Possible Future Improvements

Future versions could add question randomisation, category filtering, retrying incorrect questions, importing additional file formats, and saving progress locally. These features are outside the scope of the initial simple implementation.