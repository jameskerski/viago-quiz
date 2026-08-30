import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/v2/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

export const runtime = 'nodejs';

const classifications = new Set(['KEEP', 'LIGHT_REWRITE', 'FULL_REWRITE', 'RETIRE_CANDIDATE', 'DEFER']);
const contentKinds = new Set(['SCENARIO', 'TRADEOFF', 'LIKERT']);
const reviewStatuses = new Set(['NOT_REVIEWED', 'IN_REVIEW', 'REVIEWED']);

function optionalText(value: unknown, max = 4000) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || value.length > max) throw new Error('Invalid text field');
  return value.trim();
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const questionId = optionalText(body.question_id, 64);
    const promptEn = optionalText(body.prompt_en);
    const promptEs = optionalText(body.prompt_es);
    const classification = optionalText(body.review_classification, 32);
    const contentKind = optionalText(body.content_kind, 16);
    const reviewStatus = optionalText(body.review_status, 24) ?? 'NOT_REVIEWED';
    if (!questionId || !promptEn) throw new Error('Question and English wording are required');
    if (classification && !classifications.has(classification)) throw new Error('Invalid review classification');
    if (!contentKind || !contentKinds.has(contentKind)) throw new Error('Invalid content kind');
    if (!reviewStatuses.has(reviewStatus)) throw new Error('Invalid review status');
    const options = Array.isArray(body.options) ? body.options.map((raw) => {
      const option = raw as Record<string, unknown>;
      const id = optionalText(option.id, 64); const labelEn = optionalText(option.label_en); const labelEs = optionalText(option.label_es);
      if (!id || !labelEn) throw new Error('Every option requires canonical identity and English wording');
      return { id, label_en: labelEn, label_es: labelEs };
    }) : [];

    const { data, error } = await supabaseAdmin.rpc('v2_save_question_draft', {
      p_question_id: questionId,
      p_prompt_en: promptEn,
      p_prompt_es: promptEs,
      p_category: optionalText(body.category, 300),
      p_construct: optionalText(body.construct, 300),
      p_dimension: optionalText(body.dimension, 300),
      p_context: optionalText(body.context, 600),
      p_content_kind: contentKind,
      p_review_classification: classification,
      p_review_reason: optionalText(body.review_reason),
      p_review_status: reviewStatus,
      p_notes: optionalText(body.notes),
      p_options: options,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : String(cause) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json() as { question_id?: string };
    if (!body.question_id) throw new Error('question_id is required');
    const { data, error } = await supabaseAdmin.rpc('v2_discard_question_draft', { p_question_id: body.question_id });
    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : String(cause) }, { status: 400 });
  }
}
