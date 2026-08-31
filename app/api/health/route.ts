import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdminClient';

export async function GET() {
  const { error } = await supabase
    .from('questions')
    .select('id')
    .limit(1);

  return NextResponse.json({ ok: !error }, { status: error ? 503 : 200 });
}
