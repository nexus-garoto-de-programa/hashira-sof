"use client";

import React, { useState } from "react";
import { Copy, Check, Pencil, Plus, ExternalLink, X } from "lucide-react";
import {
  Influenciador,
  LinkCheckout,
  CATEGORIAS_CHECKOUT_PREDEFINIDAS,
  upsertLinkCheckoutCategoria,
  formatarLinkComAssinatura,
  formatarTodosLinksCheckout,
} from "@/lib/influenciadores";
import { toast } from "sonner";

interface CheckoutCategoriasViewProps {
  influenciador: Influenciador;
  onSaveInfluenciador: (updated: Influenciador) => Promise<void>;
  somenteLeitura?: boolean;
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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
      style={{
        backgroundColor: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
        color: copied ? "#10B981" : "#ffffff",
        border: copied ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? "Copiado!" : "Copiar"}</span>
    </button>
  );
}

export function CheckoutCategoriasView({
  influenciador,
  onSaveInfluenciador,
  somenteLeitura = false,
}: CheckoutCategoriasViewProps) {
  // Estado para editar um sub-item específico { categoriaId, subItemId, label, urlAtual }
  const [editingItem, setEditingItem] = useState<{
    categoriaId: string;
    subItemId: string;
    label: string;
    url: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);

  // Encontra um link cadastrado correspondente (por categoriaId+subItemId, ou fallback por nome aproximado)
  const findLink = (categoriaId: string, subItemId: string, subLabel: string): LinkCheckout | undefined => {
    // 1. Busca exata por categoriaId e subItemId
    const exact = influenciador.linksCheckout.find(
      (l) => l.categoriaId === categoriaId && l.subItemId === subItemId
    );
    if (exact) return exact;

    // 2. Fallback para dados criados anteriormente (busca por nome/rótulo)
    return influenciador.linksCheckout.find(
      (l) => l.nome.toUpperCase().trim() === subLabel.toUpperCase().trim()
    );
  };

  const handleOpenEdit = (categoriaId: string, subItemId: string, label: string, currentUrl: string) => {
    if (somenteLeitura) return;
    setEditingItem({
      categoriaId,
      subItemId,
      label,
      url: currentUrl || "",
    });
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      const updatedInf = upsertLinkCheckoutCategoria(
        influenciador,
        editingItem.categoriaId,
        editingItem.subItemId,
        editingItem.label,
        editingItem.url
      );
      await onSaveInfluenciador(updatedInf);
      setEditingItem(null);
      toast.success(`Link de "${editingItem.label}" atualizado!`);
    } catch {
      toast.error("Erro ao salvar link de checkout.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Botão para copiar TODOS os links de checkout */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-500/80">
          Categorias de Oferta &amp; Checkout
        </p>
        <CopyButton
          text=""
          formattedText={formatarTodosLinksCheckout(influenciador)}
        />
      </div>

      {CATEGORIAS_CHECKOUT_PREDEFINIDAS.map((cat) => (
        <div
          key={cat.id}
          className="rounded-2xl p-5 space-y-4 transition-all"
          style={{
            backgroundColor: "#12111A",
            border: "1px solid rgba(217, 119, 6, 0.4)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {/* Título da Categoria */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{cat.icone}</span>
              <h3 className="text-base font-extrabold text-[#F59E0B] tracking-wide font-['Plus_Jakarta_Sans']">
                {cat.titulo}
              </h3>
            </div>
          </div>

          {/* Sub-itens da Categoria */}
          <div className="flex flex-wrap gap-3.5 items-stretch">
            {cat.subItems.map((sub) => {
              const link = findLink(cat.id, sub.id, sub.label);
              const temLink = Boolean(link && link.url && link.url.trim().length > 0);

              return (
                <div
                  key={sub.id}
                  className="rounded-xl px-4 py-3 min-w-[240px] flex-1 max-w-full flex items-center justify-between gap-3 transition-all"
                  style={{
                    backgroundColor: "#191724",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  {/* Info do Sub-item */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-300">
                      {sub.label}
                    </p>
                    {temLink ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-gray-400 truncate max-w-[160px] block">
                          {link?.url}
                        </span>
                        <a
                          href={link?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs font-serif italic text-gray-500">
                        sem link
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  {!somenteLeitura && (
                    <div className="flex items-center gap-2 shrink-0">
                      {temLink ? (
                        <>
                          <CopyButton
                            text={link!.url}
                            formattedText={formatarLinkComAssinatura(
                              `Checkout — ${cat.titulo} (${sub.label})`,
                              link!.url
                            )}
                          />
                          <button
                            onClick={() =>
                              handleOpenEdit(cat.id, sub.id, sub.label, link!.url)
                            }
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-gray-300 hover:text-white"
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                            }}
                          >
                            Editar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() =>
                            handleOpenEdit(cat.id, sub.id, sub.label, "")
                          }
                          className="p-2 rounded-lg text-xs font-bold transition-all text-gray-300 hover:text-white hover:border-amber-500/50"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                          }}
                          title="Adicionar link"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {somenteLeitura && temLink && (
                    <div className="flex items-center gap-2 shrink-0">
                      <CopyButton
                        text={link!.url}
                        formattedText={formatarLinkComAssinatura(
                          `Checkout — ${cat.titulo} (${sub.label})`,
                          link!.url
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modal / Popup de Edição da URL */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl"
            style={{
              backgroundColor: "#161422",
              border: "1px solid rgba(245, 158, 11, 0.4)",
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-[#F59E0B] uppercase tracking-wider">
                Configurar Link — {editingItem.label}
              </h4>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">
                URL de Checkout (Lastlink)
              </label>
              <input
                type="url"
                value={editingItem.url}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, url: e.target.value })
                }
                placeholder="https://pay.lastlink.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono text-white bg-[#0D0C14] border border-gray-700 focus:border-[#F59E0B] focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveItem}
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-[#F59E0B] hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {saving ? "Salvando..." : "Salvar Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
