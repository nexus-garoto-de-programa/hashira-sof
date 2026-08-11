import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://smzfetgrxmejhzvxuovv.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtemZldGdyeG1lamh6dnh1b3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzgzMzYsImV4cCI6MjEwMTYxNDMzNn0.1JhX7Zua-pov-4-8Lm66hhZt0y3NZDOHZR-7HdEBAN8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
