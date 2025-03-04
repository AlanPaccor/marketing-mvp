import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
export const supabase = supabaseCreateClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: true,
    },
    // Add proper headers for API requests
    global: {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    },
  }
);

// Export a function to create a client (for consistency with your imports)
export function getClient() {
  return supabase;
} 