import { createClient } from '@supabase/supabase-js'

// Provide fallback values during the Next.js static build phase 
// to prevent "URL not defined" errors during `npm run build`
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

export const serverSupabase = createClient(supabaseUrl, supabaseKey);
