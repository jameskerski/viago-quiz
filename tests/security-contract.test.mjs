import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSupabaseQuizSchema } from "../lib/supabaseConfig.ts";
import { ATTEMPT_COOKIE, authorizeAttempt, issueAttemptCapability, verifyAttemptCapability } from "../lib/attemptCapability.ts";
import { assertNewAttemptComposition, describeHistoricalAssignment, referenceResult } from "../scripts/migration/contracts.mjs";

test("schema target defaults to current public backend and accepts isolated target", () => {
  assert.equal(getSupabaseQuizSchema({}), "public");
  assert.equal(getSupabaseQuizSchema({ SUPABASE_QUIZ_SCHEMA: "viago_quiz" }), "viago_quiz");
  assert.throws(() => getSupabaseQuizSchema({ SUPABASE_QUIZ_SCHEMA: "traveler" }));
});

test("attempt capability binds one attempt without changing visible flow", () => {
  process.env.QUIZ_ATTEMPT_TOKEN_SECRET = "test-only-secret-with-sufficient-entropy";
  process.env.QUIZ_REQUIRE_ATTEMPT_TOKEN = "true";
  const now = Date.now();
  const token = issueAttemptCapability("attempt-a", now);
  assert.equal(verifyAttemptCapability(token, "attempt-a", now + 1), true);
  assert.equal(verifyAttemptCapability(token, "attempt-b", now + 1), false);
  const req = new Request("https://quiz.test/api/attempt", { headers: { cookie: `${ATTEMPT_COOKIE}=${token}` } });
  assert.equal(authorizeAttempt(req, "attempt-a"), true);
  assert.equal(authorizeAttempt(req, "attempt-b"), false);
  delete process.env.QUIZ_REQUIRE_ATTEMPT_TOKEN;
  delete process.env.QUIZ_ATTEMPT_TOKEN_SECRET;
});

test("current new-attempt behavior remains exactly 25 Likert and 25 single", () => {
  const rows = [...Array.from({ length: 25 }, () => ({ qtype: "likert" })), ...Array.from({ length: 25 }, () => ({ qtype: "single" }))];
  assert.deepEqual(assertNewAttemptComposition(rows), { total: 50, likert: 25, single: 25 });
});

test("historical 0/36/48/53 assignment shapes remain evidence, not errors", () => {
  for (const total of [0, 36, 48, 53]) assert.deepEqual(describeHistoricalAssignment(Array.from({ length: total }, () => ({ qtype: "likert" }))).total, total);
});

test("reference scoring preserves deterministic color tie-break", () => {
  const result = referenceResult(
    [{ qtype: "likert", question_id: "q1", likert_value: 4 }, { qtype: "single", option_id: "o1" }],
    [{ id: "q1", likert_color: "red" }],
    [{ id: "o1", red: 0, blue: 4, green: 0, yellow: 0 }],
  );
  assert.equal(result.winner_color, "red");
  assert.deepEqual(result.results, [{ color: "red", total_score: 4 }, { color: "blue", total_score: 4 }]);
});

test("target SQL denies browser roles and permits historical positions", () => {
  const sql = fs.readFileSync("supabase/migrations/20260821000200_viago_quiz_target.sql", "utf8");
  assert.match(sql, /revoke all on all tables in schema viago_quiz from public, anon, authenticated/i);
  assert.doesNotMatch(sql, /position integer not null check\s*\(position between 1 and 50\)/i);
  assert.doesNotMatch(sql, /unique\s*\(attempt_id\s*,\s*position\)/i);
  assert.match(sql, /foreign key\(question_id,option_id\)/i);
});

test("public attempt payload does not expose scoring metadata", () => {
  const route = fs.readFileSync("app/api/attempt/route.ts", "utf8");
  assert.doesNotMatch(route, /select\([^\n]*(?:red|blue|yellow|green|likert_color)/);
  assert.doesNotMatch(route, /(?:red|blue|yellow|green|likert_color):\s*(?:opt|o|q)/);
});

test("public health response is minimal", () => {
  const route = fs.readFileSync("app/api/health/route.ts", "utf8");
  assert.match(route, /NextResponse\.json\(\{ ok: !error \}/);
  assert.doesNotMatch(route, /prompt|details|hint|error\.message/);
});
