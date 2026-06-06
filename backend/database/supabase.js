const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

if (supabaseUrl.includes('/storage/')) {
  throw new Error(
    'SUPABASE_URL must be the Project/API URL (e.g. http://127.0.0.1:54331), not the S3 storage URL. Run: supabase status -o env'
  );
}

if (!supabaseServiceKey.startsWith('eyJ')) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY must be the JWT service_role key (starts with eyJ), not an S3 access secret. Run: supabase status -o env'
  );
}

// Service role client — full DB access (server-side only, never expose to client)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabase;
