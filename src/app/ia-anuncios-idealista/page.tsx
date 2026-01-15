"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { iaAnunciosIdealista } from "@/lib/gemini";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

type PortalKey =
  | "idealista"
  | "olx"
  | "imovirtual"
  | "casaSapo"
  | "bpi"
  | "facebook";

type PropertyForm = {
  titulo: string;
  tipo: string;
  tipologia: string;
  area: number | undefined;
  preco: number | undefined;
  freguesia: string;
  distrito: string;
  anoConstrucao: string;
  estado: string;
  energia: string;
  descricao: string;
  destaques: string;
};

type AIConfig = {
  tom: string;
  persona: string;
  callToAction: string;
  compliance: boolean;
  variacoes: number;
  portais: PortalKey[];
};

type UploadedPhoto = {
  id: string;
  name: string;
  size: number;
  preview: string;
};

type PortalOutput = {
  title: string;
  description: string;
  highlights: string[];
  checklist: string[];
  cta: string;
  hashtags: string[];
  mock?: boolean;
};

const portalMeta: Record<PortalKey, { label: string; badge: string; accent: string }> = {
  idealista: {
    label: "Idealista",
    badge: "SEO + Destaque",
    accent: "from-emerald-500/20 to-emerald-500/5",
  },
  olx: {
    label: "OLX",
    badge: "Fotos & Mobile",
    accent: "from-fuchsia-500/20 to-fuchsia-500/5",
  },
  imovirtual: {
    label: "Imovirtual",
    badge: "Estrutura técnica",
    accent: "from-cyan-500/20 to-cyan-500/5",
  },
  casaSapo: {
    label: "Casa Sapo",
    badge: "Compliance & RLS",
    accent: "from-indigo-500/20 to-indigo-500/5",
  },
  bpi: {
    label: "BPI Imobiliário",
    badge: "Investidores",
    accent: "from-amber-500/20 to-amber-500/5",
  },
  facebook: {
    label: "Facebook Marketplace",
    badge: "Social + Leads",
    accent: "from-blue-500/20 to-blue-500/5",
  },
};

const steps = [
  { id: 1, label: "Dados do imóvel" },
  { id: 2, label: "Estratégia IA" },
  { id: 3, label: "Fotos & mídia" },
  { id: 4, label: "Resultados & export" },
];

const defaultForm: PropertyForm = {
  titulo: "Apartamento T2 remodelado com varanda e vista rio",
  tipo: "Apartamento",
  tipologia: "T2",
  area: 92,
  preco: 320000,
  freguesia: "Alcântara, Lisboa",
  distrito: "Lisboa",
  anoConstrucao: "2001",
  estado: "Remodelado",
  energia: "B",
  descricao:
    "Luz natural em todas as divisões, varanda virada a sul, cozinha equipada, elevador e garagem.",
  destaques: "Próximo LX Factory; Estação de comboio a 5min; Vista rio; Garagem com carregador EV",
};

const defaultAI: AIConfig = {
  tom: "Confiante e consultivo",
  persona: "Casal jovem à procura de primeira casa perto do centro com transportes e vistas",
  callToAction: "Agende visita privada esta semana e receba dossiê de custos trimestrais.",
  compliance: true,
  variacoes: 3,
  portais: ["idealista", "olx", "imovirtual", "casaSapo", "bpi", "facebook"],
};

const emptyOutputs = (): Record<PortalKey, PortalOutput> => ({
  idealista: {
    title: "",
    description: "",
    highlights: [],
    checklist: [],
    cta: "",
    hashtags: [],
  },
  olx: {
    title: "",
    description: "",
    highlights: [],
    checklist: [],
    cta: "",
    hashtags: [],
  },
  imovirtual: {
    title: "",
    description: "",
    highlights: [],
    checklist: [],
    cta: "",
    hashtags: [],
  },
  casaSapo: {
    title: "",
    description: "",
    highlights: [],
    checklist: [],
    cta: "",
    hashtags: [],
  },
  bpi: {
    title: "",
    description: "",
    highlights: [],
    checklist: [],
    cta: "",
    hashtags: [],
  },
  facebook: {
    title: "",
    description: "",
    highlights: [],
    checklist: [],
    cta: "",
    hashtags: [],
  },
});

