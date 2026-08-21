import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://smzfetgrxmejhzvxuovv.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtemZldGdyeG1lamh6dnh1b3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzgzMzYsImV4cCI6MjEwMTYxNDMzNn0.1JhX7Zua-pov-4-8Lm66hhZt0y3NZDOHZR-7HdEBAN8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export async function uploadFileToSupabaseStorage(
  file: File,
  folder: "avatars" | "covers" | "attachments" | "drive-design" = "covers"
): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("hashira-media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("[SUPABASE STORAGE ERROR]", error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("hashira-media")
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("[SUPABASE STORAGE EXCEPTION]", err);
    return null;
  }
}
