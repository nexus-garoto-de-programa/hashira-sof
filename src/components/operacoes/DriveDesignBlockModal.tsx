"use client";

import React, { useState, useRef } from "react";
import { X, Folder, Upload, Link as LinkIcon, Check, Image as ImageIcon } from "lucide-react";
import { DriveDesignBlock } from "@/lib/driveDesignData";
import { uploadFileToSupabaseStorage } from "@/lib/supabase";
import { toast } from "sonner";

interface DriveDesignBlockModalProps {
  block?: DriveDesignBlock | null;
  onClose: () => void;
  onSave: (block: DriveDesignBlock) => Promise<void>;
  criadoPor: string;
}

export function DriveDesignBlockModal({
  block,
  onClose,
  onSave,
  criadoPor,
}: DriveDesignBlockModalProps) {
  const [titulo, setTitulo] = useState(block?.titulo || "");
  const [descricao, setDescricao] = useState(block?.descricao || "");
  const [bannerUrl, setBannerUrl] = useState(block?.bannerUrl || "");
  const [driveUrl, setDriveUrl] = useState(block?.driveUrl || "");
  const [ordem, setOrdem] = useState(block?.ordem ?? 0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const url = await uploadFileToSupabaseStorage(file, "drive-design");
    if (url) {
      setBannerUrl(url);
      toast.success("Banner enviado com sucesso!");
    } else {
      toast.error("Falha ao fazer upload do banner.");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("Informe o título do bloco");
      return;
    }
    if (!driveUrl.trim()) {
      toast.error("Informe a URL do Google Drive");
      return;
    }

    setSaving(true);
    try {
      const novoBloco: DriveDesignBlock = {
        id: block?.id || "ddb-" + Date.now(),
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        bannerUrl: bannerUrl.trim(),
        driveUrl: driveUrl.trim(),
        ordem: Number(ordem) || 0,
        criadoPor: block?.criadoPor || criadoPor || "admin",
        criadoEm: block?.criadoEm || new Date().toISOString(),
      };

      await onSave(novoBloco);
      onClose();
    } catch {
      toast.error("Erro ao salvar bloco de design");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-8"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#5B50E5]/15 flex items-center justify-center">
              <Folder className="w-5 h-5 text-[#5B50E5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                {block ? "Editar Bloco do Drive" : "Novo Bloco de Design"}
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Link rápido para pastas de assets no Google Drive
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              Título do Bloco *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: CAPAS DE PRODUTO"
              className="coursue-input text-sm py-2.5 w-full"
              autoFocus
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              Descrição Curta
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Visíveis no painel interno da Lastlink, vitrines e módulos..."
              rows={2}
              className="coursue-input text-sm py-2.5 w-full resize-none"
            />
          </div>

          {/* URL do Drive */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              URL do Google Drive *
            </label>
            <div className="relative">
              <input
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="coursue-input text-xs py-2.5 w-full font-mono pl-9"
                required
              />
              <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Banner Image */}
          <div className="space-y-2">
            <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              Imagem de Banner do Card
            </label>
            
            {/* Preview se houver bannerUrl */}
            {bannerUrl ? (
              <div className="relative rounded-2xl overflow-hidden aspect-video border border-border group">
                <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="coursue-btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Trocar
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerUrl("")}
                    className="py-1.5 px-3 text-xs bg-rose-600 text-white rounded-xl font-bold"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors hover:border-[#5B50E5]"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-alt)" }}
              >
                <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                  {uploading ? "Enviando imagem..." : "Clique para fazer upload da capa (16:9)"}
                </p>
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                  JPG, PNG ou WebP
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadBanner}
            />

            {/* Input secundário para URL direta de imagem */}
            <div className="pt-1">
              <input
                type="text"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="Ou cole a URL direta da imagem aqui..."
                className="coursue-input text-[11px] py-2 w-full font-mono"
              />
            </div>
          </div>

          {/* Ordem */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              Ordem de Exibição
            </label>
            <input
              type="number"
              value={ordem}
              onChange={(e) => setOrdem(Number(e.target.value))}
              placeholder="0"
              className="coursue-input text-sm py-2 w-32"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-colors"
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
              disabled={saving || uploading || !titulo.trim() || !driveUrl.trim()}
              className="flex-1 coursue-btn-primary py-2.5 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar Bloco"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
