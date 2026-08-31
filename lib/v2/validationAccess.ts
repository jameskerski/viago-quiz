import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { BANK_VERSION } from '@/lib/v2/validation';

const ACCESS_COOKIE='viago_validation_cohort';
const ATTEMPT_COOKIE='viago_validation_attempt';
const PARTICIPANT_COOKIE='viago_validation_participant';

function configuration(){
  const enabled=process.env.VIAGO_VALIDATION_COHORT_ENABLED==='true';
  const tokenHash=process.env.VIAGO_VALIDATION_COHORT_TOKEN_HASH?.trim()||'';
  const expiresAt=process.env.VIAGO_VALIDATION_COHORT_EXPIRES_AT?.trim()||'';
  const expires=new Date(expiresAt);
  if(!enabled||!/^[a-f0-9]{64}$/.test(tokenHash)||!expiresAt||Number.isNaN(expires.getTime()))return null;
  return {tokenHash,expiresAt,expires};
}
function equal(a:string,b:string){const A=Buffer.from(a),B=Buffer.from(b);return A.length===B.length&&timingSafeEqual(A,B)}
function sign(kind:string,value:string,config:NonNullable<ReturnType<typeof configuration>>){return createHmac('sha256',config.tokenHash).update(`${kind}|${BANK_VERSION}|${config.expiresAt}|${value}`).digest('hex')}
function active(config:ReturnType<typeof configuration>){return !!config&&Date.now()<config.expires.getTime()}

export async function establishValidationAccess(token:string){
  const config=configuration();if(!config||!active(config))return false;
  const supplied=createHash('sha256').update(token).digest('hex');if(!equal(supplied,config.tokenHash))return false;
  const value=sign('cohort','authorized',config);
  (await cookies()).set(ACCESS_COOKIE,value,{httpOnly:true,secure:true,sameSite:'lax',path:'/',expires:config.expires});
  return true;
}
export async function hasValidationAccess(){
  const config=configuration();if(!config||!active(config))return false;
  const value=(await cookies()).get(ACCESS_COOKIE)?.value||'';
  return equal(value,sign('cohort','authorized',config));
}
export async function bindValidationAttempt(attemptId:string){
  const config=configuration();if(!config||!active(config))throw new Error('Validation cohort access is unavailable');
  const signature=sign('attempt',attemptId,config);
  (await cookies()).set(ATTEMPT_COOKIE,`${attemptId}.${signature}`,{httpOnly:true,secure:true,sameSite:'lax',path:'/api/v2/validation',expires:config.expires});
}
export async function bindValidationParticipant(participantId:string){
  const config=configuration();if(!config||!active(config))throw new Error('Validation cohort access is unavailable');
  const signature=sign('participant',participantId,config);
  (await cookies()).set(PARTICIPANT_COOKIE,`${participantId}.${signature}`,{httpOnly:true,secure:true,sameSite:'lax',path:'/api/v2/validation',expires:config.expires});
}
export async function currentValidationParticipantId(){
  const config=configuration();if(!config||!active(config))return null;
  const value=(await cookies()).get(PARTICIPANT_COOKIE)?.value||'';const dot=value.indexOf('.');if(dot<1)return null;
  const id=value.slice(0,dot),signature=value.slice(dot+1);return equal(signature,sign('participant',id,config))?id:null;
}
export async function canAccessValidationAttempt(attemptId:string){
  const config=configuration();if(!config||!active(config))return false;
  const value=(await cookies()).get(ATTEMPT_COOKIE)?.value||'';const dot=value.indexOf('.');if(dot<1)return false;
  const id=value.slice(0,dot),signature=value.slice(dot+1);return id===attemptId&&equal(signature,sign('attempt',id,config));
}
export function validationAccessStatus(){const config=configuration();return config?{enabled:active(config),expires_at:config.expiresAt,bank_version:BANK_VERSION}:{enabled:false,expires_at:null,bank_version:BANK_VERSION}}
