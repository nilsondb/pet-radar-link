// Cliente Supabase do Authera Pet.
// Durante a migração do schema legado para o schema novo, mantemos o cliente
// com tipagem flexível para não bloquear o build enquanto as telas são
// adaptadas. Ao fim da migração, types.ts será regenerado e o tipo Database
// voltará a ser aplicado aqui.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<any>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
