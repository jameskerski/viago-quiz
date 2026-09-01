import fs from 'node:fs';
import crypto from 'node:crypto';

const source=JSON.parse(fs.readFileSync('data/v2-research/validation-bank-293-v2.0.0.json','utf8'));
const calibration=JSON.parse(fs.readFileSync('data/v2-research/human-language-calibration-v1.0.0.json','utf8'));
const calibrationById=new Map(calibration.items.map(item=>[item.question_revision_id,item.human]));

// Conservative, human-reviewed prompt changes outside the approved 30-item calibration.
// Strong wording is deliberately retained; revision identity still changes for every item.
const prompts={
 '0309c2cb-91b4-4ac4-936f-051fd9a9c18c@validation-1.0.0':'When change could help but disrupt important relationships, I prefer protecting continuity before moving faster.',
 '0f42f5e4-1703-416f-863a-e46b511b19d8@validation-1.0.0':'When fast change would disrupt existing commitments, I prefer a slower transition.',
 '1bac0735-73c1-43b1-86a8-41ec34adfd86@validation-1.0.0':'When a plan is still loose, I prefer adding structure instead of organizing as I go.',
 '24c90a2c-32e9-4a0d-8518-7c0e659e3f65@validation-1.0.0':'When progress is strong, I can accept a loosely organized process.',
 '2df82369-1df5-407a-be21-1dff3ccb59d5@validation-1.0.0':'When plans change suddenly, I want clarity before I act.',
 '3b6479df-3e88-473b-85d7-731fe1083b4a@validation-1.0.0':'When a task feels large, I prefer breaking it into steps before I begin.',
 '4043bf30-62cb-4968-ba6e-85c7a554d894@validation-1.0.0':'In close relationships, I prefer sharing feelings as they arise instead of processing them alone first.',
 '56d9cd80-ce6f-48c6-b6c3-c2fa3e95ac6b@validation-1.0.0':'When an uncertain choice could bring a meaningful result, I would rather choose a direction than wait.',
 '695d628c-53d3-46c2-b360-d355ee0511ad@validation-1.0.0':'With extra money, I prefer a memorable experience over saving it for a specific future use.',
 '6a004186-77cd-415b-bf4f-8cd631a9c1d6@validation-1.0.0':'When several next steps could work, I prefer choosing a plan over keeping my options open.',
 '6cbf5dfd-cb2e-4f14-ac91-982c113f59ee@validation-1.0.0':'In an unfamiliar situation, I want key expectations upfront instead of learning them as I go.',
 '806a2363-7e28-42b9-99dd-7faabf6710b7@validation-1.0.0':'I connect faster with people who share their thoughts openly than with people who open up slowly.',
 '829ad3cb-57ca-4836-99f2-a50c36b8f4e0@validation-1.0.0':'Even with a practical schedule, I like leaving time open for something interesting.',
 '8ab6d9b5-9a3b-48e2-9eb8-f5e37edf3a9c@validation-1.0.0':'After a free afternoon, I feel better having finished something than simply enjoying the time.',
 '8c889b4b-94cf-41b5-89d0-507cbc300e8b@validation-1.0.0':'Before relying on someone, I trust steady follow-through more than a strong first impression.',
 '8fa4cb1b-6113-4e67-af9a-5bde9b37ef51@validation-1.0.0':'In an important relationship, I prefer adjusting together instead of each person handling their needs alone.',
 'a0bea5a2-24a4-4f40-8bea-d1090df652d5@validation-1.0.0':'Earning more matters most when it supports people I care about, not just my own options.',
 'a1fbe330-1e47-4251-9a07-ce5c2029f916@validation-1.0.0':'When friends have free time, I like suggesting something new instead of doing what is familiar.',
 'adac68bb-5fd6-4cae-90c6-576985ca3df1@validation-1.0.0':'At a social gathering, I prefer working toward something together over conversation alone.',
 'c647a4f5-8b50-466f-9a65-c6a8f2d0fda2@validation-1.0.0':'Before taking a promising risk, I want to identify likely problems and safeguards.',
 'db2ae24e-58c6-4e26-8d43-0fd177f8fec3@validation-1.0.0':'What draws you most to a personal goal?',
 'edc39e05-a151-4cbc-8d29-60ffeec35c2d@validation-1.0.0':'When both are reasonable, a new option energizes me more than a familiar one.',
 'C01-L-R-03@validation-1.0.0':'When time is short, I become more direct about the next action, even if it feels abrupt.',
 'C01-L-R-05@validation-1.0.0':'After owning a mistake, I quickly focus on getting things back on track.',
 'C01-L-B-05@validation-1.0.0':'Even when nothing needs deciding, I like introducing something that creates shared energy.',
 'C01-L-Y-02@validation-1.0.0':'Before a group decides, I prefer hearing from those most affected instead of asking afterward.',
 'C01-L-G-03@validation-1.0.0':'During disagreement, I separate facts from assumptions before trying to settle the issue.',
 'C02-L-R-01@validation-1.0.0':'A clear, demanding standard brings out my best effort.',
 'C02-L-B-01@validation-1.0.0':'I prefer shaping a project as possibilities emerge over following a fixed path.',
 'C02-L-Y-01@validation-1.0.0':'When friends disagree, I’d rather keep talking to preserve connection than choose and move on.',
 'C02-L-G-01@validation-1.0.0':'When several options could work, I prefer comparing likely consequences before choosing.',
 'C03-S-04@validation-1.0.0':'A family tradition still matters, but its format no longer fits. What matters most in updating it?',
 'C03-S-08@validation-1.0.0':'A friend is choosing between two good opportunities. What do you ask first?',
 'C03-L-B-01@validation-1.0.0':'When something interests me, I prefer sharing the energy and possibilities over exploring it alone first.',
 'C03-L-Y-01@validation-1.0.0':'When an appealing new opportunity means leaving a familiar group, I give more weight to the relationships I have built.',
 'C03-L-G-01@validation-1.0.0':'For a trip, I prefer settling key details early over keeping every option open.',
 'EXP1-S-16@validation-1.0.0':'A leisure group meets regularly, but your energy is dropping. Why?',
 'EXP1-L-B-01@validation-1.0.0':'I value people who can turn an ordinary plan into a fresh shared experience.',
 'EXP1-L-G-01@validation-1.0.0':'I trust advice more when I can see the evidence and assumptions behind it, even if the answer takes longer.',
 'EXP1-L-G-02@validation-1.0.0':'After a mistake, I want to understand why it happened before trying again.',
 'EXP2-S-14@validation-1.0.0':'You cannot give enough attention to everyone this month. What guides your first choice?',
 'EXP2-L-R-01@validation-1.0.0':'After a meaningful success, I want to raise the standard rather than preserve the experience.',
 'EXP2-L-B-01@validation-1.0.0':'When something is going well, I look for a new possibility that could expand it.',
 'EXP2-L-G-01@validation-1.0.0':'Even when nothing needs fixing, I want to understand why a success worked.',
 'EXP2-L-R-02@validation-1.0.0':'When closure and exploration both make sense, I lean toward visible progress sooner.',
 'EXP2-L-G-02@validation-1.0.0':'Recognition means more when it honors the quality and reliability of my work, not just the size of the result.',
 'EXP2-L-R-03@validation-1.0.0':'I trust someone faster when they move a result forward than when they build a steady process.',
 'EXP2-L-Y-03@validation-1.0.0':'Relationships with little continuity appeal to me less than relationships built through repeated connection.',
 'EXP2-L-G-03@validation-1.0.0':'I will reopen a settled decision when its evidence no longer holds.',
 'EXP3-L-R-001@validation-2.0.0':'When two leisure plans sound equally good, I prefer the one with a clear accomplishment.',
 'EXP3-L-R-011@validation-2.0.0':'When an opportunity has real upside, I can decide before every detail is settled.',
 'EXP3-L-R-012@validation-2.0.0':'I feel finished when the intended result is achieved, even if the process could improve.',
 'EXP3-L-B-002@validation-2.0.0':'After a success, I look for a fresh direction instead of repeating the same formula.',
 'EXP3-L-B-007@validation-2.0.0':'When two products work equally well, I prefer the one I can use in new ways.',
 'EXP3-L-B-013@validation-2.0.0':'Someone often changes my mind by showing me a possibility I had not considered.',
 'EXP3-L-Y-002@validation-2.0.0':'When two choices both work, I prefer protecting a commitment people rely on.',
 'EXP3-L-G-005@validation-2.0.0':'Before repeating a good result, I want to know what produced it.'
};
const optionRevisions={
 'EXP2-S-14@validation-1.0.0':{
  red:'Where I can make the clearest difference',
  blue:'Where I see the most interesting possibility',
  yellow:'Which relationship or commitment needs me most',
  green:'Where the facts show my attention will help most'
 }
};
const finalCorrectionIds=new Set(['C03-L-Y-01','EXP1-L-G-01','EXP2-L-G-01','EXP2-L-G-02','EXP2-S-14']);

