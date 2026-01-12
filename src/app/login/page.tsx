"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { signIn } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirect = searchParams.get("redirect") ?? "/perfil";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      document.cookie = "imoagent-session=1; path=/; max-age=86400";
      router.push(redirect);
    } catch (err) {
      setError((err as Error).message ?? "Falha ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-purple-50 px-4 py-10">
      <div className="mx-auto max-w-md">
        <Card title="Entrar" subtitle="Acesse a plataforma de IA imobiliária">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Não tem conta? <a className="text-[#E91E63]" href="/signup">Criar conta</a>
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
