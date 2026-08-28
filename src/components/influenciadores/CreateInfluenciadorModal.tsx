"use client";

import React, { useState, useRef } from "react";
import { X, UserRoundPlus, Upload, Camera, Trash2, Loader2 } from "lucide-react";
import {
  Influenciador,
  generateTokenAcessoRapido,
  getStoredInfluenciadores,
  gerarSlugUnico,
} from "@/lib/influenciadores";
import { uploadFileToSupabaseStorage } from "@/lib/supabase";
import { getActiveUser } from "@/lib/authPermissions";
import { toast } from "sonner";

interface CreateInfluenciadorModalProps {
  onClose: () => void;
  onSave: (inf: Influenciador) => void;
  urlBaseGlobal?: string;
}

export function CreateInfluenciadorModal({
  onClose,
  onSave,
  urlBaseGlobal = "hashirasensix.com.br",
}: CreateInfluenciadorModalProps) {
  const [nome, setNome] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (file: File) => {
    // Validação de tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).");
      return;
    }

    // Validação de tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setFotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFotoPreview(objectUrl);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFoto = () => {
    setFotoFile(null);
    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
      setFotoPreview("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      toast.error("Informe o nome do influenciador.");
      return;
    }

    setSaving(true);
    let fotoUrlFinal = "";

    // Upload da foto para o Supabase Storage caso o usuário tenha selecionado um arquivo
    if (fotoFile) {
      try {
        const uploadedUrl = await uploadFileToSupabaseStorage(fotoFile, "avatars");
        if (uploadedUrl && !uploadedUrl.startsWith("data:")) {
          fotoUrlFinal = uploadedUrl;
        } else {
          toast.error("Não foi possível enviar a foto. O influenciador será cadastrado sem foto.");
        }
      } catch (err) {
        console.error("[CDI UPLOAD ERROR]", err);
        toast.error("Erro ao fazer upload da foto.");
      }
    }

    const existentes = getStoredInfluenciadores();
    const slugBase = gerarSlugUnico(nomeLimpo, existentes);
    const activeUser = getActiveUser();

    const novoInfluenciador: Influenciador = {
      id: crypto.randomUUID ? crypto.randomUUID() : "inf-" + Date.now(),
      slugBase,
      nomeExibicao: nomeLimpo,
      nome: nomeLimpo,
      sufixoVendas: "-new",
      ehContaInterna: false,
      fotoUrl: fotoUrlFinal,
      avatarUrl: fotoUrlFinal,
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
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5B50E5]/15 flex items-center justify-center">
              <UserRoundPlus className="w-5 h-5 text-[#5B50E5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                Cadastrar Influenciador
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Preencha os dados básicos para adicionar à grade
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário Simplificado */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nome do Influenciador */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
              Nome do Influenciador *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Hashira"
              className="coursue-input text-sm py-3 w-full font-medium"
              autoFocus
              required
            />
          </div>

          {/* Upload de Foto (Opcional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                Foto de Perfil (Opcional)
              </label>
              {fotoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveFoto}
                  className="text-[11px] text-rose-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Remover foto
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
            />

            {fotoPreview ? (
              /* Preview Circular / Arredondado da Foto */
              <div
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
              >
                <div className="relative shrink-0">
                  <img
                    src={fotoPreview}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#5B50E5]/30 shadow-md"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {fotoFile?.name || "Foto selecionada"}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {fotoFile ? `${(fotoFile.size / 1024).toFixed(0)} KB` : "Pronta para envio"}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-[#5B50E5] font-semibold hover:underline mt-1 block"
                  >
                    Trocar imagem
                  </button>
                </div>
              </div>
            ) : (
              /* Área de Drop e Seleção */
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 ${
                  isDragging
                    ? "border-[#5B50E5] bg-[#5B50E5]/10"
                    : "border-gray-300/20 dark:border-white/10 hover:border-[#5B50E5]/50 hover:bg-white/5"
                }`}
                style={{ backgroundColor: "var(--surface-alt)" }}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5B50E5]/20 to-[#7C3AED]/20 flex items-center justify-center text-[#5B50E5]">
                  {nome.trim() ? (
                    <span className="font-extrabold text-lg">
                      {nome.trim().charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    Clique para selecionar ou arraste uma foto
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    PNG, JPG ou WebP (Máx. 5MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 rounded-2xl text-xs font-bold transition-colors"
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
              className="flex-1 coursue-btn-primary py-3 text-xs font-bold disabled:opacity-50 shadow-lg shadow-[#5B50E5]/25 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <span>Cadastrar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
