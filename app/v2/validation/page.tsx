import { requireAdminSession } from '@/lib/v2/adminAuth';
import { RETEST_INTERVAL } from '@/lib/v2/validation';
import ValidationClient from '@/components/v2/ValidationClient';
export const dynamic='force-dynamic';
export default async function ValidationPage(){await requireAdminSession();return <ValidationClient retestInterval={RETEST_INTERVAL}/>;}
