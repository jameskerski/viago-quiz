export function quizWritesFrozen() {
  return process.env.QUIZ_WRITE_FREEZE?.trim().toLowerCase() === "true";
}
