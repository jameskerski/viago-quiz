import fs from 'node:fs';
import crypto from 'node:crypto';

const base = process.env.VIAGO_PREVIEW_URL || 'https://viago-quiz-git-v2-personality-platform-pristine5.vercel.app';
const csvPath = '/Users/jameskerski/Documents/Passwords.csv';
const csv = fs.readFileSync(csvPath, 'utf8');
const parseRow = line => line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)?.map(v => v.replace(/^,/, '').replace(/^"|"$/g, '').replaceAll('""', '"')) || [];
const lines = csv.split(/\r?\n/).filter(Boolean);
const headers = parseRow(lines[0]);
const usernameIndex = headers.indexOf('Username');
const passwordIndex = headers.indexOf('Password');
const row = lines.slice(1).map(parseRow).find(values => values[usernameIndex] === 'viago_v2_admin_password');
if (!row?.[passwordIndex]) throw new Error('Canonical VIAGO admin credential was not found');
const login = await fetch(`${base}/api/v2/admin/login`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:row[passwordIndex]})});
if (!login.ok) throw new Error(`Admin login failed (${login.status})`);
const cookie = login.headers.get('set-cookie')?.split(';')[0];
if (!cookie) throw new Error('Admin session cookie was not issued');
const dashboard = await fetch(`${base}/v2/admin/validation`, {headers:{cookie}});
if (!dashboard.ok) throw new Error(`Dashboard retrieval failed (${dashboard.status})`);
const html = await dashboard.text();
const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(match => match[1]);
if (process.env.LIST_VALIDATION_ROWS === '1') {
  console.log(JSON.stringify(rows.map(value => ({text:value.replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim(),ids:[...value.matchAll(/\/v2\/admin\/validation\/([0-9a-f-]{36})/g)].map(match=>match[1])})),null,2));
  process.exit(0);
}
const ownerRows = rows.filter(value => /James/i.test(value) || value.includes('dd97a7d4-b8aa-4c66-8d85-e6eedf6dca97'));
const ids = [...new Set(ownerRows.flatMap(value => [...value.matchAll(/\/v2\/admin\/validation\/([0-9a-f-]{36})/g)].map(match => match[1])))];
if (!ids.length) throw new Error('No OWNER attempts were found in the protected dashboard');
const attempts = [];
for (const id of ids) {
  const response = await fetch(`${base}/api/v2/validation?attempt_id=${id}`, {headers:{cookie}});
  if (!response.ok) throw new Error(`Attempt ${id} retrieval failed (${response.status})`);
  attempts.push(await response.json());
}
attempts.sort((a,b) => new Date(a.started_at) - new Date(b.started_at));
const manifests=attempts.map(({id,attempt_number,manifest,started_at,completed_at})=>({id,attempt_number,manifest,started_at,completed_at}));
const artifact = {schema_version:'1.0.0',evidence_type:'READ_ONLY_OWNER_ATTEMPT_MANIFESTS',privacy_scope:'COMPOSITION_ONLY_NO_ANSWERS_SCORES_OR_FEEDBACK',retrieved_at:new Date().toISOString(),source:base,attempt_count:manifests.length,attempts:manifests};
artifact.evidence_hash = crypto.createHash('sha256').update(JSON.stringify(artifact)).digest('hex');
fs.writeFileSync('data/v2-research/owner-validation-manifests-readonly.json', JSON.stringify(artifact,null,2)+'\n');
console.log(JSON.stringify({attempt_count:attempts.length,attempts:attempts.map(a=>({id:a.id,attempt_number:a.attempt_number,bank:a.manifest.bank_version,started_at:a.started_at,completed_at:a.completed_at,questions:a.manifest.questions.length})),evidence_hash:artifact.evidence_hash},null,2));
