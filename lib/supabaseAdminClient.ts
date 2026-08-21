import { createClient } from "@supabase/supabase-js";
import { getSupabaseQuizSchema } from "@/lib/supabaseConfig";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const schema = getSupabaseQuizSchema();

export const supabaseAdmin = createClient(url, serviceRole, {
  auth: { persistSession: false },
  db: { schema },
});
