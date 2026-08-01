import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// On lit les clés depuis le fichier .env (jamais en dur dans le code)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,          // où garder la session sur le téléphone
    autoRefreshToken: true,         // renouvelle le jeton automatiquement
    persistSession: true,           // garde l'utilisateur connecté entre les lancements
    detectSessionInUrl: false,      // pas de détection d'URL (spécifique au web)
  },
});