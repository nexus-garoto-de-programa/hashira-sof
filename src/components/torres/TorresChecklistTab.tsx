"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react";
import {
  ChecklistItem,
  ChecklistTemplate,
  fetchChecklistDoDia,
  toggleChecklistItem,
  createChecklistItemAvulso,
  deleteChecklistItem,
  fetchChecklistTemplates,
  saveChecklistTemplate,
  deleteChecklistTemplate,
} from "@/lib/torresData";
import { UserAccount, getAdminSimulatedRole } from "@/lib/authPermissions";
import { useRealtimeSubscription } from "@/lib/realtimeSync";
import { toast } from "sonner";

interface TorresChecklistTabProps {
  currentUser: UserAccount;
}

export const TorresChecklistTab: React.FC<TorresChecklistTabProps> = ({ currentUser }) => {
  const [itens, setItens] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoItemAvulso, setNovoItemAvulso] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Admin: gerenciamento de templates fixos
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [novoTemplateTexto, setNovoTemplateTexto] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const isAdmin =
    currentUser.email === "mhvzbusiness@gmail.com" ||
    currentUser.papel === "administrador";
  const simulated = getAdminSimulatedRole();
  const isAdminView = isAdmin && simulated === "administrador";

  const carregarChecklist = async () => {
    if (!currentUser.id) return;
    try {
      const res = await fetchChecklistDoDia(currentUser.id);
      setItens(res);
    } finally {
      setLoading(false);
    }
  };

  const carregarTemplates = async () => {
    const res = await fetchChecklistTemplates();
    setTemplates(res);
  };

  useEffect(() => {
    carregarChecklist();
    if (isAdminView) {
      carregarTemplates();
    }
  }, [currentUser.id, isAdminView]);

  useRealtimeSubscription({
    topics: ["checklist"],
    onUpdate: () => {
      carregarChecklist();
      if (isAdminView) carregarTemplates();
    },
  });

  const handleToggle = async (item: ChecklistItem) => {
    const novoEstado = !item.concluido;
    setItens((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, concluido: novoEstado } : i))
    );
    try {
      await toggleChecklistItem(item.id, novoEstado);
      if (novoEstado) {
        toast.success("Item concluído! ✅");
      }
    } catch (e) {
      toast.error("Erro ao atualizar item.");
    }
  };

  const handleCriarAvulso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoItemAvulso.trim() || !currentUser.id) return;

    setSubmitting(true);
    try {
      const res = await createChecklistItemAvulso(currentUser.id, novoItemAvulso.trim());
      if (res) {
        setItens((prev) => [...prev, res]);
        setNovoItemAvulso("");
        toast.success("Item avulso adicionado!");
      }
    } catch (e) {
      toast.error("Erro ao adicionar item avulso.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteChecklistItem(id);
    setItens((prev) => prev.filter((i) => i.id !== id));
    toast.success("Item removido do checklist de hoje.");
  };

  // Gerenciamento de templates (Admin)
  const handleAdicionarTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTemplateTexto.trim()) return;

    setSavingTemplate(true);
    try {
      const res = await saveChecklistTemplate({
        item: novoTemplateTexto.trim(),
        criado_por: currentUser.id,
      });
      if (res) {
        setTemplates((prev) => [...prev, res]);
        setNovoTemplateTexto("");
        toast.success("Item fixo cadastrado com sucesso! Ele aparecerá diariamente.");
      }
    } catch (e) {
      toast.error("Erro ao salvar item fixo.");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Deseja realmente remover este item fixo diário?")) return;
    await deleteChecklistTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("Item fixo excluído.");
  };

  const concluidosCount = itens.filter((i) => i.concluido).length;
  const totalCount = itens.length;
  const percentual = totalCount > 0 ? Math.round((concluidosCount / totalCount) * 100) : 0;

  return (
    <div
      className="p-6 rounded-[28px] space-y-5 shadow-sm"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header com Progresso */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
              Checklist Diário
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-500">
              {percentual}% concluído
            </span>
          </div>
          <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            Rotina diária obrigatória e tarefas pontuais do dia
          </p>
        </div>

        {isAdminView && (
          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
            title="Gerenciar itens fixos da empresa"
          >
            <Settings className="w-3.5 h-3.5 text-[#5B50E5]" />
            <span>Itens Fixos (Admin)</span>
          </button>
        )}
      </div>

      {/* Barra de Progresso */}
      <div className="space-y-1">
        <div className="w-full h-2 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${percentual}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
          <span>{concluidosCount} de {totalCount} rotinas concluídas</span>
          <span>{totalCount - concluidosCount} pendentes</span>
        </div>
      </div>

      {/* Formulário de Criação de Item Avulso */}
      <form onSubmit={handleCriarAvulso} className="flex gap-2">
        <input
          type="text"
          placeholder="Adicionar item avulso ao meu checklist de hoje..."
          value={novoItemAvulso}
          onChange={(e) => setNovoItemAvulso(e.target.value)}
          className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors outline-none"
          style={{
            backgroundColor: "var(--surface-alt)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
        <button
          type="submit"
          disabled={submitting || !novoItemAvulso.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#5B50E5] hover:bg-[#483EA8] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Adicionar</span>
        </button>
      </form>

      {/* Lista de Itens do Checklist */}
      <div className="space-y-2">
        {itens.length === 0 ? (
          <div
            className="p-6 rounded-2xl text-center space-y-1"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px dashed var(--border)",
            }}
          >
            <CheckCircle2 className="w-6 h-6 text-zinc-400 mx-auto" />
            <p className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              Nenhum item no checklist ainda.
            </p>
          </div>
        ) : (
          itens.map((item) => {
            const isFixo = !!item.template_id;

            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item)}
                className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border transition-all cursor-pointer group hover:border-[#5B50E5]/40 ${
                  item.concluido
                    ? "bg-emerald-500/5 border-emerald-500/20 opacity-75"
                    : ""
                }`}
                style={{
                  backgroundColor: item.concluido ? undefined : "var(--surface-alt)",
                  borderColor: item.concluido ? undefined : "var(--border)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(item);
                    }}
                    className="shrink-0 text-xs text-[#5B50E5]"
                  >
                    {item.concluido ? (
                      <CheckSquare className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Square className="w-5 h-5 text-zinc-400 group-hover:text-[#5B50E5] transition-colors" />
                    )}
                  </button>

                  <span
                    className={`text-xs font-bold truncate transition-all ${
                      item.concluido ? "line-through text-zinc-400" : ""
                    }`}
                    style={{ color: item.concluido ? undefined : "var(--text-primary)" }}
                  >
                    {item.item}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                      isFixo
                        ? "bg-[#5B50E5]/15 text-[#5B50E5]"
                        : "bg-zinc-500/15 text-zinc-400"
                    }`}
                  >
                    {isFixo ? "Fixo Empresa" : "Avulso"}
                  </span>

                  {!isFixo && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remover item avulso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Admin: Gerenciar Itens Fixos Globais */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 relative"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#5B50E5]" />
                <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                  Itens Fixos Diários da Empresa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-500/15 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Estes itens são gerados automaticamente todos os dias para todos os colaboradores no primeiro acesso.
            </p>

            <form onSubmit={handleAdicionarTemplate} className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Alinhamento de Metas Semanais..."
                value={novoTemplateTexto}
                onChange={(e) => setNovoTemplateTexto(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold border outline-none"
                style={{
                  backgroundColor: "var(--surface-alt)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                disabled={savingTemplate || !novoTemplateTexto.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#5B50E5] hover:bg-[#483EA8] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar</span>
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3 rounded-xl flex items-center justify-between gap-3 border"
                  style={{
                    backgroundColor: "var(--surface-alt)",
                    borderColor: "var(--border)",
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    {tpl.item}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Excluir item fixo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="px-4 py-2 rounded-xl bg-[#5B50E5] text-white text-xs font-bold cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
