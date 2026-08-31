import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const x=JSON.parse(fs.readFileSync(path.join(root,'data/v2-reconstruction/development-candidate-review-batch-a.json'),'utf8'));
test('Batch A contains exactly the first 28 governed candidates',()=>{assert.equal(x.records.length,28);assert.equal(x.records[0].candidate_id,'C01-L-R-01');assert.equal(x.records[27].candidate_id,'C02-S-12');assert.equal(new Set(x.records.map(r=>r.candidate_id)).size,28);});
test('dispositions and early unique count reconcile',()=>{assert.deepEqual(x.counts,{ADMIT:10,REVISE:3,REPLACE_LEGACY:11,DEFER_REDUNDANCY:4,RETIRE_CANDIDATE:0});assert.equal(97-12+11+10+3,109);assert.equal(x.early_potential_unique_bank_count,109);});
test('replacement candidates cover legacy identities once',()=>{const rs=x.records.filter(r=>r.decision==='REPLACE_LEGACY');assert.equal(rs.length,11);assert.equal(new Set(rs.flatMap(r=>r.replaced_legacy_identities.map(y=>y.question_id))).size,12);});
test('every candidate has complete comparison evidence',()=>{for(const r of x.records){assert.ok(r.closest_reconstructed_legacy?.question_id);assert.ok(r.closest_development_candidate);assert.ok(r.semantic_family);assert.ok(r.what_unique_value_it_adds);assert.ok(r.why);}});
test('review stays isolated from runtime',()=>{for(const f of [...walk(path.join(root,'app')),...walk(path.join(root,'lib'))])assert.doesNotMatch(fs.readFileSync(f,'utf8'),/development-candidate-review-batch-a|DEVELOPMENT_CANDIDATE_REVIEW_BATCH_A/);});
test('OWNER handoff contains all 28 candidates and required summaries',()=>{const d=fs.readFileSync(path.join(root,'docs/v2/DEVELOPMENT_CANDIDATE_REVIEW_BATCH_A.md'),'utf8');assert.equal((d.match(/^## \d+\./gm)||[]).length,28);for(const h of ['## Executive Summary','## Batch A counts','## Coverage observations','## Backlog implications','## OWNER decisions required','## Production boundary'])assert.ok(d.includes(h));});
function* walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())yield* walk(f);else yield f;}}
