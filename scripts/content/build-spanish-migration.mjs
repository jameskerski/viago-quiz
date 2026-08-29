import fs from 'node:fs';
import { hashRows } from '../migration/lib.mjs';

const [questionsPath, optionsPath, correctionsPath, outputPath] = process.argv.slice(2);
if (![questionsPath, optionsPath, correctionsPath, outputPath].every(Boolean)) {
  throw new Error('usage: node scripts/content/build-spanish-migration.mjs questions.ndjson options.ndjson corrections.json output.sql');
}
const parse = p => fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const q = parse(questionsPath);
const o = parse(optionsPath);
const c = JSON.parse(fs.readFileSync(correctionsPath, 'utf8'));
if (hashRows(q) !== c.baseline.question_sha256 || hashRows(o) !== c.baseline.option_sha256) throw new Error('baseline hash mismatch');
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const qById = new Map(q.map(row => [row.id, row]));
const oById = new Map(o.map(row => [row.id, row]));
const lines = [
  '-- GENERATED REVIEW ARTIFACT. DO NOT APPLY WITHOUT OWNER/PSYCHOMETRIC APPROVAL.',
  'begin;',
  "set local search_path = viago_quiz, pg_catalog;",
];
const questionGuards = Object.keys(c.questions).sort().map(id => {
  const row = qById.get(id); if (!row) throw new Error(`unknown question ${id}`);
  return `(id = ${quote(id)}::uuid and prompt = ${quote(row.prompt)} and prompt_es = ${quote(row.prompt_es)})`;
});
const optionGuards = Object.keys(c.options).sort().map(id => {
  const row = oById.get(id); if (!row) throw new Error(`unknown option ${id}`);
  return `(id = ${quote(id)}::uuid and label = ${quote(row.label)} and label_es = ${quote(row.label_es)})`;
});
lines.push(
  'do $guard$',
  'begin',
  `  if (select count(*) from viago_quiz.questions where ${questionGuards.join(' or ')}) <> ${questionGuards.length} then`,
  "    raise exception 'Spanish question baseline drifted; migration aborted';",
  '  end if;',
  `  if (select count(*) from viago_quiz.question_options where ${optionGuards.join(' or ')}) <> ${optionGuards.length} then`,
  "    raise exception 'Spanish option baseline drifted; migration aborted';",
  '  end if;',
  'end',
  '$guard$;'
);
for (const [id, [, proposed]] of Object.entries(c.questions).sort()) {
  const row = qById.get(id); if (!row) throw new Error(`unknown question ${id}`);
  lines.push(`update viago_quiz.questions set prompt_es = ${quote(proposed)} where id = ${quote(id)}::uuid and prompt = ${quote(row.prompt)} and prompt_es = ${quote(row.prompt_es)};`);
}
for (const [id, [, proposed]] of Object.entries(c.options).sort()) {
  const row = oById.get(id); if (!row) throw new Error(`unknown option ${id}`);
  lines.push(`update viago_quiz.question_options set label_es = ${quote(proposed)} where id = ${quote(id)}::uuid and label = ${quote(row.label)} and label_es = ${quote(row.label_es)};`);
}
lines.push('commit;', '');
fs.writeFileSync(outputPath, lines.join('\n'));
console.log(JSON.stringify({ question_updates: Object.keys(c.questions).length, option_updates: Object.keys(c.options).length }));
