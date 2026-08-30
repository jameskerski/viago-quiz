export const DB_TIE_ORDER = ['red', 'blue', 'green', 'yellow'];
export const ATTEMPT_TARGETS = { likert: { red: 6, blue: 6, yellow: 6, green: 7 }, single: 25 };

export function scoreAttempt(answers, questions, options) {
  const questionMap = new Map(questions.map((row) => [row.id, row]));
  const optionMap = new Map(options.map((row) => [row.id, row]));
  const contributions = [];
  for (const answer of answers) {
    if (answer.qtype === 'likert') {
      const color = questionMap.get(answer.question_id)?.likert_color;
      if (color && Number.isInteger(answer.likert_value)) contributions.push({ color, points: answer.likert_value });
      continue;
    }
    const option = optionMap.get(answer.option_id);
    if (!option) continue;
    for (const color of DB_TIE_ORDER) if (option[color] > 0) contributions.push({ color, points: option[color] });
  }
  const rows = DB_TIE_ORDER.map((color, ord) => {
    const values = contributions.filter((row) => row.color === color).map((row) => row.points);
    if (!values.length) return null;
    return { color, total_score: values.reduce((sum, value) => sum + value, 0), max_hits: Math.max(...values), pos_hits: values.filter((value) => value > 0).length, ord };
  }).filter(Boolean);
  rows.sort((a, b) => b.total_score - a.total_score || b.max_hits - a.max_hits || b.pos_hits - a.pos_hits || a.ord - b.ord);
  return { winner_color: rows[0]?.color ?? null, ranked: rows };
}

export function mulberry32(seed) {
  return function random() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function sample(rows, count, random) {
  const copy = [...rows];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy.slice(0, count);
}

export function assembleAttempt(questions, seed) {
  const random = mulberry32(seed);
  const selected = [];
  for (const [color, count] of Object.entries(ATTEMPT_TARGETS.likert)) {
    const pool = questions.filter((row) => row.active && row.qtype === 'likert' && row.likert_color === color);
    if (pool.length < count) throw new Error(`Insufficient active likert pool for ${color}: ${pool.length} < ${count}`);
    selected.push(...sample(pool, count, random));
  }
  const singles = questions.filter((row) => row.active && row.qtype === 'single');
  if (singles.length < ATTEMPT_TARGETS.single) throw new Error(`Insufficient active single pool: ${singles.length} < ${ATTEMPT_TARGETS.single}`);
  selected.push(...sample(singles, ATTEMPT_TARGETS.single, random));
  return sample(selected, selected.length, random).map((row, index) => ({ ...row, position: index + 1 }));
}