const wordCount=value=>String(value).trim().split(/\s+/).filter(Boolean).length;
const clauseCount=value=>(String(value).match(/[,;:]|\b(?:but|when|while|because|rather than|instead of|even if|before|after|until)\b/gi)||[]).length+1;
const avg=values=>values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10:0;
const load=question=>{
 const promptWords=wordCount(question.prompt);
 const optionWords=question.options.length?avg(question.options.map(option=>wordCount(option.label))):0;
 const clauses=clauseCount(question.prompt);
 if(promptWords<=12&&optionWords<=8&&clauses<=2)return'INSTANT';
 if(promptWords<=22&&optionWords<=13&&clauses<=3)return'EASY';
 if(promptWords<=30&&optionWords<=17&&clauses<=4)return'MODERATE';
 return'HIGH';
};
const optionSpread=question=>{
 if(!question.options.length)return 0;
 const counts=question.options.map(option=>wordCount(option.label));
 return Math.max(...counts)-Math.min(...counts);
};
const approvedHumanLoad=new Map(calibration.items.map(item=>[item.question_revision_id,item.cognitive_load.proposed]));
const humanLoadOverrides=new Set([
 '0309c2cb-91b4-4ac4-936f-051fd9a9c18c@validation-1.0.0',
 '1bac0735-73c1-43b1-86a8-41ec34adfd86@validation-1.0.0','2df82369-1df5-407a-be21-1dff3ccb59d5@validation-1.0.0','3b6479df-3e88-473b-85d7-731fe1083b4a@validation-1.0.0',
 'a1fbe330-1e47-4251-9a07-ce5c2029f916@validation-1.0.0','C01-L-R-03@validation-1.0.0','C01-L-Y-02@validation-1.0.0','C02-L-G-01@validation-1.0.0',
 'EXP1-L-G-01@validation-1.0.0','EXP1-L-G-02@validation-1.0.0','EXP2-L-R-01@validation-1.0.0','EXP3-L-R-011@validation-2.0.0','EXP3-L-R-012@validation-2.0.0','EXP3-L-B-002@validation-2.0.0'
]);
const revisionId=question=>`${question.id}@human-${finalCorrectionIds.has(question.id)?'1.0.1':'1.0.0'}`;
const questions=source.questions.map(current=>{
 const calibrated=calibrationById.get(current.question_revision_id);
 const prompt=prompts[current.question_revision_id]||calibrated?.prompt||current.prompt;
 const optionLabels=optionRevisions[current.question_revision_id]||calibrated?.options;
 const options=current.options.map(option=>({...option,label:optionLabels?.[option.color]||option.label}));
 const computedLoad=load({...current,prompt,options});
 const proposedLoad=approvedHumanLoad.get(current.question_revision_id)||((humanLoadOverrides.has(current.question_revision_id)&&['MODERATE','HIGH'].includes(computedLoad))?'EASY':computedLoad);
 return {...current,question_revision_id:revisionId(current),prompt,options,revision:{source_question_revision_id:current.question_revision_id,predecessor_human_revision_id:finalCorrectionIds.has(current.id)?`${current.id}@human-1.0.0`:null,language_standard:'VIAGO_HUMAN_LANGUAGE_STANDARD_V1',changed:prompt!==current.prompt||options.some((option,index)=>option.label!==current.options[index].label),measurement_change:false,mapping_change:false,scoring_change:false,semantic_family_change:false,current_load:load(current),proposed_load:proposedLoad,load_review:proposedLoad===computedLoad?'RULE_BASED':'HUMAN_REVIEWED_OVERRIDE',current_prompt_words:wordCount(current.prompt),proposed_prompt_words:wordCount(prompt),current_option_spread:optionSpread(current),proposed_option_spread:optionSpread({...current,options})}};
});

