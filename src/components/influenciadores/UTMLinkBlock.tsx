"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { UTMLinkBlock as UTMLinkBlockType, formatarLinkComAssinatura } from "@/lib/influenciadores";

interface UTMLinkBlockProps {
  block: UTMLinkBlockType;
}

function CopyButton({ text, formattedText }: { text: string; formattedText?: string }) {
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
      className="p-1.5 rounded-lg transition-all shrink-0"
      style={{
        backgroundColor: copied ? "rgba(16,185,129,0.15)" : "var(--surface-alt)",
        color: copied ? "#10B981" : "var(--text-secondary)",
        border: "1px solid var(--border)",
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

const PLATAFORMA_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  instagram: { emoji: "📸", color: "#E1306C", bg: "rgba(225,48,108,0.08)" },
  youtube:   { emoji: "▶️", color: "#FF0000", bg: "rgba(255,0,0,0.08)" },
  tiktok:    { emoji: "🎵", color: "#010101", bg: "rgba(0,0,0,0.06)" },
};

export function UTMLinkBlock({ block }: UTMLinkBlockProps) {
  const cfg = PLATAFORMA_CONFIG[block.plataforma] || { emoji: "🔗", color: "#5B50E5", bg: "rgba(91,80,229,0.08)" };

  const fields = [
    { label: "utm_source",  value: block.utmSource  },
    { label: "utm_medium",  value: block.utmMedium  },
    { label: "utm_content", value: block.utmContent },
  ];

  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: cfg.bg }}
        >
          {cfg.emoji}
        </div>
        <div>
          <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
            {block.label}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            utm_medium: {block.utmMedium}
          </p>
        </div>
      </div>

      {/* Parâmetros */}
      <div className="space-y-2">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold w-24 shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              {f.label}
            </span>
            <div
              className="flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg min-w-0"
              style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
            >
              <span
                className="text-xs font-mono truncate flex-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {f.value}
              </span>
              <CopyButton text={f.value} />
            </div>
          </div>
        ))}
      </div>

      {/* URL Completa */}
      <div
        className="rounded-xl p-3 space-y-2"
        style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.color}22` }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
          URL Final
        </p>
        <div className="flex items-start gap-2">
          <p
            className="text-xs font-mono break-all flex-1 leading-relaxed"
            style={{ color: "var(--text-primary)" }}
          >
            {block.urlCompleta}
          </p>
          <CopyButton
            text={block.urlCompleta}
            formattedText={formatarLinkComAssinatura(
              `${block.label} (UTM)`,
              block.urlCompleta,
              `utm_source=${block.utmSource} | utm_medium=${block.utmMedium} | utm_content=${block.utmContent}`
            )}
          />
        </div>
      </div>
    </div>
  );
}
