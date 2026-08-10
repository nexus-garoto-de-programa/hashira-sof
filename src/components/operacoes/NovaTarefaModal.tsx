"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Sparkles } from "lucide-react";
import { OperacoesTarefa, SETORES_OPERACOES, TEAM_MEMBERS, ColumnStatus } from "@/lib/operacoesData";
import { toast } from "sonner";

interface NovaTarefaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (tarefa: OperacoesTarefa) => void;
}

export const NovaTarefaModal: React.FC<NovaTarefaModalProps> = ({ open, onClose, onSave }) => {
  if (!open) return null;

  const [titulo, setTitulo] = useState("");
  const [setorId, setSetorId] = useState(SETORES_OPERACOES[1].id); // Design
  const [status, setStatus] = useState<ColumnStatus>("nao_iniciado");
  const [membroId, setMembroId] = useState(TEAM_MEMBERS[0].id);
  const [prazo, setPrazo] = useState(() => new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("Informe o título da tarefa");
      return;
    }

    const setorObj = SETORES_OPERACOES.find((s) => s.id === setorId) || SETORES_OPERACOES[1];
    const membroObj = TEAM_MEMBERS.find((m) => m.id === membroId) || TEAM_MEMBERS[0];

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          className="relative w-full max-w-lg rounded-[28px] p-6 shadow-2xl z-10 space-y-5"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#5B50E5] text-white">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-primary)' }}>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-primary)' }}>
                  Setor
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
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-primary)' }}>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-primary)' }}>
                  Membro Designado
                </label>
                <select
                  value={membroId}
                  onChange={(e) => setMembroId(e.target.value)}
                  className="coursue-input text-xs cursor-pointer"
                >
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.initials} - {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-primary)' }}>
                  Data de Entrega
                </label>
                <input
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="coursue-input text-xs cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="coursue-btn-secondary text-xs py-2 px-5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="coursue-btn-primary text-xs py-2.5 px-6 shadow-md shadow-[#5B50E5]/20 flex items-center gap-2"
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
