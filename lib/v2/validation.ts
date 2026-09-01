import { createHash, randomUUID } from 'node:crypto';
import bank from '@/data/v2-research/viago-validation-bank-308-human-recognition-v6.0.0.json';
import { ACTIVE_BANK_ACTIVATED_AT, ACTIVE_BANK_DEPLOYMENT_ID, ACTIVE_BANK_SOURCE_COMMIT, ACTIVE_VALIDATION_BANK_ID, assertActiveValidationPointer } from '@/lib/v2/validationProvenance';

export const VALIDATION_MODE = 'VIAGO_V2_PRIVATE_HUMAN_VALIDATION';
export const BANK_VERSION = ACTIVE_VALIDATION_BANK_ID;
export const BANK_HASH = bank.bank_hash;
export const ASSEMBLER_VERSION = 'VIAGO_RETEST_NOVELTY_ASSEMBLER_V1';
export const SCORING_VERSION = 'viago-validation-scoring-equal-opportunity-v1.0.0';
export const RETEST_INTERVAL = '14–21 days';
export type Color = 'red'|'blue'|'yellow'|'green';
export type BankQuestion = (typeof bank.questions)[number];
export type HistoryExposure={attempt_id:string;completed:boolean;questions:{question_id:string;question_revision_id:string;semantic_family:string;construct?:string}[]};

class DeterministicRng {
  private counter = 0;
  constructor(private readonly seed: string) {}
  next() { return createHash('sha256').update(`${this.seed}|${this.counter++}`).digest().readUIntBE(0, 6) / 2 ** 48; }
  shuffle<T>(values: T[]) { const out=[...values]; for(let i=out.length-1;i>0;i--){const j=Math.floor(this.next()*(i+1));[out[i],out[j]]=[out[j],out[i]];} return out; }
}

