"use client";

import React, { useState } from "react";
import { Copy, Check, Pencil, Trash2, ToggleLeft, ToggleRight, ExternalLink } from "lucide-react";
import { LinkCheckout } from "@/lib/influenciadores";

interface LinkCheckoutItemProps {
  link: LinkCheckout;
  onUpdate: (updates: Partial<Omit<LinkCheckout, "id">>) => void;
  onDelete: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copiado!" : "Copiar URL"}
      className="p-1.5 rounded-lg transition-all"
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

export function LinkCheckoutItem({ link, onUpdate, onDelete }: LinkCheckoutItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNome, setEditNome] = useState(link.nome);
  const [editUrl, setEditUrl] = useState(link.url);

  const handleSave = () => {
    if (!editNome.trim() || !editUrl.trim()) return;
    onUpdate({ nome: editNome.trim(), url: editUrl.trim() });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditNome(link.nome);
    setEditUrl(link.url);
    setIsEditing(false);
  };

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        backgroundColor: "var(--surface)",
        border: `1px solid ${link.ativo ? "var(--border)" : "var(--border)"}`,
        opacity: link.ativo ? 1 : 0.6,
      }}
    >
      {isEditing ? (
        /* Modo de edição */
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Nome / Identificação
            </label>
            <input
              type="text"
              value={editNome}
              onChange={(e) => setEditNome(e.target.value)}
              placeholder="Ex: Produto X - Oferta Principal"
              className="coursue-input text-xs py-2"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              URL Lastlink
            </label>
            <input
              type="url"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="https://..."
              className="coursue-input text-xs py-2"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              className="coursue-btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Salvar
            </button>
            <button
              onClick={handleCancel}
              className="py-1.5 px-4 text-xs rounded-xl font-semibold transition-colors"
              style={{
                backgroundColor: "var(--surface-alt)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        /* Modo de visualização */
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <p
                className="text-sm font-bold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {link.nome}
              </p>
              {!link.ativo && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold shrink-0">
                  Inativo
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono truncate hover:underline"
                style={{ color: "var(--text-muted)" }}
              >
                {link.url}
              </a>
              <ExternalLink className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} />
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1.5 shrink-0">
            <CopyButton text={link.url} />

            <button
              onClick={() => onUpdate({ ativo: !link.ativo })}
              title={link.ativo ? "Desativar link" : "Ativar link"}
              className="p-1.5 rounded-lg transition-all"
              style={{
                backgroundColor: link.ativo ? "rgba(16,185,129,0.12)" : "var(--surface-alt)",
                color: link.ativo ? "#10B981" : "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {link.ativo ? (
                <ToggleRight className="w-3.5 h-3.5" />
              ) : (
                <ToggleLeft className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => setIsEditing(true)}
              title="Editar"
              className="p-1.5 rounded-lg transition-all"
              style={{
                backgroundColor: "var(--surface-alt)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onDelete}
              title="Remover"
              className="p-1.5 rounded-lg transition-all text-rose-500"
              style={{
                backgroundColor: "rgba(244,63,94,0.08)",
                border: "1px solid rgba(244,63,94,0.2)",
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