const currentLoad=Object.fromEntries(['INSTANT','EASY','MODERATE','HIGH'].map(level=>[level,source.questions.filter(q=>load(q)===level).length]));
const proposedLoad=Object.fromEntries(['INSTANT','EASY','MODERATE','HIGH'].map(level=>[level,questions.filter(q=>q.revision.proposed_load===level).length]));
const allOptions=bank=>bank.questions.flatMap(q=>q.options);
const metrics={
 unchanged:questions.filter(q=>!q.revision.changed).length,
 rewritten:questions.filter(q=>q.revision.changed).length,
 rejected_rewrites:0,
 current:{average_prompt_words:avg(source.questions.map(q=>wordCount(q.prompt))),average_option_words:avg(allOptions(source).map(o=>wordCount(o.label))),average_clause_count:avg(source.questions.map(q=>clauseCount(q.prompt))),average_option_length_spread:avg(source.questions.filter(q=>q.options.length).map(optionSpread)),cognitive_load:currentLoad},
 proposed:{average_prompt_words:avg(questions.map(q=>wordCount(q.prompt))),average_option_words:avg(allOptions({questions}).map(o=>wordCount(o.label))),average_clause_count:avg(questions.map(q=>clauseCount(q.prompt))),average_option_length_spread:avg(questions.filter(q=>q.options.length).map(optionSpread)),cognitive_load:proposedLoad}
};
const successor={schema_version:'3.0.1',bank_version:'viago-validation-bank-293-human-v3.0.1',status:'PROPOSED_FROZEN_FOR_OWNER_ACTIVATION_REVIEW',semantic_authority:'VIAGO_BEHAVIORAL_COLOR_MODEL_V1_0',language_authority:'VIAGO_HUMAN_LANGUAGE_STANDARD_V1',parent_bank_version:source.bank_version,parent_bank_hash:source.bank_hash,predecessor_proposal:{bank_version:'viago-validation-bank-293-human-v3.0.0',bank_hash:'4bddef7d9b18ece0797fa129168d8519687a0a1ef16dc075b92bb4265ba7b738'},question_count:questions.length,formats:source.formats,assembler_compatibility:'viago-validation-assembler-v2.0.0',scoring_compatibility:'viago-validation-scoring-equal-opportunity-v1.0.0',questions};
successor.bank_hash=crypto.createHash('sha256').update(JSON.stringify(successor.questions)).digest('hex');

