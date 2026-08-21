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
  Plus,
  RefreshCw,
  Upload,
  Copy,
  Check,
  Save,
  Trash2,
  Globe,
} from "lucide-react";
import {
  Influenciador,
  LinkCheckout,
  fetchInfluenciadoresFromSupabase,
  getStoredInfluenciadores,
  saveInfluenciadorToSupabase,
  deleteInfluenciadorFromSupabase,
  generateUTMLinks,
  generateTokenAcessoRapido,
  addLinkCheckout,
  updateLinkCheckout,
  removeLinkCheckout,
  formatarTodosLinksUTM,
  formatarPacoteCompletoInfluenciador,
  formatarLinkComAssinatura,
} from "@/lib/influenciadores";
import { uploadFileToSupabaseStorage } from "@/lib/supabase";
import { AppSidebar } from "@/components/AppSidebar";
import { UTMLinkBlock } from "@/components/influenciadores/UTMLinkBlock";
import { LinkCheckoutItem } from "@/components/influenciadores/LinkCheckoutItem";
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

  // Config form state
  const [editNome, setEditNome] = useState("");
  const [editSlugBio, setEditSlugBio] = useState("");
  const [editSlugPrincipal, setEditSlugPrincipal] = useState("");
  const [editUrlBase, setEditUrlBase] = useState("");
  const [editUtmSource, setEditUtmSource] = useState("");
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Novo link checkout
  const [showAddCheckout, setShowAddCheckout] = useState(false);
  const [novoCheckoutNome, setNovoCheckoutNome] = useState("");
  const [novoCheckoutUrl, setNovoCheckoutUrl] = useState("");

  // Proteção de rota
  useEffect(() => {
    const user = getActiveUser();
    if (!user) { router.push("/login"); return; }
    if (user.papel !== "administrador" && !user.permissoes?.acessoCDI) {
      router.push("/dashboard");
    }
  }, [router]);

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

  function syncFormState(inf: Influenciador) {
    setInfluenciador(inf);
    setEditNome(inf.nome);
    setEditSlugBio(inf.slugBio);
    setEditSlugPrincipal(inf.slugPrincipal);
    setEditUrlBase(inf.urlBase);
    setEditUtmSource(inf.utmSourcePadrao);
  }

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
    await handleSave({
      ...influenciador,
      nome: editNome.trim(),
      slugBio: editSlugBio.trim(),
      slugPrincipal: editSlugPrincipal.trim(),
      urlBase: editUrlBase.trim(),
      utmSourcePadrao: editUtmSource.trim(),
    });
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
    if (!confirm(`Deseja remover "${influenciador.nome}" permanentemente?`)) return;
    await deleteInfluenciadorFromSupabase(influenciador.id);
    toast.success("Influenciador removido.");
    router.push("/admin/influenciadores");
  };

  const handleAddCheckout = async () => {
    if (!influenciador) return;
    if (!novoCheckoutNome.trim() || !novoCheckoutUrl.trim()) {
      toast.error("Preencha o nome e a URL do link");
      return;
    }
    const updated = addLinkCheckout(influenciador, {
      nome: novoCheckoutNome.trim(),
      url: novoCheckoutUrl.trim(),
      ativo: true,
    });
    await handleSave(updated);
    setNovoCheckoutNome("");
    setNovoCheckoutUrl("");
    setShowAddCheckout(false);
  };

  const handleUpdateCheckout = async (linkId: string, updates: Partial<Omit<LinkCheckout, "id">>) => {
    if (!influenciador) return;
    const updated = updateLinkCheckout(influenciador, linkId, updates);
    await handleSave(updated);
  };

  const handleRemoveCheckout = async (linkId: string) => {
    if (!influenciador) return;
    const updated = removeLinkCheckout(influenciador, linkId);
    await handleSave(updated);
    toast.success("Link removido.");
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
            className="rounded-3xl p-6 flex items-center gap-5"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Foto */}
            <div className="shrink-0 relative">
              {influenciador.fotoUrl ? (
                <img
                  src={influenciador.fotoUrl}
                  alt={influenciador.nome}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#5B50E5]/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5B50E5] to-[#7C3AED] flex items-center justify-center text-white font-extrabold text-3xl">
                  {influenciador.nome.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1
                className="text-xl font-extrabold font-['Plus_Jakarta_Sans'] truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {influenciador.nome}
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm font-mono" style={{ color: "var(--text-muted)" }}>
                  /{influenciador.slugBio}
                </span>
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
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {influenciador.linksCheckout.length} link{influenciador.linksCheckout.length !== 1 ? "s" : ""} de checkout · utm_source: {influenciador.utmSourcePadrao}
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
                  {/* Cabeçalho da aba UTM com Copiar Todos os UTMs */}
                  <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#5B50E5]">
                      Links com UTM por Plataforma
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
                      URL Base do Site
                    </p>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-sm"
                        style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
                      >
                        <Globe className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                        <span style={{ color: "var(--text-secondary)" }}>
                          {influenciador.urlBase}/
                          <span className="text-[#5B50E5] font-bold">{influenciador.slugPrincipal}</span>
                        </span>
                      </div>
                      <CopyButton
                        text={`https://${influenciador.urlBase}/${influenciador.slugPrincipal}`}
                        formattedText={formatarLinkComAssinatura(
                          `URL Base (${influenciador.nome})`,
                          `https://${influenciador.urlBase}/${influenciador.slugPrincipal}`
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
                <ArvoreLinks influenciador={influenciador} />
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
                            alt={influenciador.nome}
                            className="w-20 h-20 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5B50E5] to-[#7C3AED] flex items-center justify-center text-white font-extrabold text-3xl">
                            {influenciador.nome.charAt(0).toUpperCase()}
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

                  {/* Edição de dados */}
                  <div
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-sm font-bold mb-5" style={{ color: "var(--text-primary)" }}>
                      Dados do Influenciador
                    </p>
                    <form onSubmit={handleSaveConfig} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>Nome</label>
                          <input
                            type="text"
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                            className="coursue-input text-sm py-2.5 w-full"
                          />
                        </div>
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
                            Slug da Árvore (biohashira)
                          </label>
                          <input
                            type="text"
                            value={editSlugBio}
                            onChange={(e) => setEditSlugBio(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                            className="coursue-input text-sm py-2.5 w-full font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                            Slug UTM (utm_content)
                          </label>
                          <input
                            type="text"
                            value={editSlugPrincipal}
                            onChange={(e) => setEditSlugPrincipal(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                            className="coursue-input text-sm py-2.5 w-full font-mono"
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                            UTM Source Padrão
                          </label>
                          <input
                            type="text"
                            value={editUtmSource}
                            onChange={(e) => setEditUtmSource(e.target.value)}
                            placeholder="beacons"
                            className="coursue-input text-sm py-2.5 w-full font-mono max-w-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="coursue-btn-primary py-2.5 px-5 text-sm flex items-center gap-2 disabled:opacity-50"
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
                        Link de Acesso Rápido
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
                      Compartilhe este link com o influenciador para que ele acesse seus links sem precisar de login.
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
