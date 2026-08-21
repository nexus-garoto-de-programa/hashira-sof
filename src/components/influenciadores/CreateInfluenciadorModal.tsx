"use client";

import React, { useState, useEffect } from "react";
import { X, UserRoundPlus, ImageIcon } from "lucide-react";
import { Influenciador, gerarSlug, generateTokenAcessoRapido } from "@/lib/influenciadores";
import { getActiveUser } from "@/lib/authPermissions";
import { toast } from "sonner";

interface CreateInfluenciadorModalProps {
  onClose: () => void;
  onSave: (inf: Influenciador) => void;
  urlBaseGlobal?: string; // domínio padrão da empresa
}

export function CreateInfluenciadorModal({
  onClose,
  onSave,
  urlBaseGlobal = "hashirasensix.com.br",
}: CreateInfluenciadorModalProps) {
  const [nome, setNome] = useState("");
  const [slugBio, setSlugBio] = useState("");
  const [slugPrincipal, setSlugPrincipal] = useState("");
  const [slugBioManual, setSlugBioManual] = useState(false);
  const [slugPrincipalManual, setSlugPrincipalManual] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto-gera os slugs ao digitar o nome
  useEffect(() => {
    if (!slugBioManual) setSlugBio(gerarSlug(nome));
    if (!slugPrincipalManual) setSlugPrincipal(gerarSlug(nome));
  }, [nome, slugBioManual, slugPrincipalManual]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome do influenciador");
      return;
    }
    if (!slugBio.trim() || !slugPrincipal.trim()) {
      toast.error("Os slugs não podem estar vazios");
      return;
    }

    setSaving(true);
    const activeUser = getActiveUser();

    const novoInfluenciador: Influenciador = {
      id: crypto.randomUUID ? crypto.randomUUID() : "inf-" + Date.now(),
      nome: nome.trim(),
      slugBio: slugBio.trim(),
      slugPrincipal: slugPrincipal.trim(),
      fotoUrl: "",
      urlBase: urlBaseGlobal,
      urlArvore: "biohashira.com.br",
      utmSourcePadrao: "beacons",
      linksCheckout: [],
      tokenAcessoRapido: generateTokenAcessoRapido(),
      ativo: true,
      criadoPor: activeUser?.email || "admin",
      criadoEm: new Date().toISOString(),
    };

    onSave(novoInfluenciador);
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#5B50E5]/15 flex items-center justify-center">
              <UserRoundPlus className="w-5 h-5 text-[#5B50E5]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                Cadastrar Influenciador
              </h2>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                A foto pode ser adicionada depois
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              Nome do Influenciador *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Hashira"
              className="coursue-input text-sm py-3 w-full"
              autoFocus
              required
            />
          </div>

          {/* Slug Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              Slug da Árvore de Links
              <span className="text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>
                (biohashira.com.br/{slugBio || "slug"})
              </span>
            </label>
            <input
              type="text"
              value={slugBio}
              onChange={(e) => {
                setSlugBioManual(true);
                setSlugBio(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
              }}
              placeholder="ex: joao-hashira"
              className="coursue-input text-sm py-3 w-full font-mono"
            />
          </div>

          {/* Slug Principal (UTM) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              Slug UTM
              <span className="text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>
                (utm_content={slugPrincipal || "slug"})
              </span>
            </label>
            <input
              type="text"
              value={slugPrincipal}
              onChange={(e) => {
                setSlugPrincipalManual(true);
                setSlugPrincipal(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
              }}
              placeholder="ex: joao-hashira"
              className="coursue-input text-sm py-3 w-full font-mono"
            />
          </div>

          {/* Preview */}
          {nome && (
            <div
              className="rounded-2xl p-4 space-y-2"
              style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Preview
              </p>
              <div className="space-y-1.5 text-[11px] font-mono" style={{ color: "var(--text-secondary)" }}>
                <p>🌐 biohashira.com.br/{slugBio || "slug"}</p>
                <p>📸 biohashira.com.br/{slugBio || "slug"}/ig</p>
                <p>📊 utm_content={slugPrincipal || "slug"}</p>
              </div>
            </div>
          )}

          {/* Aviso de foto */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
            style={{ backgroundColor: "rgba(91,80,229,0.08)", border: "1px solid rgba(91,80,229,0.15)" }}
          >
            <ImageIcon className="w-4 h-4 text-[#5B50E5] shrink-0" />
            <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              A foto de perfil pode ser adicionada na aba <strong>Configurações</strong> após o cadastro.
            </p>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-bold transition-colors"
              style={{
                backgroundColor: "var(--surface-alt)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !nome.trim()}
              className="flex-1 coursue-btn-primary py-3 text-sm disabled:opacity-50"
            >
              {saving ? "Cadastrando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
