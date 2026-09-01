import { supabaseAdmin } from '@/lib/supabaseAdminClient';

export const OWNER_PREVIEW_ENVIRONMENT = 'preview-owner-validation';

export function configuredValidationEnvironment() {
  const environment = process.env.VIAGO_VALIDATION_ENVIRONMENT?.trim();
  if (!environment) throw new Error('VIAGO_VALIDATION_ENVIRONMENT is not configured');
  if (process.env.VERCEL_ENV !== 'preview') throw new Error('Validation environment authority is Preview-only');
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'v2/personality-platform') throw new Error('Validation environment branch mismatch');
  if (environment !== OWNER_PREVIEW_ENVIRONMENT) throw new Error('Unknown validation environment authority');
  return environment;
}

export async function assertEnvironmentValidationAuthority(expected: {
  bankId: string;
  bankHash: string;
  assemblerVersion: string;
}) {
  const environment = configuredValidationEnvironment();
  const authority = await supabaseAdmin
    .from('validation_runtime_environments')
    .select('environment_key,active_validation_bank_id,assembler_version,changed_at')
    .eq('environment_key', environment)
    .single();
  if (authority.error) throw new Error(`Validation authority unavailable: ${authority.error.message}`);
  if (authority.data.active_validation_bank_id !== expected.bankId || authority.data.assembler_version !== expected.assemblerVersion) {
    throw new Error('Validation environment authority does not match the deployed bank and assembler');
  }
  const bank = await supabaseAdmin
    .from('validation_bank_versions')
    .select('bank_id,bank_hash,activated_at,source_commit,deployment_id,question_count,status')
    .eq('bank_id', expected.bankId)
    .single();
  if (bank.error) throw new Error(`Active validation bank unavailable: ${bank.error.message}`);
  if (bank.data.bank_hash !== expected.bankHash || bank.data.status !== 'ACTIVE_VALIDATION') {
    throw new Error('Validation bank readback does not match the frozen artifact');
  }
  return { environment, authority: authority.data, bank: bank.data };
}
