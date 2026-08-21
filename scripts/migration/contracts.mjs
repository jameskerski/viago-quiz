export const COLORS = ["red", "blue", "green", "yellow"];

export function assertNewAttemptComposition(rows) {
  const likert = rows.filter(row => row.qtype === "likert").length;
  const single = rows.filter(row => row.qtype === "single").length;
  if (rows.length !== 50 || likert !== 25 || single !== 25) {
    throw new Error(`Expected 50 questions (25/25), got ${rows.length} (${likert}/${single})`);
  }
  return { total: rows.length, likert, single };
}

export function describeHistoricalAssignment(rows) {
  return {
    total: rows.length,
    likert: rows.filter(row => row.qtype === "likert").length,
    single: rows.filter(row => row.qtype === "single").length,
    anomaly: rows.length !== 50,
  };
}

export function referenceResult(answers, questions, options) {
  const questionById = new Map(questions.map(row => [row.id, row]));
  const optionById = new Map(options.map(row => [row.id, row]));
  const scores = new Map();
  for (const answer of answers) {
    if (answer.qtype === "likert") {
      const color = questionById.get(answer.question_id)?.likert_color;
      if (color) (scores.get(color) || scores.set(color, []).get(color)).push(answer.likert_value);
    } else {
      const option = optionById.get(answer.option_id);
      for (const color of COLORS) if (option?.[color] > 0) (scores.get(color) || scores.set(color, []).get(color)).push(option[color]);
    }
  }
  const ranked = [...scores].map(([color, points]) => ({
    color, total_score: points.reduce((a, b) => a + b, 0), max_hits: Math.max(...points), pos_hits: points.filter(x => x > 0).length,
  })).sort((a, b) => b.total_score - a.total_score || b.max_hits - a.max_hits || b.pos_hits - a.pos_hits || COLORS.indexOf(a.color) - COLORS.indexOf(b.color));
  return { winner_color: ranked[0]?.color ?? null, results: ranked.map(({ color, total_score }) => ({ color, total_score })) };
}
