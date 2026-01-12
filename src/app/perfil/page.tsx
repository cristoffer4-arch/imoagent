"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { signOut, upsertProfile } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function PerfilPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();
      if (!session?.user) {
        window.location.href = "/login?redirect=/perfil";
        return;
      }

      setEmail(session.user.email ?? "");
      const { data } = await supabaseBrowser
        .from("profiles")
        .select("full_name, role")
        .eq("id", session.user.id)
        .maybeSingle();
      setName(data?.full_name ?? "");
      setRole(data?.role ?? "consultant");
      setLoading(false);
    };

    void load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada");
      await upsertProfile(session.user.id, { full_name: name, role });
      setMessage("Perfil atualizado com sucesso");
    } catch (err) {
      setMessage((err as Error).message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    document.cookie = "imoagent-session=; Max-Age=0; path=/";
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-pink-50 to-purple-50">
        <Loading label="Carregando perfil" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-purple-50 px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Perfil</h1>
          <p className="text-sm text-gray-600">Gerencie seus dados e acesso às IAs</p>
        </div>

        <Card title="Dados pessoais">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" value={email} disabled />
            <Input
              label="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
            <Input
              label="Função"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="consultant"
            />
          </div>
          {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
          <div className="mt-4 flex gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
