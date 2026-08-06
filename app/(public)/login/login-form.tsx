"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEGMENTOS } from "@/lib/utils-domain/segmentos";
import { cadastrar, entrar, type AuthActionState } from "./actions";

const initialState: AuthActionState = { error: null };

export function LoginForm() {
  const [loginState, loginAction, loginPending] = useActionState(entrar, initialState);
  const [cadastroState, cadastroAction, cadastroPending] = useActionState(
    cadastrar,
    initialState
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">AgendaPro</CardTitle>
        <CardDescription>Gestão de serviços, agenda e pagamentos</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="cadastro">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="pt-4">
            <form action={loginAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              {loginState.error && (
                <p className="text-sm text-destructive">{loginState.error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loginPending}>
                {loginPending ? "Entrando..." : "Entrar"}
              </Button>
              <div className="text-center text-sm">
                <Link href="/esqueci-senha" className="text-muted-foreground hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="cadastro" className="pt-4">
            <form action={cadastroAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Seu nome</Label>
                <Input id="nome" name="nome" required autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-cadastro">E-mail</Label>
                <Input
                  id="email-cadastro"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha-cadastro">Senha</Label>
                <Input
                  id="senha-cadastro"
                  name="senha"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomeEmpresa">Nome do negócio</Label>
                <Input id="nomeEmpresa" name="nomeEmpresa" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="segmento">Segmento</Label>
                <Select name="segmento" defaultValue={SEGMENTOS[0].value} required>
                  <SelectTrigger id="segmento" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENTOS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {cadastroState.error && (
                <p className="text-sm text-destructive">{cadastroState.error}</p>
              )}
              <Button type="submit" className="w-full" disabled={cadastroPending}>
                {cadastroPending ? "Criando conta..." : "Criar conta gratuita"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="justify-center text-xs text-muted-foreground">
        Ao continuar, você concorda com os termos de uso da plataforma.
      </CardFooter>
    </Card>
  );
}
