"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Sparkles, CheckCircle2, User as UserIcon } from "lucide-react";
import { OperacoesTarefa, SETORES_OPERACOES, ColumnStatus, TeamMember } from "@/lib/operacoesData";
import { getStoredUsers, UserAccount } from "@/lib/authPermissions";
import { toast } from "sonner";

interface NovaTarefaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (tarefa: OperacoesTarefa) => void;
}

export const NovaTarefaModal: React.FC<NovaTarefaModalProps> = ({ open, onClose, onSave }) => {
  const [titulo, setTitulo] = useState("");
  const [setorId, setSetorId] = useState(SETORES_OPERACOES[0].id); // Estrutura de Funil
  const [status, setStatus] = useState<ColumnStatus>("nao_iniciado");
  
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  
  const [prazo, setPrazo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (open) {
      const users = getStoredUsers();
      setUsersList(users);
      if (users.length > 0) {
        setSelectedUser((prev) => (prev && users.some(u => u.id === prev.id) ? prev : users[0]));
      }
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
      toast.error("Selecione um membro para designar a tarefa");
      return;
    }

    const setorObj = SETORES_OPERACOES.find((s) => s.id === setorId) || SETORES_OPERACOES[0];
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
    };

    const nova: OperacoesTarefa = {
      id: "t-" + Date.now(),
      titulo: titulo.trim().toUpperCase(),
      setorId: setorObj.id,
      setorNome: setorObj.nome,
      status,
      atrasoDias: 0,
      membro: membroObj,
      dataEntrega: prazo,
    };

    onSave(nova);
    toast.success("Nova tarefa criada com sucesso!");
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
          style={{ backgroundColor: 'var(--modal-overlay)' }}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl rounded-[28px] p-6 sm:p-8 shadow-2xl z-10 space-y-5 my-6"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#5B50E5] text-white shadow-md shadow-[#5B50E5]/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                  Criar Nova Tarefa
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Adicione à Central de Operações Hashira Sensi</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ color: 'var(--text-secondary)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-primary)' }}>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Setor ({SETORES_OPERACOES.length} Disponíveis) *
                </label>
                <select
                  value={setorId}
                  onChange={(e) => setSetorId(e.target.value)}
                  className="coursue-input text-xs cursor-pointer"
                >
                  {SETORES_OPERACOES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Coluna / Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ColumnStatus)}
                  className="coursue-input text-xs cursor-pointer"
                >
                  <option value="nao_iniciado">Não iniciado</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="revisao">Revisão</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>
            </div>

            {/* SELETOR INTERATIVO DE COLABORADOR POR CLIQUE */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider block flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                <span className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#5B50E5]" />
                  Clique para Selecionar o Membro Responsável *
                </span>
                <span className="text-[11px] font-extrabold text-[#5B50E5]">
                  {usersList.length} cadastrado(s)
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                {usersList.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  const displayName = u.comoQuerSerChamado || u.nickname || u.nome;
                  const sectorsText = u.setoresNomes?.join(", ") || u.setorNome;

                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 group"
                      style={{
                        backgroundColor: isSelected ? 'var(--brand-light)' : 'var(--surface-alt)',
                        borderColor: isSelected ? '#5B50E5' : 'var(--border)',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={u.avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover shrink-0" style={{ border: '1.5px solid var(--border)' }} />
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold block truncate" style={{ color: isSelected ? '#5B50E5' : 'var(--text-primary)' }}>
                            {displayName}
                          </span>
                          <span className="text-[10px] block truncate" style={{ color: 'var(--text-secondary)' }}>
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

            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Data de Entrega
              </label>
              <input
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className="coursue-input text-xs cursor-pointer"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2" style={{ borderTop: '1px solid var(--border)' }}>
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
