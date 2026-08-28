"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Link2,
  ShoppingCart,
  TreePine,
  Settings,
  RefreshCw,
  Upload,
  Copy,
  Check,
  Save,
  Trash2,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShoppingBag,
} from "lucide-react";
import {
  Influenciador,
  SufixoVendas,
  SUFIXOS_VENDAS_OPCOES,
  fetchInfluenciadoresFromSupabase,
  getStoredInfluenciadores,
  saveInfluenciadorToSupabase,
  deleteInfluenciadorFromSupabase,
  generateUTMLinks,
  generateTokenAcessoRapido,
  formatarTodosLinksUTM,
  formatarPacoteCompletoInfluenciador,
  formatarLinkComAssinatura,
  getSlugBioHashira,
  getSlugHashirasensix,
  getUrlBioHashira,
  getUrlHashirasensix,
  normalizarSlug,
  validarSlugBase,
} from "@/lib/influenciadores";
import { uploadFileToSupabaseStorage } from "@/lib/supabase";
import { AppSidebar } from "@/components/AppSidebar";
import { UTMLinkBlock } from "@/components/influenciadores/UTMLinkBlock";
import { ArvoreLinks } from "@/components/influenciadores/ArvoreLinks";
import { CheckoutCategoriasView } from "@/components/influenciadores/CheckoutCategoriasView";
import { useRealtimeSubscription } from "@/lib/realtimeSync";
import { getActiveUser } from "@/lib/authPermissions";
import { toast } from "sonner";

type ActiveTab = "utm" | "checkout" | "arvore" | "configuracoes";

const TABS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
  { id: "utm",           label: "Links UTM",           icon: Link2       },
  { id: "checkout",      label: "Checkout",             icon: ShoppingCart },
  { id: "arvore",        label: "Árvore de Links",     icon: TreePine    },
  { id: "configuracoes", label: "Configurações",        icon: Settings    },
];

