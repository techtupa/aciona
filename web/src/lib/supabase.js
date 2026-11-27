import { createClient } from '@supabase/supabase-js'

// Cliente do Supabase no navegador: só para login e sessão.
// Os dados (gravar, consultar) passam pela API do Aciona.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

// Token da sessão atual, ou null se ninguém entrou.
export async function lerToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
