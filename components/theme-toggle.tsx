"use client";

import { useEffect, useState, useTransition } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => setMontado(true));
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Alternar tema claro/escuro"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {montado && resolvedTheme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
