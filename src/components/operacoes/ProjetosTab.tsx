"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Plus, X, FolderKanban, CheckCircle2, User as UserIcon, Layers, Sparkles, AlertCircle } from "lucide-react";
import {
  OperacoesProjeto,
  OperacoesTarefa,
  OperacoesSetor,
  SETORES_OPERACOES,
  DEFAULT_KANBAN_COLUMNS,
  saveStoredOperacoesProjetos,
  recalculateProjectCounters,
} from "@/lib/operacoesData";
import { UserAccount } from "@/lib/authPermissions";
import { toast } from "sonner";

interface ProjetosTabProps {
  projetos: OperacoesProjeto[];
  tarefas: OperacoesTarefa[];
  setores?: OperacoesSetor[];
  teamUsers?: UserAccount[];
  currentUser?: UserAccount | null;
  isAdmin?: boolean;
  onUpdateProjetos: (novos: OperacoesProjeto[]) => void;
  onNavigateToTarefas?: (projetoId?: string) => void;
}

export const ProjetosTab: React.FC<ProjetosTabProps> = ({
  projetos: projetosProp,
  tarefas,
  setores = SETORES_OPERACOES,
  teamUsers = [],
  currentUser,
  isAdmin = false,
  onUpdateProjetos,
  onNavigateToTarefas,
}) => {
  const [showModalCriar, setShowModalCriar] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState("#8B5CF6");
  const [setorId, setSetorId] = useState(setores[0]?.id || "sec-funil");
  const [donoId, setDonoId] = useState(currentUser?.id || teamUsers[0]?.id || "");

  const coresDisponiveis = [
    { hex: "#8B5CF6", label: "Roxo Hashira" },
    { hex: "#3B82F6", label: "Azul Royal" },
    { hex: "#06B6D4", label: "Ciano Neon" },
    { hex: "#22C55E", label: "Verde Esmeralda" },
    { hex: "#EAB308", label: "Âmbar Dourado" },
    { hex: "#EC4899", label: "Rosa Vibrante" },
    { hex: "#F97316", label: "Laranja Energia" },
    { hex: "#6366F1", label: "Índigo Profundo" },
  ];

  // Recalcula as estatísticas dos projetos dinamicamente baseado nas tarefas atuais
  const projetosComEstatisticas = useMemo(() => {
    return recalculateProjectCounters(projetosProp, tarefas);
  }, [projetosProp, tarefas]);

  const handleCriarProjeto = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("Informe o nome do projeto");
      return;
    }

    const donoObj = teamUsers.find((u) => u.id === donoId) || currentUser;
    const donoNomeFinal = donoObj?.comoQuerSerChamado || donoObj?.nickname || donoObj?.nome || "Responsável Geral";
    const setorObj = setores.find((s) => s.id === setorId) || setores[0];

    const novoProjeto: OperacoesProjeto = {
      id: "proj-" + Date.now(),
      nome: nome.trim(),
      descricao: descricao.trim() || `Projeto gerenciado por ${donoNomeFinal}.`,
      cor,
      donoId: donoObj?.id || currentUser?.id,
      donoNome: donoNomeFinal,
      setorId: setorObj?.id,
      setorNome: setorObj?.nome,
      colunas: DEFAULT_KANBAN_COLUMNS, // Estrutura configurável
      totalTarefas: 0,
      concluidas: 0,
      tarefasTítulos: [],
      criadoEm: new Date().toISOString(),
    };

    const atualizados = [novoProjeto, ...projetosProp];
    onUpdateProjetos(atualizados);
    saveStoredOperacoesProjetos(atualizados);
    toast.success(`Projeto "${novoProjeto.nome}" criado com sucesso!`);

    // Reset form & close
    setNome("");
    setDescricao("");
    setShowModalCriar(false);
  };

  const handleRemoverProjeto = (id: string, nomeProj: string) => {
    if (id === "proj-geral") {
      toast.error("O projeto padrão 'Geral' não pode ser removido.");
      return;
    }
    const atualizados = projetosProp.filter((p) => p.id !== id);
    onUpdateProjetos(atualizados);
    saveStoredOperacoesProjetos(atualizados);
    toast.success(`Projeto "${nomeProj}" removido com sucesso.`);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner com CTA de Criação */}
      <div className="coursue-card p-6 sm:p-8 rounded-[24px] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-[#EBE8FF] text-[#5B50E5]">
            <FolderKanban className="w-3.5 h-3.5" /> Gestão de Projetos & Frentes
          </div>
          <h3 className="text-xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
            Projetos da Central de Operações
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Agrupe tarefas, campanhas e demandas em projetos dedicados com cores, donos e acompanhamento de progresso em tempo real.
          </p>
        </div>

        <div>
          <button
            onClick={() => setShowModalCriar(true)}
            className="coursue-btn-primary py-3 px-6 text-xs shadow-lg shadow-[#5B50E5]/25 flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Criar Novo Projeto
          </button>
        </div>
      </div>

      {/* Grid de Cards de Projetos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projetosComEstatisticas.map((proj) => {
          const pct = proj.totalTarefas > 0 ? Math.round((proj.concluidas / proj.totalTarefas) * 100) : 0;

          return (
            <motion.div
              key={proj.id}
              whileHover={{ y: -4 }}
              className="coursue-card p-6 rounded-[24px] space-y-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="p-3 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: proj.cor + "20", color: proj.cor }}
                    >
                      <Tag className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold font-['Plus_Jakarta_Sans'] truncate" style={{ color: "var(--text-primary)" }}>
                        {proj.nome}
                      </h4>
                      {proj.donoNome && (
                        <span className="text-[11px] font-semibold block truncate" style={{ color: "var(--text-secondary)" }}>
                          Dono: <strong style={{ color: "var(--text-primary)" }}>{proj.donoNome}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {proj.id !== "proj-geral" && (isAdmin || proj.donoId === currentUser?.id) && (
                    <button
                      onClick={() => handleRemoverProjeto(proj.id, proj.nome)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors text-gray-400"
                      title="Excluir projeto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Descrição */}
                {proj.descricao && (
                  <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {proj.descricao}
                  </p>
                )}

                {/* Barra de Progresso */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span style={{ color: "var(--text-secondary)" }}>
                      {proj.totalTarefas} {proj.totalTarefas === 1 ? "tarefa" : "tarefas"}
                    </span>
                    <span className="font-extrabold text-[#5B50E5]">{pct}% concluído</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: proj.cor,
                      }}
                    />
                  </div>
                </div>

                {/* Lista prévia das tarefas associadas */}
                <div className="space-y-1.5 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                    Demandas Vinculadas ({proj.tarefasTítulos.length})
                  </span>
                  {proj.tarefasTítulos.length === 0 ? (
                    <span className="text-[11px] italic block" style={{ color: "var(--text-muted)" }}>
                      Nenhuma tarefa vinculada a este projeto ainda.
                    </span>
                  ) : (
                    proj.tarefasTítulos.map((t, idx) => (
                      <div
                        key={idx}
                        className="text-xs flex items-center gap-2 font-medium"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: proj.cor }} />
                        <span className="truncate">{t}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Botão de Ver Tarefas no Kanban */}
              <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => onNavigateToTarefas && onNavigateToTarefas(proj.id)}
                  className="w-full text-xs font-bold py-2 rounded-xl border hover:border-[#5B50E5] hover:text-[#5B50E5] transition-colors flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: "var(--surface-alt)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                >
                  Ver no Kanban →
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal de Criação de Projeto */}
      <AnimatePresence>
        {showModalCriar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModalCriar(false)}
              className="fixed inset-0 backdrop-blur-md"
              style={{ backgroundColor: "var(--modal-overlay)" }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl rounded-[28px] p-6 sm:p-8 shadow-2xl z-10 space-y-6 my-6"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#5B50E5] text-white shadow-md shadow-[#5B50E5]/25">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                      Criar Novo Projeto
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Configure nome, responsável, cor e departamento
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModalCriar(false)}
                  className="p-2 rounded-full transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCriarProjeto} className="space-y-5">
                {/* Nome */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Nome do Projeto *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Lançamento Funil Discord Q3"
                    className="coursue-input text-xs"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Descrição / Objetivo
                  </label>
                  <textarea
                    rows={2}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o escopo e os principais entregáveis deste projeto..."
                    className="w-full rounded-2xl p-3.5 text-xs outline-none transition-all"
                    style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>

                {/* Grid: Setor e Dono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                      Departamento
                    </label>
                    <select
                      value={setorId}
                      onChange={(e) => setSetorId(e.target.value)}
                      className="coursue-input text-xs cursor-pointer"
                    >
                      {setores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                      Dono / Líder do Projeto
                    </label>
                    <select
                      value={donoId}
                      onChange={(e) => setDonoId(e.target.value)}
                      className="coursue-input text-xs cursor-pointer"
                    >
                      {teamUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.comoQuerSerChamado || u.nickname || u.nome} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Seletor de Cores */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--text-primary)" }}>
                    Cor do Projeto (Identidade Visual)
                  </label>
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}>
                    {coresDisponiveis.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setCor(c.hex)}
                        className={`h-7 w-7 rounded-full transition-transform flex items-center justify-center ${
                          cor === c.hex ? "scale-125 ring-2 ring-[#5B50E5] shadow-md" : "opacity-70 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      >
                        {cor === c.hex && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estrutura Padrão de Colunas (Informativo) */}
                <div className="p-3.5 rounded-2xl flex items-center gap-3 text-xs" style={{ backgroundColor: "var(--brand-light)", color: "#5B50E5" }}>
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>
                    Este projeto usará as colunas configuradas do Kanban: <strong>Não iniciado</strong>, <strong>Em andamento</strong>, <strong>Revisão</strong> e <strong>Concluído</strong>.
                  </span>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 flex justify-end gap-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <button
                    type="button"
                    onClick={() => setShowModalCriar(false)}
                    className="coursue-btn-secondary text-xs py-2.5 px-5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="coursue-btn-primary text-xs py-2.5 px-6 shadow-lg shadow-[#5B50E5]/25 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Criar Projeto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
