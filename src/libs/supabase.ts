import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Récupération de l'URL et de la clé Supabase via les variables d'environnement
// Si process.env n'est pas configuré, vous pouvez définir vos constantes ou configurer react-native-dotenv.
const env = ((globalThis as any).process?.env) || {};
const SUPABASE_URL = env.SUPABASE_URL || 'https://qnympukdyypckadyyihe.supabase.co';
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFueW1wdWtkeXlwY2thZHl5aWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjA5NDAsImV4cCI6MjA5NzEzNjk0MH0.2MeKeD2aQNNcFPcYsfYGlNBMxfOup0dNOZJur43SPmM';

/**
 * Client Supabase configuré pour React Native.
 * Puisque Firebase gère l'authentification de bout en bout, nous désactivons
 * la persistance et le rafraîchissement automatique de session de Supabase Auth.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
