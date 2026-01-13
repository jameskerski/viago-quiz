import fs from 'fs';
import path from 'path';

const INPUT = path.resolve('likert_120_seed.csv');
const OUTPUT = path.resolve('likert_120_seed_fixed.csv');

if (!fs.existsSync(INPUT)) {
  console.error('❌ Missing likert_120_seed.csv in project root');
  process.exit(1);
}

const raw = fs.readFileSync(INPUT, 'utf8').trim().split('\n');

const fixed = [];
fixed.push('category,color,prompt,qtype,is_active');

for (const line of raw) {
  if (!line.trim()) continue;

  // Expect: Category,Color,Statement
  const parts = line.split(',').map(p => p.trim());

  if (parts.length < 3) {
    console.warn('⚠️ Skipping malformed line:', line);
    continue;
  }

  const category = parts[0];
  const color = parts[1];
  const prompt = parts.slice(2).join(',');

  fixed.push(
    `"${category}","${color}","${prompt.replace(/"/g, '""')}","likert",true`
  );
}

fs.writeFileSync(OUTPUT, fixed.join('\n'), 'utf8');

console.log(`✅ Wrote ${fixed.length - 1} Likert questions to ${OUTPUT}`);