const uid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

export default function IAAnunciosIdealistaPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">(
    "checking",
  );
  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<PropertyForm>(defaultForm);
  const [aiConfig, setAIConfig] = useState<AIConfig>(defaultAI);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [portalOutputs, setPortalOutputs] = useState<Record<PortalKey, PortalOutput>>(
    () => emptyOutputs(),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activePortals = useMemo(() => aiConfig.portais, [aiConfig.portais]);

  useEffect(() => {
    const supabase = createSupabaseClient();
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error || !data?.session) {
          setAuthStatus("unauthenticated");
          router.push("/login");
          return;
        }
        setAuthStatus("authenticated");
      })
      .catch(() => {
        if (!isMounted) return;
        setAuthStatus("unauthenticated");
        router.push("/login");
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="text-lg text-slate-200">Precisa de iniciar sessão para usar este módulo.</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
          >
            Ir para login
          </Link>
        </div>
      </div>
    );
  }

  if (authStatus === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center text-slate-200">A validar sessão...</div>
      </div>
    );
  }

  const handleInput = useCallback(
    <K extends keyof PropertyForm>(field: K, value: PropertyForm[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const togglePortal = (portal: PortalKey) => {
    setAIConfig((prev) => {
      const exists = prev.portais.includes(portal);
      return {
        ...prev,
        portais: exists
          ? prev.portais.filter((p) => p !== portal)
          : [...prev.portais, portal],
      };
    });
  };

  const addPhotos = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return;
    const mapped = Array.from(fileList).map((file) => ({
      id: uid(),
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...mapped]);
  }, []);

  const reorderPhotos = useCallback((sourceId: string, targetId: string) => {
    setPhotos((prev) => {
      const sourceIndex = prev.findIndex((p) => p.id === sourceId);
      const targetIndex = prev.findIndex((p) => p.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      const clone = [...prev];
      const [moved] = clone.splice(sourceIndex, 1);
      clone.splice(targetIndex, 0, moved);
      return clone;
    });
  }, []);

  const removePhoto = (id: string) => setPhotos((prev) => prev.filter((p) => p.id !== id));

  const parseAiJson = (text: string) => {
    const cleaned = text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned) as Partial<Record<PortalKey, Partial<PortalOutput>>>;
    } catch {
      return null;
    }
  };

  const buildPortalFallback = (portal: PortalKey): PortalOutput => {
    const highlights = form.destaques
      .split(";")
      .map((h) => h.trim())
      .filter(Boolean)
      .slice(0, 5);
    return {
      title: `${form.tipo} ${form.tipologia} em ${form.freguesia}`,
      description: `${form.descricao} Preço pedido: €${form.preco?.toLocaleString("pt-PT")}. Área: ${form.area} m². Ano: ${form.anoConstrucao}. Estado: ${form.estado}. Classe energética ${form.energia}.`,
      highlights,
      checklist: [
        "Fotos cumprindo TIR 4:3 e legenda",
        "Classe energética visível",
        "Preço e tipologia iguais ao título",
        "Localização sem dados sensíveis",
        "CTA clara e formulário ativo",
      ],
      cta: aiConfig.callToAction,
      hashtags: ["#imobiliario", "#lisboa", "#idealista", "#venda"],
      mock: true,
    };
  };

  const portalToText = (key: PortalKey, data: PortalOutput) => {
    const header = `${portalMeta[key].label} — ${data.title}`;
    const highlights = data.highlights.map((item) => `- ${item}`).join("\n");
    const checklist = data.checklist.map((item) => `✓ ${item}`).join("\n");
    const hashtags = data.hashtags.join(" ");
    return `${header}\n\n${data.description}\n\nDestaques:\n${highlights}\n\nChecklist:\n${checklist}\n\nCTA: ${data.cta}\n${hashtags}`;
  };

  const validateStep = (currentStep: number) => {
    const stepErrors: string[] = [];
    if (currentStep === 1) {
      if (!form.titulo.trim()) stepErrors.push("Título é obrigatório.");
      if (!form.preco) stepErrors.push("Preço é obrigatório.");
      if (!form.area) stepErrors.push("Área é obrigatória.");
      if (!form.freguesia.trim()) stepErrors.push("Localização/Freguesia é obrigatória.");
      if (!form.descricao.trim()) stepErrors.push("Descrição é obrigatória.");
    }
    if (currentStep === 2) {
      if (!aiConfig.persona.trim()) stepErrors.push("Persona/target é obrigatório.");
      if (!aiConfig.callToAction.trim()) stepErrors.push("CTA é obrigatória.");
      if (!aiConfig.portais.length) stepErrors.push("Selecione pelo menos 1 portal.");
    }
    if (currentStep === 3 && photos.length < 1) {
      stepErrors.push("Adicione pelo menos 1 foto para validação.");
    }
    setErrors(stepErrors);
    return stepErrors.length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setErrors([]);
    setStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrev = () => {
    setErrors([]);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const generateContent = async () => {
    if (!validateStep(step)) return;
    setLoading(true);
    setStatusMessage(null);
    setPortalOutputs(emptyOutputs());
    try {
      const portalList = activePortals.join(", ");
      const prompt = `Gere ${aiConfig.variacoes} variantes de anúncio para 6 portais portugueses (Idealista, OLX, Imovirtual, Casa Sapo, BPI Imobiliário, Facebook Marketplace). Responda estritamente em JSON com chaves idealista, olx, imovirtual, casaSapo, bpi, facebook. Cada entrada deve conter: title, description (max 1200 chars), highlights (5 bullets), checklist (5 itens de conformidade legal/portal), cta e hashtags (até 6). Ajuste mensagem para o portal mantendo consistência. Dados do imóvel: ${form.titulo}, ${form.tipo} ${form.tipologia}, ${form.area} m², €${form.preco}, freguesia ${form.freguesia}, distrito ${form.distrito}, ano ${form.anoConstrucao}, estado ${form.estado}, classe energética ${form.energia}. Descrição: ${form.descricao}. Destaques: ${form.destaques}. Persona alvo: ${aiConfig.persona}. Tom: ${aiConfig.tom}. CTA: ${aiConfig.callToAction}. Portais ativos: ${portalList}. As fotos terão legendas automáticas com ordem ${photos.map((p) => p.name).join(" | ")}. Inclua termos de compliance se ${aiConfig.compliance ? "sim" : "não"}.`;

      const response = await iaAnunciosIdealista(prompt);
      if (!response.ok) {
        throw new Error(
          `Falha ao gerar conteúdo (${(response as { status?: number }).status ?? "desconhecido"}).`,
        );
      }

      const parsed = parseAiJson((response as { text?: string; message?: string }).text ?? (response as { message?: string }).message ?? "");
      const nextOutputs: Record<PortalKey, PortalOutput> = emptyOutputs();

      activePortals.forEach((portal) => {
        const aiData = parsed?.[portal];
        nextOutputs[portal] = {
          ...buildPortalFallback(portal),
          ...(aiData ?? {}),
          checklist: aiData?.checklist?.length
            ? aiData.checklist
            : buildPortalFallback(portal).checklist,
          highlights: aiData?.highlights?.length
            ? aiData.highlights
            : buildPortalFallback(portal).highlights,
          mock: Boolean((response as { mock?: boolean }).mock),
        };
      });

      setPortalOutputs((prev) => ({ ...prev, ...nextOutputs }));
      setStatusMessage((response as { mock?: boolean }).mock
        ? "Geração mock (GEMINI_API_KEY ausente). Conteúdo base pronto para exportar."
        : "Conteúdo gerado com sucesso.");
      setStep(4);
    } catch (error) {
      setStatusMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const exportPortal = (portal: PortalKey) => {
    const data = portalOutputs[portal];
    const blob = new Blob([portalToText(portal, data)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `anuncio-${portal}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyPortal = async (portal: PortalKey) => {
    try {
      await navigator.clipboard.writeText(portalToText(portal, portalOutputs[portal]));
      setStatusMessage(`${portalMeta[portal].label} copiado para a área de transferência.`);
    } catch {
      setStatusMessage("Não foi possível copiar agora.");
    }
  };

  const renderStepControls = (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={handlePrev}
        disabled={step === 1 || loading}
        className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-100 hover:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Passo anterior
      </button>
      {step < 4 ? (
        <button
          type="button"
          onClick={handleNext}
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30 transition hover:-translate-y-[1px] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Próximo passo
        </button>
      ) : (
        <button
          type="button"
          onClick={generateContent}
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30 transition hover:-translate-y-[1px] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "A gerar..." : "Regerar anúncios"}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
        >
          ← Voltar
        </Link>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full space-y-6 lg:w-2/3">
            <header>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold">4. IA Anúncios Idealista</h1>
                  <p className="mt-2 text-slate-300">
                    Wizard de 4 passos com geração específica para 6 portais, upload com drag & drop,
                    validações e export imediato.
                  </p>
                </div>
                <div className="rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/40">
                  Gemini + Supabase Edge
                </div>
              </div>
            </header>

            <nav className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {steps.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border px-4 py-3 ${
                    step === item.id
                      ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-50"
                      : item.id < step
                        ? "border-emerald-500/20 bg-white/5 text-emerald-200"
                        : "border-white/10 bg-white/5 text-slate-300"
                  }`}
                >
                  <div className="text-xs uppercase tracking-wide">Passo {item.id}</div>
                  <div className="text-sm font-semibold">{item.label}</div>
                </div>
              ))}
            </nav>

            {errors.length > 0 && (
              <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-rose-50">
                <p className="font-semibold">Atenção ao preencher:</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {errors.map((err) => (
                    <li key={err} className="flex items-center gap-2">
                      <span className="text-rose-200">•</span>
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {step === 1 && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">Dados do imóvel</h2>
                    <p className="text-sm text-slate-400">Título, localização, métricas e energia.</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                    Obrigatório
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-300">Título do anúncio</label>
                    <input
                      value={form.titulo}
                      onChange={(e) => handleInput("titulo", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none ring-emerald-500/30 focus:border-emerald-400"
                      placeholder="Ex.: Apartamento T3 com vista rio e varanda"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Tipo</label>
                    <select
                      value={form.tipo}
                      onChange={(e) => handleInput("tipo", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none focus:border-emerald-400"
                    >
                      {["Apartamento", "Moradia", "Terreno", "Quinta", "Escritório"].map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Tipologia</label>
                    <select
                      value={form.tipologia}
                      onChange={(e) => handleInput("tipologia", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none focus:border-emerald-400"
                    >
                      {["T0", "T1", "T2", "T3", "T4", "T5+"].map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Área (m²)</label>
                    <input
                      type="number"
                      value={form.area ?? ""}
                      onChange={(e) => handleInput("area", Number(e.target.value) || undefined)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Preço (€)</label>
                    <input
                      type="number"
                      value={form.preco ?? ""}
                      onChange={(e) => handleInput("preco", Number(e.target.value) || undefined)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Distrito</label>
                    <input
                      value={form.distrito}
                      onChange={(e) => handleInput("distrito", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none focus:border-emerald-400"
                      placeholder="Lisboa, Porto, Braga..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Freguesia / Zona</label>
                    <input
                      value={form.freguesia}
                      onChange={(e) => handleInput("freguesia", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none focus:border-emerald-400"
                      placeholder="Ex.: Alcântara"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Ano construção</label>
                    <input
                      value={form.anoConstrucao}
                      onChange={(e) => handleInput("anoConstrucao", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Estado</label>
                    <select
                      value={form.estado}
                      onChange={(e) => handleInput("estado", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none focus:border-emerald-400"
                    >
                      {["Novo", "Usado", "Remodelado", "Em construção"].map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Classe energética</label>
                    <select
                      value={form.energia}
                      onChange={(e) => handleInput("energia", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none focus:border-emerald-400"
                    >
                      {["A+", "A", "B", "B-", "C", "D"].map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-300">Descrição detalhada</label>
                    <textarea
                      value={form.descricao}
                      onChange={(e) => handleInput("descricao", e.target.value)}
                      rows={4}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none ring-emerald-500/30 focus:border-emerald-400"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-300">Destaques (separe com ;)</label>
                    <textarea
                      value={form.destaques}
                      onChange={(e) => handleInput("destaques", e.target.value)}
                      rows={2}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none ring-emerald-500/30 focus:border-emerald-400"
                    />
                  </div>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">Estratégia IA</h2>
                    <p className="text-sm text-slate-400">Tom, persona, variações e portais.</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                    Personalizar
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-slate-300">Tom de voz</label>
                    <select
                      value={aiConfig.tom}
                      onChange={(e) => setAIConfig((prev) => ({ ...prev, tom: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none focus:border-emerald-400"
                    >
                      {["Confiante e consultivo", "Premium", "Próximo e humano", "Objetivo", "Investidor"].map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Variações criativas</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={aiConfig.variacoes}
                      onChange={(e) =>
                        setAIConfig((prev) => ({ ...prev, variacoes: Number(e.target.value) || 1 }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-300">Persona alvo</label>
                    <input
                      value={aiConfig.persona}
                      onChange={(e) => setAIConfig((prev) => ({ ...prev, persona: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none ring-emerald-500/30 focus:border-emerald-400"
                      placeholder="Ex.: Famílias que precisam de proximidade a escolas e metro"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-slate-300">Call to Action</label>
                    <input
                      value={aiConfig.callToAction}
                      onChange={(e) => setAIConfig((prev) => ({ ...prev, callToAction: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-50 outline-none ring-emerald-500/30 focus:border-emerald-400"
                      placeholder="Ex.: Marque visita esta semana e receba brochura 3D"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">Portais a gerar (6 suportados)</p>
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={aiConfig.compliance}
                        onChange={(e) => setAIConfig((prev) => ({ ...prev, compliance: e.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 bg-black/50"
                      />
                      Incluir checklist de conformidade
                    </label>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {(Object.keys(portalMeta) as PortalKey[]).map((portal) => {
                      const active = aiConfig.portais.includes(portal);
                      return (
                        <button
                          key={portal}
                          type="button"
                          onClick={() => togglePortal(portal)}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                            active
                              ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-50"
                              : "border-white/10 bg-black/30 text-slate-200 hover:border-emerald-500/40"
                          }`}
                        >
                          <span>{portalMeta[portal].label}</span>
                          <span className="text-xs text-slate-400">{portalMeta[portal].badge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">Fotos e drag & drop</h2>
                    <p className="text-sm text-slate-400">Reordene as fotos para gerar legendas coerentes.</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                    Legendas + ordem
                  </span>
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    addPhotos(e.dataTransfer.files);
                  }}
                  className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 px-6 py-8 text-center text-sm text-slate-300"
                >
                  <p className="font-semibold text-emerald-50">Solte as fotos aqui</p>
                  <p className="text-xs text-slate-400">Drag & drop ou clique para selecionar</p>
                  <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-emerald-500/30">
                    Carregar imagens
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => addPhotos(e.target.files)}
                    />
                  </label>
                </div>

                {photos.length > 0 && (
                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", photo.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          const sourceId = e.dataTransfer.getData("text/plain");
                          if (sourceId) reorderPhotos(sourceId, photo.id);
                        }}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40"
                      >
                        <img
                          src={photo.preview}
                          alt={photo.name}
                          className="h-40 w-full object-cover transition group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 via-black/20 to-transparent px-3 py-2 text-xs text-white">
                          <div>
                            <p className="font-semibold">{photo.name}</p>
                            <p className="text-[11px] text-slate-200">Posição {index + 1}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto(photo.id)}
                            className="rounded-full bg-rose-500 px-2 py-1 text-[11px] font-semibold text-white opacity-90 shadow"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {step === 4 && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">Resultados e export</h2>
                    <p className="text-sm text-slate-400">
                      Conteúdo específico por portal com checklist e hashtags.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={generateContent}
                    disabled={loading}
                    className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "A gerar..." : "Gerar/atualizar"}
                  </button>
                </div>

                {statusMessage && (
                  <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    {statusMessage}
                  </div>
                )}

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {activePortals.map((portal) => {
                    const data = portalOutputs[portal];
                    const emptyCard = !data.description;
                    return (
                      <div
                        key={portal}
                        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${portalMeta[portal].accent} p-5`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-300">{portalMeta[portal].badge}</p>
                            <h3 className="text-lg font-semibold text-white">{portalMeta[portal].label}</h3>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => copyPortal(portal)}
                              className="rounded-lg bg-white/10 px-3 py-1 text-[11px] font-semibold text-white hover:bg-white/20"
                            >
                              Copiar
                            </button>
                            <button
                              type="button"
                              onClick={() => exportPortal(portal)}
                              className="rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-black shadow-md shadow-emerald-500/30 hover:bg-emerald-400"
                            >
                              Exportar
                            </button>
                          </div>
                        </div>
                        {loading && emptyCard && (
                          <div className="mt-4 space-y-2 animate-pulse">
                            <div className="h-4 rounded bg-white/20" />
                            <div className="h-3 rounded bg-white/10" />
                            <div className="h-3 rounded bg-white/10" />
                          </div>
                        )}
                        {!loading && emptyCard && (
                          <p className="mt-3 text-sm text-slate-200">
                            Clique em Gerar para criar o anúncio deste portal.
                          </p>
                        )}
                        {!emptyCard && (
                          <div className="mt-3 space-y-3 text-sm text-slate-100">
                            <p className="font-semibold text-white">{data.title}</p>
                            <p className="leading-relaxed text-slate-200">{data.description}</p>
                            <div>
                              <p className="text-xs uppercase text-slate-300">Destaques</p>
                              <ul className="mt-1 space-y-1 text-slate-100">
                                {data.highlights.map((item) => (
                                  <li key={item} className="flex items-start gap-2">
                                    <span className="text-emerald-300">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-slate-300">Checklist</p>
                              <ul className="mt-1 space-y-1 text-slate-100">
                                {data.checklist.map((item) => (
                                  <li key={item} className="flex items-start gap-2">
                                    <span className="text-emerald-300">✓</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <p className="text-slate-100">
                              <span className="text-xs uppercase text-slate-300">CTA:</span> {data.cta}
                            </p>
                            <p className="text-xs text-emerald-100">{data.hashtags.join(" ")}</p>
                            {data.mock && (
                              <p className="text-[11px] text-amber-200">Modo mock (sem GEMINI_API_KEY).</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {renderStepControls}
          </div>

          <aside className="w-full space-y-4 lg:w-1/3">
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <p className="text-sm font-semibold text-emerald-50">Checklist rápida</p>
              <ul className="mt-3 space-y-2 text-sm text-emerald-100">
                <li>✔ Campos obrigatórios preenchidos</li>
                <li>✔ Tom e persona definidos</li>
                <li>✔ Portais selecionados ({activePortals.length}/6)</li>
                <li>✔ Pelo menos 1 foto carregada</li>
              </ul>
              <button
                type="button"
                onClick={generateContent}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "A gerar..." : "Gerar anúncios"}
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
              <p className="font-semibold text-white">Portais suportados</p>
              <ul className="mt-2 space-y-1">
                <li>Idealista — foco SEO + destaque</li>
                <li>OLX — mobile-first e fotos</li>
                <li>Imovirtual — estrutura técnica</li>
                <li>Casa Sapo — conformidade e RLS</li>
                <li>BPI Imobiliário — investidor</li>
                <li>Facebook Marketplace — social lead</li>
              </ul>
              <p className="mt-3 text-xs text-slate-400">
                Ajuste o tom e CTA para cada público. Exporte em .txt ou copie para colar no portal.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}