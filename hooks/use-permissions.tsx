"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { permissionKey, type Acao, type Recurso } from "@/lib/permissions/catalog";

type PermissionsContextValue = {
  isSuperadmin: boolean;
  escopoDados: "proprio" | "total";
  can: (recurso: Recurso, acao: Acao) => boolean;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({
  permissions,
  isSuperadmin,
  escopoDados,
  children,
}: {
  permissions: string[];
  isSuperadmin: boolean;
  escopoDados: "proprio" | "total";
  children: ReactNode;
}) {
  const value = useMemo<PermissionsContextValue>(() => {
    const set = new Set(permissions);
    return {
      isSuperadmin,
      escopoDados,
      can: (recurso, acao) => isSuperadmin || set.has(permissionKey(recurso, acao)),
    };
  }, [permissions, isSuperadmin, escopoDados]);

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions() precisa estar dentro de <PermissionsProvider>");
  }
  return ctx;
}

/**
 * Esconde a UI quando o usuario nao tem a permissao - so isso. Isto NUNCA
 * substitui a checagem em requirePermission() dentro da Server Action:
 * qualquer pessoa pode chamar a action diretamente sem passar por aqui.
 */
export function Can({
  recurso,
  acao,
  children,
  fallback = null,
}: {
  recurso: Recurso;
  acao: Acao;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = usePermissions();
  return can(recurso, acao) ? <>{children}</> : <>{fallback}</>;
}
