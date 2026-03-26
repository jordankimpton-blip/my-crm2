import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://whqtsjwivnzwqlqymjbc.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_LAXCiwcxljk2WxIvJ7zAIA_P7VjmyIs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
