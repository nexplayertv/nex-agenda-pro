import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/esqueci-senha", "/redefinir-senha", "/convite", "/agendar"];

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

// Paginas do (app) - tenant - onde vale a pena checar assinatura/acesso.
// Nao inclui /assinatura de proposito: e o destino do redirecionamento, e
// nao pode redirecionar pra si mesma. Superadmin ((superadmin)) fica de
// fora por completo - superadmin nunca e bloqueado.
const ROTAS_TENANT_PROTEGIDAS = [
  "/dashboard",
  "/agenda",
  "/agendamentos",
  "/clientes",
  "/servicos",
  "/profissionais",
  "/funcionarios",
  "/pagamentos-entrada",
  "/gateways",
  "/financeiro",
  "/comissoes",
  "/catalogo",
  "/mensagens",
  "/notificacoes",
  "/relatorios",
  "/configuracoes",
];

function isRotaTenantProtegida(pathname: string) {
  return ROTAS_TENANT_PROTEGIDAS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/**
 * Renova a sessao Supabase a cada request e bloqueia acesso as areas
 * autenticadas ((app) e (superadmin)) para quem nao tem sessao valida.
 * O isolamento por empresa e as permissoes granulares NAO dependem deste
 * arquivo - sao garantidos por RLS (banco) e requirePermission() (Server
 * Actions), que continuam validos mesmo se um matcher aqui for alterado
 * por engano.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const { pathname, searchParams } = request.nextUrl;

  // Troca do "code" (PKCE) por sessao para os fluxos de redefinir senha e
  // aceitar convite. Precisa acontecer aqui, no proxy - se feito dentro de
  // um Server Component (como antes), o cookie de sessao nao e persistido
  // de verdade (Server Component nao pode escrever cookies), entao a
  // pagina parecia logada mas a Server Action seguinte via "sessao
  // invalida" ao tentar trocar a senha.
  const code = searchParams.get("code");
  if (code && (pathname === "/redefinir-senha" || pathname.startsWith("/convite/"))) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && isRotaTenantProtegida(pathname)) {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("tipo")
      .eq("id", user.id)
      .single();

    if (usuario?.tipo !== "superadmin") {
      const { data: usuarioEmpresa } = await supabase
        .from("usuarios_empresas")
        .select("empresas(trial_expira_em, ativa)")
        .eq("usuario_id", user.id)
        .eq("status", "ativo")
        .maybeSingle();

      const empresa = usuarioEmpresa?.empresas as unknown as
        | { trial_expira_em: string | null; ativa: boolean }
        | null;

      const vencido = empresa?.trial_expira_em
        ? new Date(empresa.trial_expira_em).getTime() < Date.now()
        : false;

      if (empresa && (!empresa.ativa || vencido)) {
        const url = request.nextUrl.clone();
        url.pathname = "/assinatura";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