function CopyButton({ text, formattedText, label }: { text: string; formattedText?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const textToCopy = formattedText || text;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const el = document.createElement("textarea");
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0"
      style={{
        backgroundColor: copied ? "rgba(16,185,129,0.15)" : "var(--surface-alt)",
        color: copied ? "#10B981" : "var(--text-secondary)",
        border: "1px solid var(--border)",
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {label && <span>{copied ? "Copiado!" : label}</span>}
    </button>
  );
}

export default function InfluenciadorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [influenciador, setInfluenciador] = useState<Influenciador | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("utm");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados do formulário de Configurações unificado
  const [editSlugBase, setEditSlugBase] = useState("");
  const [editNomeExibicao, setEditNomeExibicao] = useState("");
  const [editSufixoVendas, setEditSufixoVendas] = useState<SufixoVendas>("-new");
  const [editSlugVendasCustomizado, setEditSlugVendasCustomizado] = useState("");
  const [editEhContaInterna, setEditEhContaInterna] = useState(false);
  const [editUrlBase, setEditUrlBase] = useState("");
  const [editUtmSource, setEditUtmSource] = useState("");
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Proteção de rota
  useEffect(() => {
    const user = getActiveUser();
    if (!user) { router.push("/login"); return; }
    if (user.papel !== "administrador" && !user.permissoes?.acessoCDI) {
      router.push("/dashboard");
    }
  }, [router]);

  const syncFormState = (inf: Influenciador) => {
    setInfluenciador(inf);
    setEditSlugBase(inf.slugBase);
    setEditNomeExibicao(inf.nomeExibicao || inf.nome || "");
    setEditSufixoVendas(inf.sufixoVendas || "-new");
    setEditSlugVendasCustomizado(inf.slugVendasCustomizado || "");
    setEditEhContaInterna(Boolean(inf.ehContaInterna));
    setEditUrlBase(inf.urlBase || "hashirasensix.com.br");
    setEditUtmSource(inf.utmSourcePadrao || "beacons");
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const cached = getStoredInfluenciadores();
      const found = cached.find((i) => i.id === id);
      if (found) syncFormState(found);

      const remote = await fetchInfluenciadoresFromSupabase();
      const remoteFound = remote.find((i) => i.id === id);
      if (remoteFound) syncFormState(remoteFound);
      else if (!found) router.push("/admin/influenciadores");
    } catch {
      const cached = getStoredInfluenciadores();
      const found = cached.find((i) => i.id === id);
      if (!found) router.push("/admin/influenciadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, [id]);

  useRealtimeSubscription({
    topics: ["influenciadores"],
    onUpdate: carregarDados,
  });

  const handleSave = async (updated: Influenciador) => {
    setSaving(true);
    await saveInfluenciadorToSupabase(updated);
    syncFormState(updated);
    setSaving(false);
    toast.success("Alterações salvas com sucesso!");
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!influenciador) return;

    const validacao = validarSlugBase(editSlugBase);
    if (!validacao.valido) {
      toast.error(validacao.erro || "Slug base inválido");
      return;
    }

    if (!editNomeExibicao.trim()) {
      toast.error("Informe o nome de exibição");
      return;
    }

    if (editSufixoVendas === "customizado" && !editSlugVendasCustomizado.trim()) {
      toast.error("Informe o slug de vendas customizado");
      return;
    }

    // Checa duplicidade do slugBase com outros influenciadores
    const existentes = getStoredInfluenciadores();
    const duplicado = existentes.find(
      (i) => i.id !== influenciador.id && i.slugBase.toLowerCase().trim() === editSlugBase.toLowerCase().trim()
    );
    if (duplicado) {
      toast.error(`O slug "${editSlugBase}" já pertence ao influenciador "${duplicado.nomeExibicao || duplicado.nome}".`);
      return;
    }

    const updated: Influenciador = {
      ...influenciador,
      slugBase: editSlugBase.trim().toLowerCase(),
      nomeExibicao: editNomeExibicao.trim(),
      nome: editNomeExibicao.trim(),
      sufixoVendas: editSufixoVendas,
      slugVendasCustomizado: editSufixoVendas === "customizado" ? editSlugVendasCustomizado.trim().toLowerCase() : undefined,
      ehContaInterna: editEhContaInterna,
      urlBase: editUrlBase.trim() || "hashirasensix.com.br",
      utmSourcePadrao: editUtmSource.trim() || "beacons",
    };

    await handleSave(updated);
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!influenciador || !e.target.files?.[0]) return;
    setUploadingFoto(true);
    const file = e.target.files[0];
    const url = await uploadFileToSupabaseStorage(file, "avatars");
    if (url) {
      await handleSave({ ...influenciador, fotoUrl: url });
      toast.success("Foto atualizada!");
    } else {
      toast.error("Falha ao fazer upload da foto.");
    }
    setUploadingFoto(false);
  };

  const handleRegenerateToken = async () => {
    if (!influenciador) return;
    const novoToken = generateTokenAcessoRapido();
    await handleSave({ ...influenciador, tokenAcessoRapido: novoToken });
    toast.success("Novo link de acesso rápido gerado!");
  };

  const handleDeleteInfluenciador = async () => {
    if (!influenciador) return;
    if (!confirm(`Deseja remover "${influenciador.nomeExibicao || influenciador.nome}" permanentemente?`)) return;
    await deleteInfluenciadorFromSupabase(influenciador.id);
    toast.success("Influenciador removido.");
    router.push("/admin/influenciadores");
  };

  if (loading && !influenciador) {
    return (
      <div className="flex h-screen" style={{ backgroundColor: "var(--background)" }}>
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#5B50E5] border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!influenciador) return null;

  const utmLinks = generateUTMLinks(influenciador);
  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/influenciador/${influenciador.tokenAcessoRapido}`
    : `/influenciador/${influenciador.tokenAcessoRapido}`;

  const slugBioAtual = getSlugBioHashira(influenciador);
  const slugVendasAtual = getSlugHashirasensix(influenciador);
  const urlVendasAtual = getUrlHashirasensix(influenciador);

  // Preview dinâmico para a aba de configurações
  const previewInfConfig: Influenciador = {
    ...influenciador,
    slugBase: editSlugBase || "slug",
    sufixoVendas: editSufixoVendas,
    slugVendasCustomizado: editSlugVendasCustomizado || editSlugBase,
    urlBase: editUrlBase || "hashirasensix.com.br",
    urlArvore: "biohashira.com.br",
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">

          {/* Voltar */}
          <button
            onClick={() => router.push("/admin/influenciadores")}
            className="flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ArrowLeft className="w-4 h-4" />
            Todos os influenciadores
          </button>

          {/* Header do influenciador */}
          <div
            className="rounded-3xl p-6 flex items-center gap-5 flex-wrap sm:flex-nowrap"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Foto */}
            <div className="shrink-0 relative">
              {influenciador.fotoUrl ? (
                <img
                  src={influenciador.fotoUrl}
                  alt={influenciador.nomeExibicao || influenciador.nome}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#5B50E5]/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5B50E5] to-[#7C3AED] flex items-center justify-center text-white font-extrabold text-3xl shadow-lg shadow-[#5B50E5]/20">
                  {(influenciador.nomeExibicao || influenciador.nome || "I").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1
                  className="text-xl font-extrabold font-['Plus_Jakarta_Sans'] truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {influenciador.nomeExibicao || influenciador.nome}
                </h1>
                {influenciador.ehContaInterna && (
                  <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold bg-[#5B50E5]/15 text-[#5B50E5] border border-[#5B50E5]/30">
                    Conta Interna
                  </span>
                )}
                <span
                  className="text-[10px] px-2 py-0.5 rounded-lg font-bold"
                  style={{
                    backgroundColor: influenciador.ativo ? "rgba(16,185,129,0.12)" : "rgba(107,114,128,0.12)",
                    color: influenciador.ativo ? "#10B981" : "#6B7280",
                  }}
                >
                  {influenciador.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              {/* Slugs resolvidos */}
              <div className="flex items-center gap-3 text-xs font-mono flex-wrap" style={{ color: "var(--text-muted)" }}>
                <span>bio: <strong className="text-[#A78BFA]">/{slugBioAtual}</strong></span>
                <span>•</span>
                <span>vendas: <strong className="text-amber-400">/{slugVendasAtual}</strong></span>
              </div>

              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {influenciador.linksCheckout.length} link{influenciador.linksCheckout.length !== 1 ? "s" : ""} de checkout · utm_source: {influenciador.utmSourcePadrao || "beacons"}
              </p>
            </div>

            {/* Botão de Destaque: Copiar Pacote Completo de Links */}
            <div className="shrink-0">
              <CopyButton
                text=""
                formattedText={formatarPacoteCompletoInfluenciador(influenciador)}
                label="Copiar Pacote Completo de Links 📦"
              />
            </div>
          </div>

          {/* Tabs */}
          <div
            className="flex gap-1 p-1.5 rounded-2xl overflow-x-auto"
            style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center"
                  style={{
                    backgroundColor: isActive ? "#5B50E5" : "transparent",
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    boxShadow: isActive ? "0 2px 8px rgba(91,80,229,0.3)" : "none",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.id === "arvore" && influenciador.ehContaInterna && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/20 text-white/60">
                      N/A
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Conteúdo das Abas */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {/* ── ABA UTM ── */}
              {activeTab === "utm" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#5B50E5]">
                      Links com UTM por Plataforma (Site de Vendas)
                    </p>
                    <CopyButton
                      text=""
                      formattedText={formatarTodosLinksUTM(influenciador)}
                      label="Copiar Todos os Links UTM"
                    />
                  </div>

                  {/* URL Base */}
                  <div
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                      URL Base da Página de Vendas
                    </p>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-sm overflow-hidden"
                        style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
                      >
                        <Globe className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                        <span className="truncate" style={{ color: "var(--text-secondary)" }}>
                          {influenciador.urlBase || "hashirasensix.com.br"}/
                          <span className="text-amber-400 font-bold">{slugVendasAtual}</span>
                        </span>
                      </div>
                      <CopyButton
                        text={urlVendasAtual}
                        formattedText={formatarLinkComAssinatura(
                          `URL de Vendas (${influenciador.nomeExibicao || influenciador.nome})`,
                          urlVendasAtual
                        )}
                        label="Copiar"
                      />
                    </div>
                  </div>

                  {/* Blocos UTM */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {utmLinks.map((block) => (
                      <UTMLinkBlock key={block.plataforma} block={block} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── ABA CHECKOUT ── */}
              {activeTab === "checkout" && (
                <CheckoutCategoriasView
                  influenciador={influenciador}
                  onSaveInfluenciador={handleSave}
                />
              )}

              {/* ── ABA ÁRVORE ── */}
              {activeTab === "arvore" && (
                influenciador.ehContaInterna ? (
                  <div
                    className="rounded-3xl p-8 text-center space-y-3"
                    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#5B50E5]/15 flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-[#5B50E5]" />
                    </div>
                    <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                      Conta Interna / Institucional
                    </h3>
                    <p className="text-xs max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
                      Esta conta é configurada como canal institucional interno (ex: tráfego pago, página principal). Ela não possui uma árvore de bio-links no biohashira.com.br.
                    </p>
                  </div>
                ) : (
                  <ArvoreLinks influenciador={influenciador} />
                )
              )}

              {/* ── ABA CONFIGURAÇÕES ── */}
              {activeTab === "configuracoes" && (
                <div className="space-y-6">
                  {/* Upload de foto */}
                  <div
                    className="rounded-2xl p-5 space-y-4"
                    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      Foto de Perfil
                    </p>
                    <div className="flex items-center gap-5">
                      <div className="shrink-0">
                        {influenciador.fotoUrl ? (
                          <img
                            src={influenciador.fotoUrl}
                            alt={influenciador.nomeExibicao || influenciador.nome}
                            className="w-20 h-20 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5B50E5] to-[#7C3AED] flex items-center justify-center text-white font-extrabold text-3xl">
                            {(influenciador.nomeExibicao || influenciador.nome || "I").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleUploadFoto}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFoto}
                          className="coursue-btn-primary py-2.5 px-5 text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                          <Upload className="w-4 h-4" />
                          {uploadingFoto ? "Enviando..." : "Alterar foto"}
                        </button>
                        <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                          JPG, PNG ou WebP · Máx 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Edição de dados estruturados */}
                  <div
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-sm font-bold mb-5" style={{ color: "var(--text-primary)" }}>
                      Identificador e Configurações de Slugs
                    </p>
                    <form onSubmit={handleSaveConfig} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Nome Base */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                            Nome Base / Slug Canônico *
                          </label>
                          <input
                            type="text"
                            value={editSlugBase}
                            onChange={(e) => setEditSlugBase(normalizarSlug(e.target.value))}
                            placeholder="ex: astorga"
                            className="coursue-input text-sm py-2.5 w-full font-mono font-bold"
                            required
                          />
                          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            biohashira.com.br/{editSlugBase || "slug"}
                          </p>
                        </div>

                        {/* Nome de Exibição */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                            Nome de Exibição *
                          </label>
                          <input
                            type="text"
                            value={editNomeExibicao}
                            onChange={(e) => setEditNomeExibicao(e.target.value)}
                            placeholder="ex: Astorga"
                            className="coursue-input text-sm py-2.5 w-full"
                            required
                          />
                        </div>

                        {/* Sufixo de Vendas */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                            Sufixo da Página de Vendas
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {SUFIXOS_VENDAS_OPCOES.map((opt) => {
                              const isSelected = editSufixoVendas === opt.valor;
                              return (
                                <button
                                  key={opt.valor}
                                  type="button"
                                  onClick={() => setEditSufixoVendas(opt.valor)}
                                  className={`py-2 px-3 rounded-xl text-xs font-bold text-center border transition-all ${
                                    isSelected
                                      ? "bg-[#5B50E5] text-white border-[#5B50E5] shadow-md shadow-[#5B50E5]/20"
                                      : "bg-white/5 text-gray-300 border-white/10 hover:border-white/25 hover:bg-white/10"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Campo extra se sufixo for customizado */}
                        {editSufixoVendas === "customizado" && (
                          <div className="space-y-1.5 sm:col-span-2 animate-in fade-in duration-150">
                            <label className="text-xs font-bold text-amber-400">
                              Slug Customizado para o Site de Vendas *
                            </label>
                            <input
                              type="text"
                              value={editSlugVendasCustomizado}
                              onChange={(e) => setEditSlugVendasCustomizado(normalizarSlug(e.target.value))}
                              placeholder="ex: hashira-principal"
                              className="coursue-input text-sm py-2.5 w-full font-mono border-amber-500/40"
                              required
                            />
                          </div>
                        )}

                        {/* Checkbox Conta Interna */}
                        <div
                          className="sm:col-span-2 flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-colors"
                          style={{
                            backgroundColor: editEhContaInterna ? "rgba(91,80,229,0.12)" : "var(--surface-alt)",
                            border: editEhContaInterna ? "1px solid rgba(91,80,229,0.3)" : "1px solid var(--border)",
                          }}
                          onClick={() => setEditEhContaInterna(!editEhContaInterna)}
                        >
                          <input
                            type="checkbox"
                            checked={editEhContaInterna}
                            onChange={(e) => setEditEhContaInterna(e.target.checked)}
                            className="w-4 h-4 rounded text-[#5B50E5] focus:ring-[#5B50E5] cursor-pointer"
                          />
                          <div className="flex-1 text-left">
                            <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                              Conta interna (não é influenciador)
                            </p>
                            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                              Oculta a árvore de links da bio. Útil para contas institucionais ou campanhas internas.
                            </p>
                          </div>
                        </div>

                        {/* URL Base & UTM Source */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                            URL Base do Site
                          </label>
                          <input
                            type="text"
                            value={editUrlBase}
                            onChange={(e) => setEditUrlBase(e.target.value)}
                            placeholder="hashirasensix.com.br"
                            className="coursue-input text-sm py-2.5 w-full font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                            UTM Source Padrão
                          </label>
                          <input
                            type="text"
                            value={editUtmSource}
                            onChange={(e) => setEditUtmSource(e.target.value)}
                            placeholder="beacons"
                            className="coursue-input text-sm py-2.5 w-full font-mono"
                          />
                        </div>
                      </div>

                      {/* Pré-visualização Ao Vivo Lado a Lado */}
                      <div
                        className="rounded-2xl p-4 space-y-2.5 mt-2"
                        style={{
                          background: "linear-gradient(135deg, rgba(91,80,229,0.06) 0%, rgba(124,58,237,0.03) 100%)",
                          border: "1px solid rgba(91,80,229,0.2)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5B50E5] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Pré-visualização das URLs Resolvidas
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Derivado em tempo real
                          </span>
                        </div>

                        <div className="space-y-2 text-xs font-mono">
                          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/20 border border-white/5">
                            <span className="text-white/50 text-[11px] shrink-0 flex items-center gap-1.5">
                              <Globe className="w-3 h-3 text-[#A78BFA]" /> Bio-links:
                            </span>
                            <span className="text-white font-bold truncate">
                              biohashira.com.br/<span className="text-[#A78BFA]">{getSlugBioHashira(previewInfConfig)}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/20 border border-white/5">
                            <span className="text-white/50 text-[11px] shrink-0 flex items-center gap-1.5">
                              <ShoppingBag className="w-3 h-3 text-amber-400" /> Vendas:
                            </span>
                            <span className="text-white font-bold truncate">
                              hashirasensix.com.br/<span className="text-amber-400">{getSlugHashirasensix(previewInfConfig)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-3">
                        <button
                          type="submit"
                          disabled={saving}
                          className="coursue-btn-primary py-2.5 px-6 text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? "Salvando..." : "Salvar Alterações"}
                        </button>
                        <button
                          type="button"
                          onClick={() => syncFormState(influenciador)}
                          className="py-2.5 px-4 text-sm rounded-2xl font-semibold transition-colors"
                          style={{ backgroundColor: "var(--surface-alt)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                        >
                          Descartar
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Link de Acesso Rápido */}
                  <div
                    className="rounded-2xl p-5 space-y-4"
                    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                        Link de Acesso Rápido do Influenciador
                      </p>
                      <button
                        onClick={handleRegenerateToken}
                        className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl transition-colors"
                        style={{
                          backgroundColor: "rgba(245,158,11,0.1)",
                          color: "#D97706",
                          border: "1px solid rgba(245,158,11,0.2)",
                        }}
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerar
                      </button>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Compartilhe este link com o parceiro para que ele visualize e copie seus links oficiais sem necessidade de login.
                    </p>
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
                    >
                      <p className="flex-1 text-xs font-mono break-all" style={{ color: "var(--text-secondary)" }}>
                        {publicUrl}
                      </p>
                      <CopyButton text={publicUrl} label="Copiar" />
                    </div>
                  </div>

                  {/* Zona de Perigo */}
                  <div
                    className="rounded-2xl p-5 space-y-3"
                    style={{ backgroundColor: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.15)" }}
                  >
                    <p className="text-sm font-bold text-rose-500">Zona de Perigo</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Remover este influenciador apagará permanentemente todos os dados associados.
                    </p>
                    <button
                      onClick={handleDeleteInfluenciador}
                      className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-rose-500 transition-colors"
                      style={{ backgroundColor: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Remover Influenciador
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
