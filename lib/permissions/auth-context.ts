import "server-only";

import { createClient } from "@/lib/supabase/server";
import { permissionKey, type Acao, type Recurso } from "@/lib/permissions/catalog";

export type AuthContext = {
  userId: string;
  nome: string;
  email: string;
  fotoUrl: string | null;
  isSuperadmin: boolean;
  empresaId: string | null;
  usuarioEmpresaId: string | null;
  cargoId: string | null;
  cargoNome: string | null;
  escopoDados: "proprio" | "total";
  profissionalId: string | null;
  permissions: Set<string>;
};

/**
 * Carrega tudo que as paginas/Server Actions precisam saber sobre o
 * usuario logado: empresa ativa, cargo, escopo de dados e o mapa de
 * permissoes ja resolvido (cargo + overrides individuais). Uma unica
 * leitura por request-tree, reaproveitada via React `cache()` seria o
 * proximo passo de otimizacao quando o volume de paginas justificar.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nome, email, foto_url, tipo")
    .eq("id", user.id)
    .single();

  const isSuperadmin = usuario?.tipo === "superadmin";

  const { data: usuarioEmpresa } = await supabase
    .from("usuarios_empresas")
    .select("id, empresa_id, cargo_id, escopo_dados, cargos(nome)")
    .eq("usuario_id", user.id)
    .eq("status", "ativo")
    .maybeSingle();

  const { data: funcionario } = usuarioEmpresa
    ? await supabase
        .from("funcionarios")
        .select("profissional_id")
        .eq("usuario_empresa_id", usuarioEmpresa.id)
        .maybeSingle()
    : { data: null };

  const permissions = new Set<string>();

  if (usuarioEmpresa && !isSuperadmin) {
    const [{ data: doCargo }, { data: overrides }] = await Promise.all([
      supabase
        .from("permissoes_cargos")
        .select("permitido, permissoes(recurso, acao)")
        .eq("cargo_id", usuarioEmpresa.cargo_id)
        .eq("permitido", true),
      supabase
        .from("permissoes_usuarios")
        .select("permitido, permissoes(recurso, acao)")
        .eq("usuario_empresa_id", usuarioEmpresa.id),
    ]);

    for (const row of doCargo ?? []) {
      const p = row.permissoes as unknown as { recurso: Recurso; acao: Acao } | null;
      if (p) permissions.add(permissionKey(p.recurso, p.acao));
    }
    for (const row of overrides ?? []) {
      const p = row.permissoes as unknown as { recurso: Recurso; acao: Acao } | null;
      if (!p) continue;
      const key = permissionKey(p.recurso, p.acao);
      if (row.permitido) permissions.add(key);
      else permissions.delete(key);
    }
  }

  const cargoRelacionado = usuarioEmpresa?.cargos as unknown as { nome: string } | null;

  return {
    userId: user.id,
    nome: usuario?.nome ?? user.email ?? "",
    email: usuario?.email ?? user.email ?? "",
    fotoUrl: usuario?.foto_url ?? null,
    isSuperadmin,
    empresaId: usuarioEmpresa?.empresa_id ?? null,
    usuarioEmpresaId: usuarioEmpresa?.id ?? null,
    cargoId: usuarioEmpresa?.cargo_id ?? null,
    cargoNome: cargoRelacionado?.nome ?? null,
    escopoDados: (usuarioEmpresa?.escopo_dados as "proprio" | "total") ?? "total",
    profissionalId: funcionario?.profissional_id ?? null,
    permissions,
  };
}

export function podeContexto(ctx: AuthContext, recurso: Recurso, acao: Acao): boolean {
  if (ctx.isSuperadmin) return true;
  return ctx.permissions.has(permissionKey(recurso, acao));
}
