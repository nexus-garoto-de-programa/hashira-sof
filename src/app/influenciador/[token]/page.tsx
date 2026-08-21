"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  fetchInfluenciadorByToken,
  generateUTMLinks,
  generateArvoreLinks,
  getArvoreRaiz,
  Influenciador,
  formatarPacoteCompletoInfluenciador,
  CATEGORIAS_CHECKOUT_PREDEFINIDAS,
} from "@/lib/influenciadores";
import { Copy, Check, ShieldCheck, Sparkles, Link2, ShoppingCart, TreePine, Flame, TrendingUp, Zap } from "lucide-react";

// Lista de frases motivacionais curtas para vendas
const FRASES_MOTIVACIONAIS = [
  "Como vão as vendas hoje?",
  "Pronto para bater recordes de conversão hoje?",
  "Sua audiência está esperando suas indicações — bora pra cima!",
  "Cada link compartilhado é uma nova oportunidade de faturamento.",
  "Tudo pronto para alavancar suas comissões hoje!",
  "A constância é a chave do sucesso — vamos escalar as vendas!",
];

function getSaudacaoHorario(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function InfluenciadorPublicPage() {
  const params = useParams();
  const token = params?.token as string;

  const [influenciador, setInfluenciador] = useState<Influenciador | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  // Seleciona uma frase motivacional aleatória no carregamento da página
  const fraseMotivacional = useMemo(() => {
    const idx = Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length);
    return FRASES_MOTIVACIONAIS[idx];
  }, []);

  useEffect(() => {
    async function load() {
      if (!token) { setNotFound(true); setLoading(false); return; }
      const data = await fetchInfluenciadorByToken(token);
      if (!data) {
        setNotFound(true);
      } else {
        setInfluenciador(data);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  const handleCopyTodos = async () => {
    if (!influenciador) return;
    const textToCopy = formatarPacoteCompletoInfluenciador(influenciador);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement("textarea");
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0E1A]">
        <div className="w-8 h-8 border-2 border-[#5B50E5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !influenciador) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0E1A] px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 flex items-center justify-center text-4xl">
            🔒
          </div>
          <h1 className="text-xl font-extrabold text-white">Link não encontrado</h1>
          <p className="text-sm text-white/50">
            Este link de acesso pode ter sido revogado ou é inválido.
          </p>
        </div>
      </div>
    );
  }

  const utmLinks = generateUTMLinks(influenciador);
  const arvoreLinks = generateArvoreLinks(influenciador);
  const raizBio = getArvoreRaiz(influenciador);
  const saudacao = getSaudacaoHorario();

  return (
    <div className="min-h-screen bg-[#0F0E1A] text-white flex flex-col justify-between selection:bg-[#5B50E5] selection:text-white">
      <div>
        {/* HERO CONVIDATIVA & MOTIVACIONAL */}
        <div
          className="relative overflow-hidden py-14 px-4"
          style={{
            background: "linear-gradient(135deg, #1C1742 0%, #120F26 50%, #0F0E1A 100%)",
            borderBottom: "1px solid rgba(91,80,229,0.25)",
          }}
        >
          {/* Glows de fundo animados */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-64 blur-[100px] opacity-35 pointer-events-none"
            style={{ background: "radial-gradient(circle, #5B50E5 0%, #7C3AED 50%, transparent 70%)" }}
          />

          <div className="max-w-md mx-auto text-center relative z-10 space-y-5">
            {/* Badge de Parceria */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              PARCEIRO HASHIRA
            </div>

            {/* Foto de Perfil */}
            <div className="relative inline-block">
              {influenciador.fotoUrl ? (
                <img
                  src={influenciador.fotoUrl}
                  alt={influenciador.nome}
                  className="w-24 h-24 rounded-3xl object-cover mx-auto ring-4 ring-[#5B50E5]/40 shadow-2xl shadow-[#5B50E5]/30"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#5B50E5] to-[#7C3AED] mx-auto flex items-center justify-center text-4xl font-extrabold shadow-2xl shadow-[#5B50E5]/30">
                  {influenciador.nome.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-6 h-6 rounded-full border-4 border-[#0F0E1A] flex items-center justify-center" title="Links Validados Ativos">
                <Check className="w-3 h-3 text-white stroke-[3]" />
              </div>
            </div>

            {/* Mensagem Convidativa de Boas-Vindas */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight">
                {saudacao}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-[#A78BFA]">{influenciador.nome}</span>! 👋
              </h1>
              <p className="text-sm font-semibold text-[#A78BFA] flex items-center justify-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{fraseMotivacional}</span>
              </p>
            </div>

            {/* Badge de Verificação Central Hashira */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/5 text-white/70 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Links Oficiais &amp; Validados — Central Hashira
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="max-w-md mx-auto px-4 py-8 space-y-8">

          {/* ÚNICA OPÇÃO DE CÓPIA NA TELA: SUPER BOTÃO PACOTE COMPLETO */}
          <div className="space-y-3.5">
            <button
              onClick={handleCopyTodos}
              className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-2xl ${
                copied
                  ? "bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-400"
                  : "bg-gradient-to-r from-[#5B50E5] via-[#6356EE] to-[#7C3AED] hover:opacity-95 text-white shadow-[#5B50E5]/40 ring-1 ring-white/20"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>TODOS OS LINKS COPIADOS COM SUCESSO!</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                  <span>COPIAR TODOS OS MEUS LINKS DE UMA VEZ</span>
                </>
              )}
            </button>

            {/* Aviso de Segurança de Cópia Única */}
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{
                backgroundColor: "rgba(91,80,229,0.08)",
                border: "1px solid rgba(91,80,229,0.2)",
              }}
            >
              <Sparkles className="w-4 h-4 text-[#A78BFA] shrink-0 mt-0.5" />
              <p className="text-xs text-white/80 leading-relaxed">
                <strong className="text-white">Opção Única &amp; Segura:</strong> Para evitar trocas ou erros nos seus links, basta um clique no botão acima para copiar seu pacote completo de vendas (UTMs + Checkout + Árvore Bio) pronto com a assinatura digital oficial Hashira.
              </p>
            </div>
          </div>

          {/* PRÉVIA INFORMATIVA DOS LINKS INCLUÍDOS (SEM NENHUM BOTÃO DE CÓPIA SEPARADO) */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40 px-2">
                Resumo do Pacote Copiado
              </span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            {/* 1. Links UTM */}
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#A78BFA]" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  1. Links UTM (Campanha)
                </h3>
              </div>
              <div className="space-y-2">
                {utmLinks.map((u) => (
                  <div key={u.plataforma} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-white/5 font-mono text-white/80">
                    <span className="font-bold text-[#A78BFA]">{u.label}</span>
                    <span className="truncate max-w-[200px] text-white/40 text-[11px]">{u.urlCompleta}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Checkouts */}
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(217,119,6,0.25)" }}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  2. Ofertas &amp; Checkout
                </h3>
              </div>
              <div className="space-y-3">
                {CATEGORIAS_CHECKOUT_PREDEFINIDAS.map((cat) => (
                  <div key={cat.id} className="space-y-1.5">
                    <p className="text-[11px] font-bold text-amber-400/90">{cat.icone} {cat.titulo}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subItems.map((sub) => {
                        const link = influenciador.linksCheckout.find(
                          (l) => l.categoriaId === cat.id && l.subItemId === sub.id
                        ) || influenciador.linksCheckout.find(
                          (l) => l.nome.toUpperCase().trim() === sub.label.toUpperCase().trim()
                        );
                        const temLink = Boolean(link && link.url && link.url.trim().length > 0);
                        return (
                          <span
                            key={sub.id}
                            className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border ${
                              temLink
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-200 font-bold"
                                : "bg-white/5 border-white/10 text-white/30 italic"
                            }`}
                          >
                            {sub.label} {temLink ? "✓" : "(pendente)"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Árvore de Links */}
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-2">
                <TreePine className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  3. Árvore de Links (biohashira)
                </h3>
              </div>
              <div className="space-y-1.5 text-xs font-mono text-white/70">
                <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white/5">
                  <span className="text-emerald-400 font-bold">Raiz:</span>
                  <span className="truncate max-w-[220px] text-white/50">{raizBio}</span>
                </div>
                {arvoreLinks.map((s) => (
                  <div key={s.plataforma} className="flex items-center justify-between py-1 px-3 text-[11px]">
                    <span className="text-white/60">{s.label}:</span>
                    <span className="truncate max-w-[200px] text-white/40">{s.urlCompleta}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé Fixo */}
      <div className="text-center py-6 border-t border-white/5">
        <p className="text-[11px] text-white/30 font-medium">
          Gerado via Central Hashira 🏯
        </p>
      </div>
    </div>
  );
}
