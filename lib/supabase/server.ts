import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente server-side que roda com a sessao do usuario logado, portanto
 * RLS se aplica normalmente. Use em Server Components, Server Actions e
 * Route Handlers para qualquer operacao "como o usuario".
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Chamado a partir de um Server Component: pode ser ignorado
            // se o proxy.ts ja cuida de renovar a sessao.
          }
        },
      },
    }
  );
}
