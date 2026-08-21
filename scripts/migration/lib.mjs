import crypto from "node:crypto";

export const TABLES = [
  "questions", "question_options", "quiz_attempts", "quiz_attempt_questions",
  "quiz_attempt_option_order", "quiz_attempt_answers",
];

export const PK = {
  questions: ["id"], question_options: ["id"], quiz_attempts: ["id"],
  quiz_attempt_questions: ["attempt_id", "question_id"],
  quiz_attempt_option_order: ["attempt_id", "option_id"],
  quiz_attempt_answers: ["attempt_id", "question_id"],
};

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function hashRows(rows) {
  return crypto.createHash("sha256").update(rows.map(canonical).join("\n")).digest("hex");
}

export function compareRows(a, b) {
  const left = canonical(a); const right = canonical(b);
  return { equal: left === right, left, right };
}

export function requireEnv(names) {
  for (const name of names) if (!process.env[name]) throw new Error(`Missing environment variable ${name}`);
}
