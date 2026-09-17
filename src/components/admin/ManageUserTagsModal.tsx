"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Tag as TagIcon, Plus, Sparkles, User, Shield } from "lucide-react";
import { Tag, useUserTags } from "@/lib/userTags";
import { UserAccount } from "@/lib/authPermissions";
import { UserTagBadge } from "@/components/UserTagBadge";
import { toast } from "sonner";

interface ManageUserTagsModalProps {
  open: boolean;
  user: UserAccount | null;
  onClose: () => void;
  onTagsUpdated?: () => void;
}

export const ManageUserTagsModal: React.FC<ManageUserTagsModalProps> = ({
  open,
  user,
  onClose,
  onTagsUpdated,
}) => {
  const { tags, getUserTagsList, assignTagsToUser, saveTag } = useUserTags();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form para criação rápida de nova tag
  const [showCreateQuickTag, setShowCreateQuickTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#5B50E5");

  const PRESET_COLORS = [
    "#8B5CF6", // Roxo Torre
    "#5B50E5", // Azul Royal
    "#10B981", // Verde Esmeralda
    "#F59E0B", // Âmbar
    "#EF4444", // Vermelho
    "#EC4899", // Rosa
    "#06B6D4", // Ciano
    "#6366F1", // Índigo
  ];

  useEffect(() => {
    if (user && open) {
      const userCurrentTags = getUserTagsList(user.id);
      setSelectedTagIds(userCurrentTags.map((t) => t.id));
      setShowCreateQuickTag(false);
      setNewTagName("");
    }
  }, [user, open, getUserTagsList]);

  if (!open || !user) return null;

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await assignTagsToUser(user.id, selectedTagIds);
      toast.success(`Tags de ${user.comoQuerSerChamado || user.nickname || user.nome} atualizadas!`);
      if (onTagsUpdated) onTagsUpdated();
      onClose();
    } catch (e: any) {
      toast.error("Erro ao salvar tags: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      toast.error("Informe o nome da tag.");
      return;
    }

    const created = await saveTag({
      nome: newTagName.trim(),
      cor: newTagColor,
    });

    if (created) {
      toast.success(`Tag "${created.nome}" criada com sucesso!`);
      setSelectedTagIds((prev) => [...prev, created.id]);
      setNewTagName("");
      setShowCreateQuickTag(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl border flex flex-col"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Header */}
          <div
            className="p-6 flex items-center justify-between border-b"
            style={{ backgroundColor: "var(--surface-alt)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.nome)}`}
                alt={user.nome}
                className="h-10 w-10 rounded-full object-cover shrink-0 ring-2 ring-[#5B50E5]/30"
              />
              <div className="min-w-0">
                <h3 className="text-base font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  Gerenciar Tags & Atribuições
                </h3>
                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                  Colaborador: <strong className="text-[#5B50E5]">{user.comoQuerSerChamado || user.nickname || user.nome}</strong> ({user.email})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
            {/* Tags Atuais Selecionadas (Preview) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--text-secondary)" }}>
                Tags Atribuídas ({selectedTagIds.length})
              </label>
              {selectedTagIds.length === 0 ? (
                <p className="text-xs italic text-zinc-400">Nenhuma tag selecionada ainda.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border bg-zinc-500/5" style={{ borderColor: "var(--border)" }}>
                  {selectedTagIds.map((tId) => {
                    const tagObj = tags.find((t) => t.id === tId);
                    if (!tagObj) return null;
                    return (
                      <UserTagBadge
                        key={tagObj.id}
                        tag={tagObj}
                        size="sm"
                        onRemove={() => toggleTag(tagObj.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lista de Todas as Tags do Sistema */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: "var(--text-primary)" }}>
                  Tags Disponíveis no Hashira
                </label>
                <button
                  type="button"
                  onClick={() => setShowCreateQuickTag(!showCreateQuickTag)}
                  className="text-xs font-bold text-[#5B50E5] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {showCreateQuickTag ? "Fechar formulário" : "Nova Tag"}
                </button>
              </div>

              {/* Formulário Rápido de Criação */}
              {showCreateQuickTag && (
                <form
                  onSubmit={handleCreateQuick}
                  className="p-3.5 rounded-xl border space-y-3"
                  style={{ backgroundColor: "var(--surface-alt)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Nome da tag (ex: Torre, Especialista, Beta...)"
                      className="coursue-input text-xs py-1.5 flex-1"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="coursue-btn-primary px-3 py-1.5 text-xs shrink-0"
                    >
                      Salvar Tag
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-zinc-400">Cor:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewTagColor(c)}
                          className={`w-5 h-5 rounded-full border transition-transform ${
                            newTagColor === c ? "scale-125 ring-2 ring-white shadow-xs" : "opacity-80 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: c, borderColor: "rgba(0,0,0,0.2)" }}
                        />
                      ))}
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
                        title="Cor personalizada"
                      />
                    </div>
                  </div>
                </form>
              )}

              {/* Grid de Seleção das Tags */}
              <div className="space-y-2">
                {tags.map((t) => {
                  const isChecked = selectedTagIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleTag(t.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? "ring-2 ring-[#5B50E5] border-[#5B50E5] bg-[#5B50E5]/5"
                          : "hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent"
                      }`}
                      style={{ borderColor: isChecked ? "#5B50E5" : "var(--border)" }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserTagBadge tag={t} size="sm" />
                        {t.descricao && (
                          <span className="text-[11px] truncate text-zinc-400 hidden sm:inline">
                            {t.descricao}
                          </span>
                        )}
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isChecked
                            ? "bg-[#5B50E5] border-[#5B50E5] text-white"
                            : "border-zinc-400 bg-transparent"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="p-5 border-t flex items-center justify-end gap-3"
            style={{ backgroundColor: "var(--surface-alt)", borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="coursue-btn-secondary px-4 py-2 text-xs rounded-xl"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="coursue-btn-primary px-5 py-2 text-xs rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? "Salvando..." : "Salvar Atribuições"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
