let supabase;

async function initSupabase() {
  if (supabase) return supabase;

  const res = await fetch("/api/supabase-credentials");
  const creds = await res.json();

  supabase = window.supabase.createClient(creds.url, creds.key);
  return supabase;
}

window.initSupabase = initSupabase;