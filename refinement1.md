## Proposed Feature Additions

The next version should improve navigation and provide a complete review summary after the quiz.

### Free Question Navigation

The progress area should allow the user to move directly to any question instead of requiring questions to be answered in order.

- Show the current position, such as `Question 1 of 60`.
- Make the progress indicator interactive, for example with clickable question numbers or a question navigation control.
- Allow the user to jump to any question at any time.
- Clearly indicate the current question.
- Visually distinguish questions that are answered correctly, answered incorrectly, or not answered.
- Keep the navigation usable on mobile screens, where a compact list, dropdown, or horizontal scroll area may be more suitable than 60 visible buttons.

### Previous Question Button

Add a **Previous Question** button so the user can return to an earlier question.

- Show the button whenever the current question is not the first question.
- Keep the user's previous answer and its result visible when returning to an answered question.
- Allow the user to revisit an unanswered question without losing progress on other questions.
- The button should work together with direct question navigation.

The existing **Next Question** button should continue to move to the next question. On the final question, it may be labelled **Finish Quiz** or **View Summary**.

### Persistent Answer State

The application should store the state of every question during the current quiz session. Each question should have one of these states:

1. **Unanswered**: the user has not submitted an answer.
2. **Correct**: the submitted answer matches the expected answer.
3. **Wrong**: the user submitted an answer, but it does not match the expected answer.

For each question, the application should remember:

- The user's selected answer or answers
- Whether the answer has been submitted
- Whether the submitted answer is correct
- The correct answer and explanation after submission

When the user revisits a submitted question, the answer controls should remain disabled unless a future feature explicitly allows answer changes. The score should be counted from the stored results and must not increase again when the user revisits a question.

### Quiz Completion and Summary

After the user chooses to finish the quiz, show a summary screen containing:

- The total number of questions
- The number answered correctly
- The number answered incorrectly
- The number left unanswered
- The final score, based only on correctly answered questions
- The percentage score, if useful

For example:

```text
Quiz Summary
Total questions: 60
Correct: 42
Wrong: 12
Unanswered: 6
Score: 42 / 60
```

The summary should also provide review actions:

- **Review correct answers**
- **Review wrong answers**
- **Review unanswered questions**
- **Restart quiz**

Selecting a review action should return the user to the quiz view and show only questions in the selected category. The user should still be able to use the previous button and direct navigation while reviewing.

### Completion Rules

The user should be able to finish the quiz even when some questions are unanswered. Before displaying the summary, show a confirmation message if unanswered questions remain, such as:

`You have 6 unanswered questions. Finish the quiz anyway?`

The user can either continue answering questions or confirm that they want to view the summary. Finishing the quiz should not automatically treat unanswered questions as wrong.

### Updated Success Criteria

These additions are complete when the user can:

- Return to a previous question with a **Previous Question** button.
- Jump directly to any question from the progress navigation.
- See which questions are correct, wrong, or unanswered.
- Navigate away from and return to a question without losing its state.
- Finish the quiz with unanswered questions after confirmation.
- View separate totals for correct, wrong, and unanswered questions.
- Review questions by result category from the summary screen.
