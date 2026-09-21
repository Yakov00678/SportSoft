// Проверь, чтобы буквы между https:// и .supabase.co в точности совпадали с ID из Supabase!
const SUPABASE_URL = 'https://otuzyrjmdgsbswkcuwpk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yEbPDGl3cXCQnP6AMvgKQg_XlceuFYi';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);