import { NextResponse } from 'next/server';
import { establishValidationAccess } from '@/lib/v2/validationAccess';

export async function GET(request:Request){
  const token=new URL(request.url).searchParams.get('token')||'';
  if(!token||!(await establishValidationAccess(token)))return NextResponse.json({error:'This validation invitation is invalid or expired.'},{status:401});
  return NextResponse.redirect(new URL('/v2/validation',request.url));
}
