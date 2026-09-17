"use client";

import React, { useState } from "react";
import { Plus, Tag as TagIcon, Trash2, Edit3, Users, Castle, Sparkles, Check, X } from "lucide-react";
import { Tag, useUserTags, slugify } from "@/lib/userTags";
import { UserAccount } from "@/lib/authPermissions";
import { UserTagBadge } from "@/components/UserTagBadge";
import { toast } from "sonner";

interface TagsManagementTabProps {
  users: UserAccount[];
}

export const TagsManagementTab: React.FC<TagsManagementTabProps> = ({ users }) => {
  const { tags, userTags, saveTag, deleteTag } = useUserTags();
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#8B5CF6");
  const [descricao, setDescricao] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const PRESET_COLORS = [
    "#8B5CF6", // Roxo Torre
    "#5B50E5", // Azul Royal
    "#10B981", // Verde Esmeralda
    "#F59E0B", // Âmbar
    "#EF4444", // Vermelho
    "#EC4899", // Rosa
    "#06B6D4", // Ciano
    "#6366F1", // Índigo
    "#14B8A6", // Teal
    "#F97316", // Laranja
  ];

  const handleOpenCreate = () => {
    setEditingTag(null);
    setNome("");
    setCor("#5B50E5");
    setDescricao("");
    setShowModal(true);
  };

  const handleOpenEdit = (t: Tag) => {
    setEditingTag(t);
    setNome(t.nome);
    setCor(t.cor);
    setDescricao(t.descricao || "");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("O nome da tag é obrigatório.");
      return;
    }

    setIsSaving(true);
    try {
      await saveTag({
        id: editingTag ? editingTag.id : undefined,
        nome: nome.trim(),
        cor,
        descricao: descricao.trim(),
      });
      toast.success(`Tag "${nome}" salva com sucesso!`);
      setShowModal(false);
    } catch (e: any) {
      toast.error("Erro ao salvar tag: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (t: Tag) => {
    const isTorre = t.slug === "torre";
    const assignedCount = userTags.filter((ut) => ut.tagId === t.id).length;

    let confirmMsg = `Tem certeza que deseja excluir a tag "${t.nome}"?`;
    if (assignedCount > 0) {
      confirmMsg += ` Ela está atribuída a ${assignedCount} colaborador(es).`;
    }
    if (isTorre) {
      confirmMsg = `⚠️ ATENÇÃO: A tag "Torre" é a chave de acesso do módulo Central dos Torres. Tem certeza absoluta que deseja removê-la?`;
    }

    if (!confirm(confirmMsg)) return;

    try {
      await deleteTag(t.id);
      toast.success(`Tag "${t.nome}" removida com sucesso!`);
    } catch (e: any) {
      toast.error("Erro ao excluir tag: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com CTA de Criar Tag */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold font-['Plus_Jakarta_Sans'] flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <TagIcon className="w-5 h-5 text-[#5B50E5]" />
            Tags & Atribuições ({tags.length})
          </h2>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Crie e gerencie tags transversais para categorizar, filtrar e controlar acessos de colaboradores.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="coursue-btn-primary py-2.5 px-5 text-xs shadow-lg shadow-[#5B50E5]/25 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nova Tag
        </button>
      </div>

      {/* Grid de Tags Cadastradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tags.map((t) => {
          const isTorre = t.slug === "torre";
          const assignedUserIds = userTags
            .filter((ut) => ut.tagId === t.id)
            .map((ut) => ut.userId);
          const assignedUsers = users.filter((u) => assignedUserIds.includes(u.id));

          return (
            <div
              key={t.id}
              className="coursue-card p-6 rounded-[24px] border shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all group relative overflow-hidden"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: isTorre ? "rgba(139, 92, 246, 0.4)" : "var(--border)",
              }}
            >
              {/* Tarja superior com a cor da tag */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: t.cor }}
              />

              <div className="space-y-3 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UserTagBadge tag={t} size="md" />
                    {isTorre && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        Gate Oficial
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-zinc-500 hover:text-[#5B50E5]"
                      title="Editar Tag"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors text-zinc-400 hover:text-rose-500"
                      title="Excluir Tag"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                  {t.descricao || "Sem descrição informada."}
                </p>
              </div>

              {/* Seção de Membros Vinculados */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="font-semibold text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    {assignedUsers.length} {assignedUsers.length === 1 ? "colaborador" : "colaboradores"}
                  </span>
                </div>

                {/* Mini Avatares dos membros com a tag */}
                <div className="flex -space-x-1.5 overflow-hidden">
                  {assignedUsers.slice(0, 4).map((m) => (
                    <img
                      key={m.id}
                      src={m.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(m.nome)}`}
                      alt={m.nome}
                      title={m.comoQuerSerChamado || m.nome}
                      className="inline-block h-6 w-6 rounded-full ring-2 ring-[var(--surface)] object-cover"
                    />
                  ))}
                  {assignedUsers.length > 4 && (
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[9px] font-bold text-zinc-600 dark:text-zinc-300 ring-2 ring-[var(--surface)]">
                      +{assignedUsers.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar / Editar Tag */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl border"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div
              className="p-6 flex items-center justify-between border-b"
              style={{ backgroundColor: "var(--surface-alt)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#5B50E5] text-white">
                  <TagIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  {editingTag ? "Editar Tag" : "Nova Tag do Sistema"}
                </h3>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Nome da Tag *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Torre, Copywriter, Especialista..."
                  className="coursue-input text-xs"
                  required
                  autoFocus
                />
                {nome && (
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Slug gerado: <code className="text-[#5B50E5] font-mono">#{slugify(nome)}</code>
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Cor Temática
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCor(c)}
                        className={`w-7 h-7 rounded-full border transition-all ${
                          cor === c ? "scale-110 ring-2 ring-white shadow-md" : "opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c, borderColor: "rgba(0,0,0,0.15)" }}
                      />
                    ))}
                    <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                      <input
                        type="color"
                        value={cor}
                        onChange={(e) => setCor(e.target.value)}
                        className="w-7 h-7 p-0 border-0 rounded cursor-pointer bg-transparent"
                        title="Cor personalizada"
                      />
                      <span className="text-[11px] font-mono font-bold text-zinc-400">{cor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Descrição (Opcional)
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Explique o propósito ou privilégios associados a esta tag..."
                  className="coursue-input text-xs min-h-[70px] resize-none"
                  rows={3}
                />
              </div>

              {/* Preview */}
              <div className="p-3.5 rounded-xl border bg-zinc-500/5 space-y-1.5" style={{ borderColor: "var(--border)" }}>
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Pré-visualização</span>
                <UserTagBadge
                  tag={{
                    id: "preview",
                    nome: nome.trim() || "Exemplo de Tag",
                    slug: slugify(nome || "exemplo"),
                    cor,
                    descricao,
                  }}
                  size="md"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="coursue-btn-secondary px-4 py-2 text-xs rounded-xl"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="coursue-btn-primary px-5 py-2 text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Salvando..." : editingTag ? "Atualizar Tag" : "Criar Tag"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