export function createSeed() { return randomUUID(); }
export function assembleValidationAttempt(seed: string, history: HistoryExposure[] = []) {
  assertActiveValidationPointer();
  const recent=history.slice(-3);const historySnapshotHash=createHash('sha256').update(JSON.stringify(recent)).digest('hex');
  const rng=new DeterministicRng(`${BANK_VERSION}|${ASSEMBLER_VERSION}|${historySnapshotHash}|${seed}`);
  const chosen: BankQuestion[]=[]; const ids=new Set<string>(); const families=new Map<string,number>(); const constructs=new Map<string,number>();
  let work=0,general=0,selfPreference=0;
  const latest=recent.at(-1)?.questions||[],immediateIds=new Set(latest.map(q=>q.question_id)),seenIds=new Map<string,number>(),seenRevisions=new Map<string,number>(),seenFamilies=new Map<string,number>(),seenConstructs=new Map<string,number>();for(const attempt of recent)for(const q of attempt.questions){seenIds.set(q.question_id,(seenIds.get(q.question_id)||0)+1);seenRevisions.set(q.question_revision_id,(seenRevisions.get(q.question_revision_id)||0)+1);seenFamilies.set(q.semantic_family,(seenFamilies.get(q.semantic_family)||0)+1);if(q.construct)seenConstructs.set(q.construct,(seenConstructs.get(q.construct)||0)+1)}
  const relaxations:string[]=[];const add=(pool: BankQuestion[])=>{const ranked=rng.shuffle(pool).map(q=>({q,penalty:(seenRevisions.get(q.question_revision_id)||0)*100000+(seenIds.get(q.id)||0)*10000+(seenFamilies.get(q.family)||0)*1000+(seenConstructs.get(q.construct)||0)*100})).sort((a,b)=>a.penalty-b.penalty);for(const allowImmediate of [false,true]){for(const {q} of ranked){if(!allowImmediate&&immediateIds.has(q.id))continue;if(ids.has(q.id)||(families.get(q.family)||0)>=1||(constructs.get(q.construct)||0)>=3||(q.work&&work>=8)||(q.context==='general-cross-context'&&general>=18)||(q.orientation==='SELF_PREFERENCE'&&selfPreference>=22))continue;if(allowImmediate&&immediateIds.has(q.id))relaxations.push(`IMMEDIATE_ID:${q.id}`);chosen.push(q);ids.add(q.id);families.set(q.family,(families.get(q.family)||0)+1);constructs.set(q.construct,(constructs.get(q.construct)||0)+1);if(q.work)work++;if(q.context==='general-cross-context')general++;if(q.orientation==='SELF_PREFERENCE')selfPreference++;return;}}throw new Error('Frozen bank cannot satisfy assembler constraints without violating scoring/composition');};
  for(const color of ['red','blue','yellow','green'] as Color[]) for(let i=0;i<6;i++) add(bank.questions.filter(q=>q.format==='LIKERT'&&q.color===color));
  for(let i=0;i<26;i++) add(bank.questions.filter(q=>q.format==='SINGLE_SELECT'));
  const questions=rng.shuffle(chosen).map((q,index)=>({position:index+1,question_revision_id:q.question_revision_id,question_id:q.id,format:q.format,color:q.color,prompt:q.prompt,domain:q.domain,context:q.context,semantic_family:q.family,construct:q.construct,option_order:q.format==='SINGLE_SELECT'?rng.shuffle(q.options.map(o=>o.id)):[],options:q.options.map(o=>({...o,option_revision_id:`${q.question_revision_id}:${o.id}`}))}));
  const manifestHash=createHash('sha256').update(JSON.stringify(questions.map(({prompt,options,...q})=>q))).digest('hex');
  return {mode:VALIDATION_MODE,bank_version:BANK_VERSION,bank_hash:BANK_HASH,bank_activated_at:ACTIVE_BANK_ACTIVATED_AT,assembler_version:ASSEMBLER_VERSION,scoring_version:SCORING_VERSION,source_commit:process.env.VERCEL_GIT_COMMIT_SHA||ACTIVE_BANK_SOURCE_COMMIT,source_deployment_id:process.env.VERCEL_DEPLOYMENT_ID||ACTIVE_BANK_DEPLOYMENT_ID,seed,history_snapshot_hash:historySnapshotHash,history_attempt_ids:recent.map(x=>x.attempt_id),history_policy:{completed_attempt_window:3,unfinished_rule:'ANSWERED_REVISIONS_ONLY',fallback_relaxations:relaxations},manifest_hash:manifestHash,questions};
}

export function scoreValidationAttempt(manifest: ReturnType<typeof assembleValidationAttempt>, answers: Record<string,number|string>) {
  const scores:Record<Color,number>={red:0,blue:0,yellow:0,green:0};
  for(const q of manifest.questions){const answer=answers[q.question_revision_id];if(q.format==='LIKERT'&&typeof answer==='number'&&q.color)scores[q.color as Color]+=answer;else if(q.format==='SINGLE_SELECT'&&typeof answer==='string'){const option=q.options.find(o=>o.id===answer);if(option?.color)scores[option.color as Color]+=4;}}
  const ranking=(Object.entries(scores) as [Color,number][]).sort((a,b)=>b[1]-a[1]||['red','blue','yellow','green'].indexOf(a[0])-['red','blue','yellow','green'].indexOf(b[0]));
  return {scores,primary:ranking[0][0],secondary:ranking[1][0],margin:ranking[0][1]-ranking[1][1],ranking:ranking.map(([color])=>color)};
}

export function publicManifest(manifest: ReturnType<typeof assembleValidationAttempt>){return {...manifest,questions:manifest.questions.map(q=>({position:q.position,question_revision_id:q.question_revision_id,format:q.format,prompt:q.prompt,options:q.option_order.map(id=>{const option=q.options.find(o=>o.id===id);return{id,option_revision_id:option?.option_revision_id,label:option?.label||''};})}))};}
