"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, Plus, AlertCircle, Sparkles, Filter } from "lucide-react";
import {
  OperacoesTarefa,
  fetchOperacoesTarefasFromSupabase,
  saveOperacoesTarefaToSupabase,
  updateTarefaStatusEOrdem,
  PrioridadeTarefa,
} from "@/lib/operacoesData";
import { UserAccount } from "@/lib/authPermissions";
import { getTodayDateString } from "@/lib/torresData";
import { useRealtimeSubscription } from "@/lib/realtimeSync";
import { toast } from "sonner";

interface TorresTarefasDiaProps {
  currentUser: UserAccount;
}

const PRIORIDADE_COLORS: Record<PrioridadeTarefa, { bg: string; text: string; label: string }> = {
  baixa: { bg: "bg-blue-500/15 text-blue-500", text: "text-blue-500", label: "Baixa" },
  media: { bg: "bg-amber-500/15 text-amber-500", text: "text-amber-500", label: "Média" },
  alta: { bg: "bg-orange-500/15 text-orange-500", text: "text-orange-500", label: "Alta" },
  urgente: { bg: "bg-rose-500/15 text-rose-500", text: "text-rose-500", label: "Urgente" },
};

export const TorresTarefasDia: React.FC<TorresTarefasDiaProps> = ({ currentUser }) => {
  const [tarefas, setTarefas] = useState<OperacoesTarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Formulário rápido
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaPrioridade, setNovaPrioridade] = useState<PrioridadeTarefa>("media");
  const [novoHorario, setNovoHorario] = useState("18:00");
  const [submitting, setSubmitting] = useState(false);

  const carregarTarefas = async () => {
    try {
      const data = await fetchOperacoesTarefasFromSupabase();
      setTarefas(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTarefas();
  }, [currentUser.id]);

  useRealtimeSubscription({
    topics: ["tarefas"],
    onUpdate: () => carregarTarefas(),
  });

  const hoje = getTodayDateString();

  // Filtra tarefas onde prazo = hoje e responsável = colaborador atual
  const tarefasHoje = tarefas.filter((t) => {
    const isHoje = t.dataEntrega === hoje;
    const isMinha =
      t.membro?.id === currentUser.id ||
      t.membro?.email === currentUser.email;
    return isHoje && isMinha;
  });

  const handleToggleConcluida = async (tarefa: OperacoesTarefa) => {
    const novoStatus = tarefa.status === "concluido" ? "em_andamento" : "concluido";
    try {
      await updateTarefaStatusEOrdem(tarefa.id, novoStatus, tarefa.ordem || 0);
      setTarefas((prev) =>
        prev.map((t) => (t.id === tarefa.id ? { ...t, status: novoStatus } : t))
      );
      if (novoStatus === "concluido") {
        toast.success("Tarefa marcada como concluída! 🎉");
      }
    } catch (e) {
      toast.error("Erro ao atualizar status da tarefa.");
    }
  };

  const handleCriarTarefaRapida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return;

    setSubmitting(true);
    try {
      const nova: OperacoesTarefa = {
        id: `task-${Date.now()}`,
        titulo: novoTitulo.trim(),
        setorId: "torres",
        setorNome: "Torres & Operações",
        status: "nao_iniciado",
        prioridade: novaPrioridade,
        horarioEntrega: novoHorario,
        dataEntrega: hoje,
        membro: {
          id: currentUser.id,
          name: currentUser.comoQuerSerChamado || currentUser.nome,
          initials: (currentUser.nome || "CO").substring(0, 2).toUpperCase(),
          color: "#5B50E5",
          avatarBg: "#5B50E5",
          avatarUrl: currentUser.avatarUrl,
          email: currentUser.email,
        },
        criadoEm: new Date().toISOString(),
      };

      await saveOperacoesTarefaToSupabase(nova);
      setTarefas((prev) => [nova, ...prev]);
      setNovoTitulo("");
      setShowQuickAdd(false);
      toast.success("Tarefa rápida adicionada ao seu dia!");
    } catch (e) {
      toast.error("Erro ao salvar tarefa rápida.");
    } finally {
      setSubmitting(false);
    }
  };

  const concluidasCount = tarefasHoje.filter((t) => t.status === "concluido").length;

  return (
    <div
      className="p-6 rounded-[28px] space-y-5 shadow-sm"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
              Tarefas de Hoje
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#5B50E5]/15 text-[#5B50E5]">
              {concluidasCount}/{tarefasHoje.length} concluídas
            </span>
          </div>
          <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            Demandas operacionais com prazo para o dia corrente
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="px-3 py-1.5 rounded-xl bg-[#5B50E5] hover:bg-[#483EA8] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showQuickAdd ? "Fechar" : "Nova Tarefa"}</span>
        </button>
      </div>

      {/* Formulário Rápido de Criação */}
      {showQuickAdd && (
        <form
          onSubmit={handleCriarTarefaRapida}
          className="p-4 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2"
          style={{
            backgroundColor: "var(--surface-alt)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#5B50E5]" />
            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
              Criação Rápida de Tarefa de Hoje
            </span>
          </div>

          <input
            type="text"
            placeholder="O que você precisa entregar hoje?..."
            value={novoTitulo}
            onChange={(e) => setNovoTitulo(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors outline-none"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
                Prioridade:
              </span>
              <select
                value={novaPrioridade}
                onChange={(e) => setNovaPrioridade(e.target.value as PrioridadeTarefa)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente 🔥</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
                Horário:
              </span>
              <input
                type="time"
                value={novoHorario}
                onChange={(e) => setNovoHorario(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold border outline-none"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div className="ml-auto">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 rounded-xl bg-[#5B50E5] hover:bg-[#483EA8] text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Adicionando..." : "Adicionar"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Lista de Tarefas do Dia */}
      <div className="space-y-2">
        {tarefasHoje.length === 0 ? (
          <div
            className="p-8 rounded-2xl text-center space-y-2"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px dashed var(--border)",
            }}
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
            <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
              Nenhuma tarefa pendente com entrega para hoje!
            </h4>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Aproveite para adiantar tarefas da semana ou adicione uma nova tarefa rápida acima.
            </p>
          </div>
        ) : (
          tarefasHoje.map((tarefa) => {
            const isConcluida = tarefa.status === "concluido";
            const prio = PRIORIDADE_COLORS[tarefa.prioridade || "media"];

            return (
              <div
                key={tarefa.id}
                onClick={() => handleToggleConcluida(tarefa)}
                className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border transition-all cursor-pointer group hover:border-[#5B50E5]/40 ${
                  isConcluida ? "opacity-60 bg-emerald-500/5 border-emerald-500/20" : ""
                }`}
                style={{
                  backgroundColor: isConcluida ? undefined : "var(--surface-alt)",
                  borderColor: isConcluida ? undefined : "var(--border)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    className="shrink-0 p-1 text-[#5B50E5]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleConcluida(tarefa);
                    }}
                  >
                    {isConcluida ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-400 group-hover:text-[#5B50E5] transition-colors" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold truncate transition-all ${
                        isConcluida ? "line-through text-zinc-400" : ""
                      }`}
                      style={{ color: isConcluida ? undefined : "var(--text-primary)" }}
                    >
                      {tarefa.titulo}
                    </p>
                    {tarefa.horarioEntrega && (
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>Até às {tarefa.horarioEntrega}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${prio.bg}`}>
                    {prio.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                      isConcluida
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-blue-500/15 text-blue-500"
                    }`}
                  >
                    {isConcluida ? "Concluída" : "Pendente"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
