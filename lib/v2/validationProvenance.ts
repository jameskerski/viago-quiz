import activePointer from '@/data/v2-governance/active-validation-bank.json';
import activeBank from '@/data/v2-research/viago-validation-bank-308-human-recognition-v6.0.0.json';

export const ACTIVE_VALIDATION_BANK_ID = activePointer.active_validation_bank_id;
export const ACTIVE_BANK_CREATED_AT = activePointer.created_at;
export const ACTIVE_BANK_ACTIVATED_AT = activePointer.activated_at;
export const ACTIVE_BANK_SOURCE_COMMIT = activePointer.source_commit;
export const ACTIVE_BANK_DEPLOYMENT_ID = activePointer.deployment_id;

export function assertActiveValidationPointer() {
  if (ACTIVE_VALIDATION_BANK_ID !== activeBank.bank_version || activePointer.bank_hash !== activeBank.bank_hash) {
    throw new Error('ACTIVE_VALIDATION_BANK_ID does not match the frozen bank artifact');
  }
}

type ManifestQuestion={question_id:string;question_revision_id:string;prompt:string;format:string;color?:string|null;options:{id:string;option_revision_id?:string;label:string;color:string}[]};
type CurrentQuestion=(typeof activeBank.questions)[number];
export type RevisionComparison='UNCHANGED'|'REWORDED'|'REMAPPED'|'RETIRED'|'REPLACED';

export function compareHistoricalQuestion(question:ManifestQuestion):{state:RevisionComparison;current:CurrentQuestion|null}{
  const current=activeBank.questions.find(q=>q.id===question.question_id);
  if(!current){
    const replacement=activeBank.questions.find(q=>q.active_legacy_id===question.question_id);
    return {state:replacement?'REPLACED':'RETIRED',current:replacement||null};
  }
  if(current.question_revision_id===question.question_revision_id)return {state:'UNCHANGED',current};
  const oldMapping=question.format==='LIKERT'?question.color:question.options.map(o=>`${o.id}:${o.color}`).join('|');
  const newMapping=current.format==='LIKERT'?current.color:current.options.map(o=>`${o.id}:${o.color}`).join('|');
  return {state:oldMapping===newMapping?'REWORDED':'REMAPPED',current};
}