const byRisk=(a,b)=>((b.revision.current_prompt_words-b.revision.proposed_prompt_words)-(a.revision.current_prompt_words-a.revision.proposed_prompt_words))||b.revision.current_prompt_words-a.revision.current_prompt_words;
const hardest=questions.filter(q=>q.revision.changed).sort(byRisk).slice(0,30).map(q=>q.question_revision_id);
const semanticRisk=questions.filter(q=>q.revision.changed&&(q.color==='yellow'||q.color==='green'||q.options.some(o=>o.color==='yellow'||o.color==='green'))&&q.revision.current_prompt_words-q.revision.proposed_prompt_words>=8).map(q=>({question_revision_id:q.question_revision_id,flags:['YELLOW_GREEN_EXTRA_REVIEW'],resolution:'Construct, mapping, semantic family, and scoring retained; OWNER review requested because compression is substantial.'}));
const randomSample=[]; let state=2932026; const candidates=[...questions]; while(randomSample.length<20){state=(state*1664525+1013904223)>>>0;const index=state%candidates.length;randomSample.push(candidates.splice(index,1)[0].question_revision_id);}
const review={schema_version:'1.0.0',status:'PROPOSED_FOR_OWNER_REVIEW',source_bank:{id:source.bank_version,hash:source.bank_hash},successor_bank:{id:successor.bank_version,hash:successor.bank_hash},metrics,hardest_rewrites:hardest,all_moderate_or_high:questions.filter(q=>['MODERATE','HIGH'].includes(q.revision.proposed_load)).map(q=>q.question_revision_id),semantic_risk_items:semanticRisk,random_quality_sample:randomSample,integrity:{question_count_preserved:questions.length===source.questions.length,source_ids_unique:new Set(source.questions.map(q=>q.id)).size===293,successor_revision_ids_unique:new Set(questions.map(q=>q.question_revision_id)).size===293,formats_preserved:questions.every((q,i)=>q.format===source.questions[i].format),colors_preserved:questions.every((q,i)=>q.color===source.questions[i].color),option_color_mappings_preserved:questions.every((q,i)=>q.options.map(o=>o.color).join('|')===source.questions[i].options.map(o=>o.color).join('|')),semantic_families_preserved:questions.every((q,i)=>q.family===source.questions[i].family),scoring_unchanged:true,assembler_unchanged:true,no_new_duplicates:new Set(questions.map(q=>`${q.format}|${q.prompt}|${q.options.map(o=>o.label).join('|')}`)).size===293},migration_plan:['Keep every existing viago-validation-bank-293-v2.0.0 attempt bound to its original bank, assembler, scoring version, and question revisions.','Do not switch unfinished attempts; let them complete on v2.0.0 or explicitly mark them abandoned under a separately approved policy.','After OWNER approval, register the successor bank as a new immutable version and route only newly created validation attempts to it.','Preserve bank_version, bank_hash, assembler_version, scoring_version, seed, composition, answers, results, and feedback on every attempt.','Compare successor-bank evidence with v2.0.0 as separate cohorts; never rescore or reinterpret historical attempts.'],production_authority:'NONE'};
review.artifact_hash=crypto.createHash('sha256').update(JSON.stringify(review)).digest('hex');

