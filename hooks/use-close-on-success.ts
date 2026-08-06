"use client";

import { useEffect, useRef } from "react";

/**
 * Fecha um Dialog controlado quando uma Server Action ligada a
 * useActionState termina SEM erro. Necessario porque o dispatcher
 * devolvido por useActionState nao retorna o estado resolvido para quem
 * chama - o novo estado so fica disponivel no proximo render, entao
 * "await formAction(formData)" seguido de setOpen(false) fecharia o
 * dialog mesmo quando a action falhou.
 */
export function useCloseOnSuccess(
  state: { error: string | null },
  setOpen: (open: boolean) => void
) {
  const initial = useRef(state);

  useEffect(() => {
    if (state !== initial.current && !state.error) {
      setOpen(false);
    }
  }, [state, setOpen]);
}
