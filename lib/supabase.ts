import { createClient } from "@supabase/supabase-js";

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (supabaseUrl) {
  supabaseUrl = supabaseUrl.trim();
  if (supabaseUrl.endsWith("/rest/v1")) {
    supabaseUrl = supabaseUrl.replace("/rest/v1", "");
  }
  if (supabaseUrl.endsWith("/")) {
    supabaseUrl = supabaseUrl.slice(0, -1);
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Please check your environment variables.");
}

const safeUrl = supabaseUrl || "https://placeholder.supabase.co";
const safeKey = supabaseKey || "placeholder-service-role-key";

export const supabase = createClient(safeUrl, safeKey);
