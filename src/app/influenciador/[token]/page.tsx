"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  fetchInfluenciadorByToken,
  generateUTMLinks,
  generateArvoreLinks,
  getArvoreRaiz,
  Influenciador,
  formatarTodosLinksUTM,
  formatarPacoteCompletoInfluenciador,
} from "@/lib/influenciadores";
import { UTMLinkBlock } from "@/components/influenciadores/UTMLinkBlock";
import { ArvoreLinks } from "@/components/influenciadores/ArvoreLinks";
import { CheckoutCategoriasView } from "@/components/influenciadores/CheckoutCategoriasView";
import { Copy, Check, ExternalLink, ShoppingCart, Package } from "lucide-react";

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
        backgroundColor: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.08)",
        color: copied ? "#10B981" : "rgba(255,255,255,0.8)",
        border: copied ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? "Copiado!" : label || "Copiar"}</span>
    </button>
  );
}

export default function InfluenciadorPublicPage() {
  const params = useParams();
  const token = params?.token as string;

  const [influenciador, setInfluenciador] = useState<Influenciador | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
        <div className="text-center space-y-4">
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
  const checkoutsAtivos = influenciador.linksCheckout.filter((l) => l.ativo);

  return (
    <div className="min-h-screen bg-[#0F0E1A] text-white">
      {/* Header decorativo */}
      <div
        className="relative overflow-hidden py-12 px-4"
        style={{
          background: "linear-gradient(135deg, #1a1040 0%, #0F0E1A 60%)",
          borderBottom: "1px solid rgba(91,80,229,0.2)",
        }}
      >
        {/* Glow de fundo */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #5B50E5 0%, transparent 70%)" }}
        />

        <div className="max-w-lg mx-auto text-center relative z-10 space-y-4">
          {influenciador.fotoUrl ? (
            <img
              src={influenciador.fotoUrl}
              alt={influenciador.nome}
              className="w-24 h-24 rounded-3xl object-cover mx-auto ring-2 ring-[#5B50E5]/40"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#5B50E5] to-[#7C3AED] mx-auto flex items-center justify-center text-4xl font-extrabold">
              {influenciador.nome.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold">{influenciador.nome}</h1>
            <p className="text-sm text-white/50 font-mono mt-1">/{influenciador.slugBio}</p>
          </div>

          {/* Botão de Destaque para Copiar Todos os Links do Influenciador */}
          <div className="pt-2 flex justify-center">
            <CopyButton
              text=""
              formattedText={formatarPacoteCompletoInfluenciador(influenciador)}
              label="Copiar Pacote Completo de Links 📦"
            />
          </div>

          {/* Badge Hashira */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(91,80,229,0.2)", border: "1px solid rgba(91,80,229,0.3)", color: "#A78BFA" }}>
            🏯 Central Hashira
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">

        {/* Links UTM */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-[#5B50E5]" />
              <h2 className="text-base font-extrabold">Links com UTM</h2>
            </div>
            <CopyButton
              text=""
              formattedText={formatarTodosLinksUTM(influenciador)}
              label="Copiar Todos os UTMs"
            />
          </div>
          <div className="space-y-3">
            {utmLinks.map((block) => (
              <UTMLinkBlock key={block.plataforma} block={block} />
            ))}
          </div>
        </section>

        {/* Checkout */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-amber-500" />
            <h2 className="text-base font-extrabold">Links de Checkout</h2>
          </div>
          <CheckoutCategoriasView
            influenciador={influenciador}
            onSaveInfluenciador={async () => {}}
            somenteLeitura={true}
          />
        </section>

        {/* Árvore de Links */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-amber-500" />
            <h2 className="text-base font-extrabold">Árvore de Links</h2>
          </div>
          {/* Versão simplificada para modo público */}
          <div className="space-y-2.5">
            {generateArvoreLinks(influenciador).map((link) => (
              <div
                key={link.plataforma}
                className="flex items-center justify-between gap-3 rounded-2xl p-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">
                    {link.plataforma === "instagram" ? "📸" : link.plataforma === "youtube" ? "▶️" : "🎵"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{link.label}</p>
                    <p className="text-[11px] font-mono text-white/40 truncate">{link.urlCompleta}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CopyButton text={link.urlCompleta} />
                  <a
                    href={link.urlCompleta}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rodapé */}
        <div className="text-center pt-4 pb-8">
          <p className="text-[11px] text-white/25">
            Powered by Central Hashira 🏯
          </p>
        </div>
      </div>
    </div>
  );
}
