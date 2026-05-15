import { createClient } from "@supabase/supabase-js";

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL eller NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY mangler i miljøet"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
