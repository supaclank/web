import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Create the browser Supabase client. Call this inside onMount (never at
// module scope) so prerendering stays purely static — supabase-js touches
// browser storage on construction.
export function createSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
