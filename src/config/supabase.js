const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Variables d'environnement Supabase manquantes");
}

// Client pour les opérations publiques (avec RLS)
const supabase = createClient(supabaseUrl, supabaseKey);

// Client admin pour les opérations privilégiées (bypass RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const connectSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('count', { count: 'exact', head: true });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur connexion Supabase:', error);
    throw error;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  connectSupabase,
};
