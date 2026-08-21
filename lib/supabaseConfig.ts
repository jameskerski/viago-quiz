const ALLOWED_SCHEMAS = new Set(["public", "viago_quiz"]);

export function getSupabaseQuizSchema(env: NodeJS.ProcessEnv = process.env) {
  const schema = env.SUPABASE_QUIZ_SCHEMA || "public";
  if (!ALLOWED_SCHEMAS.has(schema)) {
    throw new Error(`Unsupported SUPABASE_QUIZ_SCHEMA: ${schema}`);
  }
  return schema;
}
