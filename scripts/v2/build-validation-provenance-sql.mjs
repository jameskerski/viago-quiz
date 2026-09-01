import fs from 'node:fs';
const bank=JSON.parse(fs.readFileSync('data/v2-research/validation-bank-292-expression-v5.0.0.json','utf8'));
const pointer=JSON.parse(fs.readFileSync('data/v2-governance/active-validation-bank.json','utf8'));
const lit=value=>value==null?'null':`'${String(value).replaceAll("'","''")}'`;
const json=value=>`${lit(JSON.stringify(value))}::jsonb`;
const rows=(values)=>values.join(',\n');
const questionRows=bank.questions.map(q=>`(${lit(q.question_revision_id)},${lit(q.id)},${lit(q.prompt)},${lit(q.format)},${lit(q.color)},${json({domain:q.domain,context:q.context,tones:q.tones,orientation:q.orientation,semantic_family:q.family,construct:q.construct,pairs:q.pairs,dimensions:q.dimensions,source:q.source,active_legacy_id:q.active_legacy_id||null,supersedes_revision_id:q.expression_revision?.source_question_revision_id||q.engagement_revision?.source_question_revision_id||q.revision?.source_question_revision_id||null})},${lit(pointer.created_at)}::timestamptz,${lit(pointer.source_commit)},null,${lit(q.expression_revision?.decision||q.engagement_revision?.decision||'Frozen bank registration')},'ACTIVE')`);
const optionRows=bank.questions.flatMap(q=>(q.options||[]).map((o,index)=>`(${lit(`${q.question_revision_id}:${o.id}`)},${lit(q.question_revision_id)},${lit(o.id)},${lit(o.label)},${lit(o.color)},${lit(String(index+1))},${lit(pointer.created_at)}::timestamptz)`));
const memberRows=bank.questions.map((q,index)=>`(${lit(bank.bank_version)},${lit(q.question_revision_id)},${index+1})`);
const sql=`begin;
insert into viago_quiz.validation_question_revisions(question_revision_id,question_id,prompt,format,likert_target,semantic_metadata,created_at,created_by_source,supersedes_revision_id,change_reason,status) values
${rows(questionRows)} on conflict(question_revision_id) do nothing;
insert into viago_quiz.validation_option_revisions(option_revision_id,question_revision_id,option_id,wording,mapped_color,display_identity,created_at) values
${rows(optionRows)} on conflict(option_revision_id) do nothing;
insert into viago_quiz.validation_bank_versions(bank_id,semantic_version,bank_hash,created_at,activated_at,retired_at,source_commit,deployment_id,assembler_version,scoring_version,status,question_count) values
(${lit(bank.bank_version)},'5.0.0',${lit(bank.bank_hash)},${lit(pointer.created_at)}::timestamptz,${lit(pointer.activated_at)}::timestamptz,null,${lit(pointer.source_commit)},${lit(pointer.deployment_id)},${lit(pointer.assembler_version)},${lit(pointer.scoring_version)},'ACTIVE_VALIDATION',${bank.question_count}) on conflict(bank_id) do nothing;
insert into viago_quiz.validation_bank_questions(bank_id,question_revision_id,bank_position) values
${rows(memberRows)} on conflict(bank_id,question_revision_id) do nothing;
insert into viago_quiz.validation_runtime_config(singleton,active_validation_bank_id,changed_at,changed_by,change_reason) values
(true,${lit(bank.bank_version)},${lit(pointer.activated_at)}::timestamptz,'OWNER_AUTHORIZED_DEPLOYMENT','Expression V5 OWNER experience test activation')
on conflict(singleton) do update set active_validation_bank_id=excluded.active_validation_bank_id,changed_at=excluded.changed_at,changed_by=excluded.changed_by,change_reason=excluded.change_reason;
commit;
select b.bank_id,b.bank_hash,b.status,b.activated_at,b.source_commit,b.deployment_id,
 (select count(*) from viago_quiz.validation_bank_questions q where q.bank_id=b.bank_id) question_revisions,
 (select count(*) from viago_quiz.validation_option_revisions) option_revisions,
 c.active_validation_bank_id
from viago_quiz.validation_bank_versions b cross join viago_quiz.validation_runtime_config c where b.bank_id=${lit(bank.bank_version)};
`;
const output=process.argv[2];if(!output)throw new Error('Output path required');fs.writeFileSync(output,sql,{mode:0o600});console.log(JSON.stringify({output,bytes:Buffer.byteLength(sql),questions:questionRows.length,options:optionRows.length,members:memberRows.length}));
