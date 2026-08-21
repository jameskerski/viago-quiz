import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdminClient';

export async function GET() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, prompt')
    .limit(1);

  return NextResponse.json({
    ok: !error,
    error: error ? { message: error.message, details: error.details, hint: error.hint, code: error.code } : null,
    data,
  });
}
