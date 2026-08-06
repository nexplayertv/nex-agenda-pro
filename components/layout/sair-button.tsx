"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sair } from "@/app/(public)/login/actions";

export function SairButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await sair();
          router.push("/login");
          router.refresh();
        })
      }
    >
      <LogOut />
      Sair
    </Button>
  );
}
