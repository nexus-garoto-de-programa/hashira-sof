"use client";

import React, { useState } from "react";
import { Copy, Check, ExternalLink, Share2 } from "lucide-react";
import {
  Influenciador,
  generateArvoreLinks,
  getArvoreRaiz,
  ArvoreLink,
  formatarLinkComAssinatura,
  formatarTodaArvoreLinks,
} from "@/lib/influenciadores";

interface ArvoreLinksProps {
  influenciador: Influenciador;
  somenteLeitura?: boolean;
}

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
      title={copied ? "Copiado!" : "Copiar"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
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

const PLATAFORMA_META: Record<string, { emoji: string; color: string; bg: string }> = {
  instagram: { emoji: "📸", color: "#E1306C", bg: "rgba(225,48,108,0.08)" },
  youtube:   { emoji: "▶️", color: "#FF0000", bg: "rgba(255,0,0,0.08)" },
  tiktok:    { emoji: "🎵", color: "#2D2D2D", bg: "rgba(0,0,0,0.06)" },
};

export function ArvoreLinks({ influenciador, somenteLeitura = false }: ArvoreLinksProps) {
  const raiz = getArvoreRaiz(influenciador);
  const links = generateArvoreLinks(influenciador);
  const arvore = (influenciador.urlArvore || "biohashira.com.br").replace(/\/$/, "");
  const slug = influenciador.slugBio;

  return (
    <div className="space-y-4">
      {/* Linha raiz */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "linear-gradient(135deg, rgba(91,80,229,0.08) 0%, rgba(91,80,229,0.03) 100%)",
          border: "1px solid rgba(91,80,229,0.2)",
        }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5B50E5] mb-1">
              Raiz da Árvore
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                {arvore}/
                <span className="text-[#5B50E5]">{slug}</span>
              </p>
              <a href={raiz} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 text-[#5B50E5]" />
              </a>
            </div>
          </div>
          <CopyButton
            text={raiz}
            formattedText={formatarLinkComAssinatura(
              `Árvore de Links — Raiz (${influenciador.nome})`,
              raiz
            )}
          />
        </div>
      </div>

      {/* Sub-rotas por plataforma */}
      <div className="space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Sub-rotas por Plataforma
        </p>
        {links.map((link) => {
          const meta = PLATAFORMA_META[link.plataforma] || { emoji: "🔗", color: "#5B50E5", bg: "rgba(91,80,229,0.08)" };
          return (
            <div
              key={link.plataforma}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: meta.bg }}
              >
                {meta.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                  {link.label}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    {arvore}/{slug}/
                    <span style={{ color: meta.color }} className="font-bold">
                      {link.sufixo}
                    </span>
                  </span>
                  <a href={link.urlCompleta} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                  </a>
                </div>
              </div>

              <CopyButton text={link.urlCompleta} />
            </div>
          );
        })}
      </div>

      {/* Nota de extensibilidade */}
      <p className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>
        Novas plataformas geram sub-rotas automaticamente seguindo o padrão /{slug}/{"{sufixo}"}
      </p>
    </div>
  );
}
