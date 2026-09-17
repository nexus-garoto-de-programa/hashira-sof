"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { UserAccount, getAdminSimulatedRole, fetchUsersFromSupabase } from "@/lib/authPermissions";
import { Tag, UserTag, fetchTags, fetchUserTags, userHasTag } from "@/lib/userTags";
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

  // Admin: gerenciamento de templates fixos e rituais
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [novoTemplateTexto, setNovoTemplateTexto] = useState("");
  const [novoTemplateColaboradorId, setNovoTemplateColaboradorId] = useState("");
  const [modalFiltroEscopo, setModalFiltroEscopo] = useState<string>("todos");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Colaborador ativo sendo visualizado no checklist diário
  const [colaboradorAtivoId, setColaboradorAtivoId] = useState<string>(currentUser.id);

  // Dados de usuários e tags para mapear Torres dinamicamente
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [userTags, setUserTags] = useState<UserTag[]>([]);

  const isAdmin =
    currentUser.email === "mhvzbusiness@gmail.com" ||
    currentUser.papel === "administrador";
  const simulated = getAdminSimulatedRole();
  const isAdminView = isAdmin && simulated === "administrador";

  const carregarTorres = async () => {
    try {
      const [uData, tData, utData] = await Promise.all([
        fetchUsersFromSupabase(),
        fetchTags(),
        fetchUserTags(),
      ]);
      setUsers(uData);
      setTags(tData);
      setUserTags(utData);
    } catch (e) {
      console.error("[CHECKLIST] Erro ao carregar torres:", e);
    }
  };

  const carregarChecklist = async (idAlvo?: string) => {
    const idFinal = idAlvo || colaboradorAtivoId;
    if (!idFinal) return;
    try {
      const res = await fetchChecklistDoDia(idFinal);
      setItens(res);
    } finally {
      setLoading(false);
    }
  };

  const carregarTemplates = async () => {
    // Admin vê todos os templates (para gerenciar no modal). Colaborador vê gerais + seus exclusivos.
    const res = await fetchChecklistTemplates(isAdminView ? undefined : currentUser.id);
    setTemplates(res);
  };

  useEffect(() => {
    carregarTemplates();
    carregarTorres();
  }, [currentUser.id, isAdminView]);

  // Lista dinâmica de Torres
  const torresDisponiveis = useMemo(() => {
    return users
      .filter((u) => userHasTag(u, "torre", userTags, tags))
      .map((u) => ({
        id: u.id,
        nome: u.nome,
        apelido: u.comoQuerSerChamado || u.nickname || u.nome,
      }))
      .sort((a, b) => a.apelido.localeCompare(b.apelido, "pt-BR"));
  }, [users, userTags, tags]);

  // Se for admin/gestor e o usuário atual não for uma torre, seleciona por padrão o Xarada (ou torre com ritual)
  useEffect(() => {
    if (isAdminView && torresDisponiveis.length > 0) {
      const isUserTorre = userHasTag(currentUser, "torre", userTags, tags);
      if (!isUserTorre && colaboradorAtivoId === currentUser.id) {
        const xarada = torresDisponiveis.find((t) => t.id === "usr-1786476427231") || torresDisponiveis[0];
        if (xarada) {
          setColaboradorAtivoId(xarada.id);
        }
      }
    }
  }, [isAdminView, torresDisponiveis, currentUser, userTags, tags, colaboradorAtivoId]);

  useEffect(() => {
    carregarChecklist(colaboradorAtivoId);
  }, [colaboradorAtivoId]);

  useRealtimeSubscription({
    topics: ["checklist", "tags", "user_tags", "usuarios"],
    onUpdate: () => {
      carregarChecklist(colaboradorAtivoId);
      carregarTemplates();
      carregarTorres();
    },
  });

  const torreNomeMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      map.set(u.id, u.comoQuerSerChamado || u.nickname || u.nome);
    });
    return map;
  }, [users]);

  // Mapa rápido de templates por ID para exibir badge no checklist
  const templateMap = useMemo(() => {
    const map = new Map<string, ChecklistTemplate>();
    templates.forEach((t) => map.set(t.id, t));
    return map;
  }, [templates]);

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
    if (!novoItemAvulso.trim() || !colaboradorAtivoId) return;

    setSubmitting(true);
    try {
      const res = await createChecklistItemAvulso(colaboradorAtivoId, novoItemAvulso.trim());
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
        colaborador_id: novoTemplateColaboradorId || null,
        criado_por: currentUser.id,
        ordem: templates.length + 1,
      });
      if (res) {
        setTemplates((prev) => [...prev, res]);
        setNovoTemplateTexto("");
        toast.success(
          novoTemplateColaboradorId
            ? `Ritual exclusivo cadastrado para ${torreNomeMap.get(novoTemplateColaboradorId) || "a Torre"}!`
            : "Item fixo diário da empresa cadastrado com sucesso!"
        );
      }
    } catch (e) {
      toast.error("Erro ao salvar item fixo.");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Deseja realmente remover este template diário?")) return;
    await deleteChecklistTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("Item fixo excluído.");
  };

  const concluidosCount = itens.filter((i) => i.concluido).length;
  const totalCount = itens.length;
  const percentual = totalCount > 0 ? Math.round((concluidosCount / totalCount) * 100) : 0;

  // Filtragem no modal do Admin
  const templatesFiltrados = templates.filter((t) => {
    if (modalFiltroEscopo === "todos") return true;
    if (modalFiltroEscopo === "geral") return !t.colaborador_id;
    return t.colaborador_id === modalFiltroEscopo;
  });

  return (
    <div
      className="p-6 rounded-[28px] space-y-5 shadow-sm"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header com Progresso e Seletor de Torres (para Admin) */}
      <div className="space-y-3">
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
              {colaboradorAtivoId === currentUser.id
                ? "Rituais diários obrigatórios, rotinas da empresa e tarefas do dia"
                : `Checklist diário de ${torreNomeMap.get(colaboradorAtivoId) || "Torre"}`}
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
              title="Gerenciar itens fixos e rituais por torre"
            >
              <Settings className="w-3.5 h-3.5 text-[#5B50E5]" />
              <span>Itens Fixos (Admin)</span>
            </button>
          )}
        </div>

        {/* Seletor de visualização de Torres para o Gestor/Admin */}
        {isAdminView && torresDisponiveis.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 overflow-x-auto">
            <span className="text-[10px] font-extrabold uppercase px-2 text-zinc-400 shrink-0">
              Ver Checklist:
            </span>
            {torresDisponiveis.map((t) => {
              const isSelected = colaboradorAtivoId === t.id;
              const countRitual = templates.filter((tpl) => tpl.colaborador_id === t.id).length;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setColaboradorAtivoId(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#5B50E5] text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/20"
                  }`}
                >
                  <span>🎯 {t.apelido}</span>
                  {countRitual > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-extrabold ${isSelected ? "bg-white/20 text-white" : "bg-zinc-700 text-zinc-300"}`}>
                      {countRitual}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setColaboradorAtivoId(currentUser.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                colaboradorAtivoId === currentUser.id
                  ? "bg-[#5B50E5] text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/20"
              }`}
            >
              <span>👤 Meu Checklist</span>
            </button>
          </div>
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
            const tpl = item.template_id ? templateMap.get(item.template_id) : undefined;
            const isAvulso = !item.template_id;
            const isRitualTorre = !!tpl?.colaborador_id;
            const isFixoGeral = !!item.template_id && !tpl?.colaborador_id;

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
                  {isRitualTorre && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                      🎯 Ritual Torre
                    </span>
                  )}
                  {isFixoGeral && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-[#5B50E5]/15 text-[#5B50E5] border border-[#5B50E5]/20">
                      🏢 Fixo Empresa
                    </span>
                  )}
                  {isAvulso && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-zinc-500/15 text-zinc-400 border border-zinc-500/20">
                      ✏️ Avulso
                    </span>
                  )}

                  {isAvulso && (
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

      {/* Modal Admin: Gerenciar Itens Fixos e Rituais */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 relative max-h-[90vh] flex flex-col"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#5B50E5]" />
                <div>
                  <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                    Rituais & Itens Fixos Diários
                  </h3>
                  <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                    Configure tarefas geradas todo dia para a equipe inteira ou rituais de uma Torre específica
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-500/15 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form de Criação de Template */}
            <form
              onSubmit={handleAdicionarTemplate}
              className="p-3.5 rounded-2xl border space-y-2.5 shrink-0"
              style={{
                backgroundColor: "var(--surface-alt)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={novoTemplateColaboradorId}
                  onChange={(e) => setNovoTemplateColaboradorId(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer sm:w-60"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">🏢 Geral (Todas as Torres)</option>
                  {torresDisponiveis.map((t) => (
                    <option key={t.id} value={t.id}>
                      🎯 Ritual: {t.apelido}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Descrição da rotina/tarefa diária..."
                  value={novoTemplateTexto}
                  onChange={(e) => setNovoTemplateTexto(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold border outline-none"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />

                <button
                  type="submit"
                  disabled={savingTemplate || !novoTemplateTexto.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#5B50E5] hover:bg-[#483EA8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar</span>
                </button>
              </div>
            </form>

            {/* Filtros por Escopo */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
              <button
                type="button"
                onClick={() => setModalFiltroEscopo("todos")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  modalFiltroEscopo === "todos"
                    ? "bg-[#5B50E5] text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                style={{
                  backgroundColor: modalFiltroEscopo === "todos" ? undefined : "var(--surface-alt)",
                  border: "1px solid var(--border)",
                }}
              >
                Todos ({templates.length})
              </button>

              <button
                type="button"
                onClick={() => setModalFiltroEscopo("geral")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  modalFiltroEscopo === "geral"
                    ? "bg-[#5B50E5] text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                style={{
                  backgroundColor: modalFiltroEscopo === "geral" ? undefined : "var(--surface-alt)",
                  border: "1px solid var(--border)",
                }}
              >
                🏢 Geral ({templates.filter((t) => !t.colaborador_id).length})
              </button>

              {torresDisponiveis.map((t) => {
                const count = templates.filter((tpl) => tpl.colaborador_id === t.id).length;
                const isSelected = modalFiltroEscopo === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setModalFiltroEscopo(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                    style={{
                      backgroundColor: isSelected ? undefined : "var(--surface-alt)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    🎯 {t.apelido} ({count})
                  </button>
                );
              })}
            </div>

            {/* Lista de Templates Cadastrados */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {templatesFiltrados.length === 0 ? (
                <div className="p-8 text-center text-xs font-medium text-zinc-400">
                  Nenhum item fixo cadastrado para este filtro.
                </div>
              ) : (
                templatesFiltrados.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3 rounded-xl flex items-center justify-between gap-3 border group hover:border-[#5B50E5]/40 transition-colors"
                    style={{
                      backgroundColor: "var(--surface-alt)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {tpl.ordem !== undefined && (
                        <span className="text-[10px] font-mono font-bold text-zinc-400 shrink-0 w-6">
                          #{tpl.ordem}
                        </span>
                      )}
                      <span className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                        {tpl.item}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {tpl.colaborador_id ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                          🎯 {torreNomeMap.get(tpl.colaborador_id) || "Torre"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-[#5B50E5]/15 text-[#5B50E5] border border-[#5B50E5]/20">
                          🏢 Geral
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Excluir item fixo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t shrink-0" style={{ borderColor: "var(--border)" }}>
              <span className="text-[11px] text-zinc-400 font-medium">
                Total: {templates.length} templates ativos
              </span>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="px-4 py-2 rounded-xl bg-[#5B50E5] hover:bg-[#483EA8] text-white text-xs font-bold cursor-pointer transition-colors"
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