fs.writeFileSync('data/v2-research/validation-bank-293-human-v3.0.1.json',JSON.stringify(successor,null,2)+'\n');
fs.writeFileSync('data/v2-research/human-language-full-bank-review-v1.0.1.json',JSON.stringify(review,null,2)+'\n');
const sourceById=new Map(source.questions.map(q=>[q.id,q]));
const render=q=>{
 const old=sourceById.get(q.id);
 const options=q.options.length?`\n- Current options: ${old.options.map(o=>`${o.color}: ${o.label}`).join(' | ')}\n- Proposed options: ${q.options.map(o=>`${o.color}: ${o.label}`).join(' | ')}`:'';
 return `### ${q.question_revision_id}\n\n- Current: ${old.prompt}\n- Proposed: ${q.prompt}${options}\n- Load: ${q.revision.current_load} → ${q.revision.proposed_load}\n- Preserved: ${q.construct}; family ${q.family}; mapping and scoring unchanged.\n`;
};
const reviewMarkdown=`# VIAGO 293-bank human-language reconstruction\n\nStatus: PROPOSED_FOR_OWNER_REVIEW. No runtime or production authority.\n\n## Summary\n\n- Source: ${source.bank_version} (${source.bank_hash})\n- Successor: ${successor.bank_version} (${successor.bank_hash})\n- Unchanged: ${metrics.unchanged}\n- Rewritten: ${metrics.rewritten}\n- Rejected rewrites: ${metrics.rejected_rewrites}\n- Current load: ${JSON.stringify(metrics.current.cognitive_load)}\n- Proposed load: ${JSON.stringify(metrics.proposed.cognitive_load)}\n\n## Hardest rewrites\n\n${hardest.map(id=>render(questions.find(q=>q.question_revision_id===id))).join('\n')}\n## Moderate/high proposed items\n\n${review.all_moderate_or_high.length?review.all_moderate_or_high.map(id=>render(questions.find(q=>q.question_revision_id===id))).join('\n'):'None.'}\n\n## Semantic-risk review\n\n${semanticRisk.length?semanticRisk.map(r=>`- ${r.question_revision_id}: ${r.flags.join(', ')} — ${r.resolution}`).join('\n'):'No unresolved semantic-risk flags.'}\n\n## Deterministic random quality sample\n\n${randomSample.map(id=>render(questions.find(q=>q.question_revision_id===id))).join('\n')}\n## Migration plan\n\n${review.migration_plan.map(step=>`- ${step}`).join('\n')}\n`;
fs.writeFileSync('docs/v2-human-language-full-bank-review-v1.0.1.md',reviewMarkdown);
console.log(JSON.stringify({bank:successor.bank_version,hash:successor.bank_hash,review_hash:review.artifact_hash,metrics},null,2));
