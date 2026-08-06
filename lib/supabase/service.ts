import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente com a service role key: bypassa RLS por completo. NUNCA importe
 * este arquivo em um componente client-side ou exponha o resultado ao
 * navegador. Reservado para: fluxo publico de agendamento (o cliente nao
 * autentica), handlers de webhook (Asaas/Stripe) e leitura/escrita de
 * credenciais de gateway.
 */
export function createServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error("createServiceClient() nao pode ser usado no navegador");
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
