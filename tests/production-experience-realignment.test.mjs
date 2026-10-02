import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

test("V2 public experience uses only the established production assessment APIs", () => {
  const quiz = read("app/v2/quiz/quiz-client.tsx");
  const results = read("app/v2/results/[attemptId]/results-client.tsx");

  for (const endpoint of ["/api/start", "/api/attempt", "/api/answer", "/api/finish"]) {
    assert.match(quiz, new RegExp(endpoint.replace("/", "\\/")));
  }
  assert.match(results, /\/api\/results/);

  for (const forbidden of [
    "validation_bank_versions",
    "validation_bank_questions",
    "validation_question_revisions",
    "validation_option_revisions",
    "validation_attempts",
    "/api/v2/validation",
  ]) {
    assert.doesNotMatch(quiz, new RegExp(forbidden));
    assert.doesNotMatch(results, new RegExp(forbidden));
  }
});

test("production routes remain bound to canonical legacy tables and RPCs", () => {
  const start = read("app/api/start/route.ts");
  const attempt = read("app/api/attempt/route.ts");
  const answer = read("app/api/answer/route.ts");
  const finish = read("app/api/finish/route.ts");
  const results = read("app/api/results/route.ts");

  assert.match(start, /from\("quiz_attempts"\)/);
  assert.match(start, /rpc\("pick_balanced_questions_50"/);
  assert.match(start, /count !== 50/);
  assert.match(attempt, /from\("quiz_attempt_questions"\)/);
  assert.match(attempt, /from\("questions"\)/);
  assert.match(attempt, /from\("question_options"\)/);
  assert.match(answer, /from\("quiz_attempt_answers"\)/);
  assert.match(finish, /rpc\("results_for_attempt"/);
  assert.match(results, /rpc\("results_for_attempt"/);

  const productionRoutes = [start, attempt, answer, finish, results].join("\n");
  assert.doesNotMatch(productionRoutes, /validation_(?:bank|question|option|attempt)/);
});

test("public health and participant payload contracts remain minimal", () => {
  const health = read("app/api/health/route.ts");
  const attempt = read("app/api/attempt/route.ts");

  assert.match(health, /select\('id'\)/);
  assert.match(health, /NextResponse\.json\(\{ ok: !error \}/);
  assert.doesNotMatch(health, /prompt|option|score|weight|mapping|participant/i);

  assert.doesNotMatch(attempt, /red_score|blue_score|yellow_score|green_score|likert_color/);
  assert.doesNotMatch(attempt, /validation_|service_role|SUPABASE_SERVICE_ROLE_KEY/);
});
