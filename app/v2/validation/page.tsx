import { RETEST_INTERVAL } from '@/lib/v2/validation';
import { hasAdminSession } from '@/lib/v2/adminAuth';
import { hasValidationAccess } from '@/lib/v2/validationAccess';
import ValidationClient from '@/components/v2/ValidationClient';
import { redirect } from 'next/navigation';
export const dynamic='force-dynamic';
export default async function ValidationPage(){if(!(await hasValidationAccess())&&!(await hasAdminSession()))redirect('/v2/validation/invite');return <ValidationClient retestInterval={RETEST_INTERVAL}/>;}
