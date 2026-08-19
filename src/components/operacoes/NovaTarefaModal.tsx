"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Sparkles, CheckCircle2, User as UserIcon, Tag, AlignLeft, AlertCircle } from "lucide-react";
import {
  OperacoesTarefa,
  OperacoesSetor,
  OperacoesProjeto,
  SETORES_OPERACOES,
  PROJETOS_OPERACOES_SEED,
  ColumnStatus,
  PrioridadeTarefa,
  TeamMember,
} from "@/lib/operacoesData";
import { fetchUsersFromSupabase, UserAccount } from "@/lib/authPermissions";
import { toast } from "sonner";

interface NovaTarefaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (tarefa: OperacoesTarefa) => void;
  setores?: OperacoesSetor[];
  projetos?: OperacoesProjeto[];
}

export const NovaTarefaModal: React.FC<NovaTarefaModalProps> = ({
  open,
  onClose,
  onSave,
  setores: setoresProp,
  projetos: projetosProp = PROJETOS_OPERACOES_SEED,
}) => {
  const setoresDisponiveis = setoresProp && setoresProp.length > 0 ? setoresProp : SETORES_OPERACOES;
  const projetosDisponiveis = projetosProp && projetosProp.length > 0 ? projetosProp : PROJETOS_OPERACOES_SEED;

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [projetoId, setProjetoId] = useState(() => projetosDisponiveis[0]?.id || "proj-geral");
  const [setorId, setSetorId] = useState(() => setoresDisponiveis[0]?.id || SETORES_OPERACOES[0].id);
  const [status, setStatus] = useState<ColumnStatus>("nao_iniciado");
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>("media");

  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  const [prazo, setPrazo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (open) {
      const loadUsers = async () => {
        const users = await fetchUsersFromSupabase();
        setUsersList(users);
        if (users.length > 0) {
          setSelectedUser((prev) => (prev && users.some((u) => u.id === prev.id) ? prev : users[0]));
        }
      };
      loadUsers();
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("Informe o título da tarefa");
      return;
    }

    if (!selectedUser) {
      toast.error("Selecione um membro responsável cadastrado no sistema");
      return;
    }

    const setorObj = setoresDisponiveis.find((s) => s.id === setorId) || setoresDisponiveis[0] || SETORES_OPERACOES[0];
    const projetoObj = projetosDisponiveis.find((p) => p.id === projetoId) || projetosDisponiveis[0];

    const userDisplayName = selectedUser.comoQuerSerChamado || selectedUser.nickname || selectedUser.nome;
    const initials = userDisplayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const membroObj: TeamMember = {
      id: selectedUser.id,
      name: userDisplayName,
      initials: initials || "US",
      color: "#5B50E5",
      avatarBg: "#5B50E5",
      email: selectedUser.email,
    };

    const nova: OperacoesTarefa = {
      id: "t-" + Date.now(),
      titulo: titulo.trim().toUpperCase(),
      descricao: descricao.trim(),
      setorId: setorObj.id,
      setorNome: setorObj.nome,
      status,
      prioridade,
      ordem: 0,
      atrasoDias: 0,
      membro: membroObj,
      dataEntrega: prazo,
      projetoId: projetoObj?.id,
      projetoNome: projetoObj?.nome,
      criadoEm: new Date().toISOString(),
    };

    onSave(nova);
    toast.success(`Tarefa criada e vinculada ao projeto "${projetoObj?.nome || "Geral"}"!`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 backdrop-blur-md"
          style={{ backgroundColor: "var(--modal-overlay)" }}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl rounded-[28px] p-6 sm:p-8 shadow-2xl z-10 space-y-5 my-6"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#5B50E5] text-white shadow-md shadow-[#5B50E5]/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                  Criar Nova Tarefa / Demanda
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Defina projeto, responsável, prioridade e status no Kanban
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ color: "var(--text-secondary)" }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
            {/* Título */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                Título da Tarefa *
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: OVERLAY BANNER PROMOÇÃO"
                className="coursue-input text-xs"
              />
            </div>

            {/* Descrição Detalhada */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <AlignLeft className="w-3.5 h-3.5 text-[#5B50E5]" />
                Descrição / Instruções
              </label>
              <textarea
                rows={2}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Especificações técnicas, dimensões, formato ou instruções para a entrega..."
                className="w-full rounded-2xl p-3.5 text-xs outline-none transition-all"
                style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>

            {/* Projeto Vinculado & Prioridade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                  <Tag className="w-3.5 h-3.5 text-[#5B50E5]" />
                  Projeto Vinculado *
                </label>
                <select
                  value={projetoId}
                  onChange={(e) => setProjetoId(e.target.value)}
                  className="coursue-input text-xs cursor-pointer"
                >
                  {projetosDisponiveis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Prioridade
                </label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as PrioridadeTarefa)}
                  className="coursue-input text-xs cursor-pointer"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente 🔥</option>
                </select>
              </div>
            </div>

            {/* Setor & Coluna Inicial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Departamento Hashira
                </label>
                <select
                  value={setorId}
                  onChange={(e) => setSetorId(e.target.value)}
                  className="coursue-input text-xs cursor-pointer"
                >
                  {setoresDisponiveis.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Coluna / Status Inicial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ColumnStatus)}
                  className="coursue-input text-xs cursor-pointer"
                >
                  <option value="nao_iniciado">Não iniciado (1ª Coluna)</option>
                  <option value="em_andamento">Em andamento (2ª Coluna)</option>
                  <option value="revisao">Revisão (3ª Coluna)</option>
                  <option value="concluido">Concluído (4ª Coluna)</option>
                </select>
              </div>
            </div>

            {/* SELETOR INTERATIVO DE COLABORADOR POR CLIQUE */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider block flex items-center justify-between" style={{ color: "var(--text-primary)" }}>
                <span className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#5B50E5]" />
                  Clique para Selecionar o Membro Responsável (assigned_to) *
                </span>
                {selectedUser && (
                  <span className="text-[11px] font-extrabold text-[#5B50E5]">
                    {selectedUser.comoQuerSerChamado || selectedUser.nickname || selectedUser.nome}
                  </span>
                )}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {usersList.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  const displayName = u.comoQuerSerChamado || u.nickname || u.nome;

                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 group"
                      style={{
                        backgroundColor: isSelected ? "var(--brand-light)" : "var(--surface-alt)",
                        borderColor: isSelected ? "#5B50E5" : "var(--border)",
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={u.avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover shrink-0" style={{ border: "1.5px solid var(--border)" }} />
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold block truncate" style={{ color: isSelected ? "#5B50E5" : "var(--text-primary)" }}>
                            {displayName}
                          </span>
                          <span className="text-[10px] block truncate" style={{ color: "var(--text-secondary)" }}>
                            {u.email}
                          </span>
                        </div>
                      </div>

                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[#5B50E5] border-[#5B50E5] text-white" : "border-[#9CA3AF]"
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prazo */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                Data Limite de Entrega
              </label>
              <input
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className="coursue-input text-xs cursor-pointer"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 flex justify-end gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                type="button"
                onClick={onClose}
                className="coursue-btn-secondary text-xs py-2.5 px-5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="coursue-btn-primary text-xs py-2.5 px-6 shadow-lg shadow-[#5B50E5]/25 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Criar Tarefa
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
