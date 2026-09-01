import fs from 'node:fs';
import crypto from 'node:crypto';

const root='data/v2-research/';
const evidence=JSON.parse(fs.readFileSync(`${root}owner-validation-manifests-readonly.json`,'utf8'));
const bankFiles={
 'viago-validation-bank-183-v1.0.0':'validation-bank-183-v1.0.0.json',
 'viago-validation-bank-293-v2.0.0':'validation-bank-293-v2.0.0.json',
 'viago-validation-bank-292-engagement-v4.0.0':'validation-bank-292-engagement-v4.0.0.json',
 'viago-validation-bank-292-expression-v5.0.0':'validation-bank-292-expression-v5.0.0.json'
};
const banks=Object.fromEntries(Object.entries(bankFiles).map(([id,file])=>[id,JSON.parse(fs.readFileSync(root+file,'utf8'))]));
const stop=new Set('a an and are as at be before but by can do does for from had has have how i if in into is it its me my of on or our so than that the their them then they this to was we what when where which while who why will with would you your'.split(' '));
const tokens=value=>new Set(value.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(x=>x.length>2&&!stop.has(x)));
const jaccard=(a,b)=>{const A=tokens(a),B=tokens(b),shared=[...A].filter(x=>B.has(x)).length;return shared/(A.size+B.size-shared||1)};
const enrich=attempt=>{const bank=banks[attempt.manifest.bank_version];const revisionMap=new Map(bank.questions.map(q=>[q.question_revision_id,q]));const idMap=new Map(bank.questions.map(q=>[q.id,q]));return {...attempt,questions:attempt.manifest.questions.map(q=>{const id=q.question_revision_id.split('@')[0];const metadata=revisionMap.get(q.question_revision_id)||idMap.get(id);if(!metadata)throw new Error(`Missing metadata ${q.question_revision_id}`);return {...q,id,family:metadata.family,construct:metadata.construct,domain:metadata.domain,context:metadata.context,orientation:metadata.orientation};})}};
const attempts=evidence.attempts.map(enrich);
const overlap=(left,right,key)=>{const a=new Map(left.questions.map(q=>[key(q),q]));return right.questions.filter(q=>a.has(key(q))).map(q=>({key:key(q),left_revision:a.get(key(q)).question_revision_id,right_revision:q.question_revision_id,prompt:q.prompt}));};
const pairwise=[];
for(let i=1;i<attempts.length;i++){
 const left=attempts[i-1],right=attempts[i];
 const exactQuestions=overlap(left,right,q=>q.id),exactRevisions=overlap(left,right,q=>q.question_revision_id),families=overlap(left,right,q=>q.family),constructs=overlap(left,right,q=>q.construct);
 const experiential=[];
 for(const a of left.questions)for(const b of right.questions){if(a.id===b.id)continue;const similarity=jaccard(a.prompt,b.prompt);const sameFrame=a.context===b.context&&a.domain===b.domain&&a.orientation===b.orientation; if(similarity>=0.34||(similarity>=0.20&&sameFrame))experiential.push({left_id:a.id,right_id:b.id,left_prompt:a.prompt,right_prompt:b.prompt,similarity:+similarity.toFixed(3),same_frame:sameFrame});}
 experiential.sort((a,b)=>b.similarity-a.similarity);
 pairwise.push({left:{id:left.id,bank:left.manifest.bank_version,started_at:left.started_at,completed:!!left.completed_at},right:{id:right.id,bank:right.manifest.bank_version,started_at:right.started_at,completed:!!right.completed_at},counts:{exact_question:exactQuestions.length,exact_revision:exactRevisions.length,semantic_family:families.length,broad_construct:constructs.length,experiential_near_match:experiential.length},exact_question_matches:exactQuestions,exact_revision_matches:exactRevisions,semantic_family_matches:families,broad_construct_matches:constructs,experiential_near_matches:experiential.slice(0,25)});
}
const learning={id:'EXP2-S-16'};for(const attempt of attempts){const q=attempt.questions.find(q=>q.id===learning.id);if(q)(learning.appearances??=[]).push({attempt_id:attempt.id,bank:attempt.manifest.bank_version,revision_id:q.question_revision_id,position:q.position,prompt:q.prompt,options:q.options});}
const artifact={schema_version:'1.0.0',status:'READ_ONLY_FORENSIC_RESEARCH',source_evidence_hash:evidence.evidence_hash,attempts:attempts.map(a=>({id:a.id,bank:a.manifest.bank_version,started_at:a.started_at,completed_at:a.completed_at,manifest_hash:a.manifest.manifest_hash})),consecutive_pair_count:pairwise.length,pairwise,learning_item:learning,experiential_method:'Cross-attempt, non-identical item pair: prompt-token Jaccard >= 0.34, or >= 0.20 plus identical context/domain/orientation. This is a review screen, not semantic authority.'};
artifact.audit_hash=crypto.createHash('sha256').update(JSON.stringify(artifact)).digest('hex');
fs.writeFileSync(`${root}owner-retest-overlap-audit-v1.0.0.json`,JSON.stringify(artifact,null,2)+'\n');
console.log(JSON.stringify({attempts:artifact.attempts,pairs:pairwise.map(p=>({left:p.left.bank,right:p.right.bank,...p.counts})),learning_appearances:learning.appearances?.length||0,audit_hash:artifact.audit_hash},null,2));
