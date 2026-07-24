import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rrhjccfoxylnwfmqtpjs.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyaGpjY2ZveHlsbndmbXF0cGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDkzOTgsImV4cCI6MjEwMDEyNTM5OH0.0yrwEe_4pp4URjpAMa3Q0DXy8MpYnArGmWbl6wv3f3c';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
