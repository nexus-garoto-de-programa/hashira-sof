"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Sparkles,
  CheckCircle2,
  User as UserIcon,
  Tag,
  AlignLeft,
  Calendar,
  Layers,
  Flame,
  Search,
  Check,
} from "lucide-react";
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
  const [searchMember, setSearchMember] = useState("");

  const [prazo, setPrazo] = useState(() => new Date().toISOString().split("T")[0]);
  const [horario, setHorario] = useState("18:00");

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

  // Filtro de busca de membros da equipe
  const filteredUsers = useMemo(() => {
    if (!searchMember.trim()) return usersList;
    const q = searchMember.toLowerCase().trim();
    return usersList.filter(
      (u) =>
        u.nome?.toLowerCase().includes(q) ||
        u.comoQuerSerChamado?.toLowerCase().includes(q) ||
        u.nickname?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.setorNome?.toLowerCase().includes(q)
    );
  }, [usersList, searchMember]);

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
      avatarUrl: selectedUser.avatarUrl,
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
      horarioEntrega: horario,
      projetoId: projetoObj?.id,
      projetoNome: projetoObj?.nome,
      criadoEm: new Date().toISOString(),
    };

    onSave(nova);
    toast.success(`Tarefa criada e vinculada ao projeto "${projetoObj?.nome || "Geral"}"!`);
    onClose();
  };

  const selectedProjetoObj = projetosDisponiveis.find((p) => p.id === projetoId);

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

        {/* Dialog Horizontal Amplo (2 Colunas) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-4xl lg:max-w-5xl rounded-[32px] p-6 sm:p-8 md:p-10 shadow-2xl z-10 space-y-6 my-6 border flex flex-col max-h-[90vh]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Header Superior */}
          <div className="flex items-center justify-between pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-[#5B50E5] text-white shadow-lg shadow-[#5B50E5]/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                  Nova Tarefa na Central de Operações
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Preencha os detalhes operacionais, vincule ao projeto e atribua ao responsável
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{ color: "var(--text-secondary)" }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form com Layout Horizontal Dividido ao Meio */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* ── COLUNA ESQUERDA: PARÂMETROS & CONFIGURAÇÃO DA TAREFA ── */}
              <div className="space-y-4 md:border-r border-border md:pr-8">
                <div className="flex items-center gap-2 pb-1">
                  <span className="h-2 w-2 rounded-full bg-[#5B50E5]" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B50E5]">
                    1. Informações Principais
                  </span>
                </div>

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
                    placeholder="Ex: OVERLAY BANNER PROMOÇÃO LANÇAMENTO"
                    className="coursue-input text-xs font-semibold py-3"
                  />
                </div>

                {/* Projeto Vinculado */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 flex items-center justify-between" style={{ color: "var(--text-primary)" }}>
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#5B50E5]" />
                      Projeto Vinculado *
                    </span>
                    {selectedProjetoObj && (
                      <span
                        className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: selectedProjetoObj.cor + "20",
                          color: selectedProjetoObj.cor,
                        }}
                      >
                        {selectedProjetoObj.nome}
                      </span>
                    )}
                  </label>
                  <select
                    value={projetoId}
                    onChange={(e) => setProjetoId(e.target.value)}
                    className="coursue-input text-xs cursor-pointer py-2.5"
                  >
                    {projetosDisponiveis.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Setor / Departamento Hashira */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                    <Layers className="w-3.5 h-3.5 text-[#5B50E5]" />
                    Departamento Hashira
                  </label>
                  <select
                    value={setorId}
                    onChange={(e) => setSetorId(e.target.value)}
                    className="coursue-input text-xs cursor-pointer py-2.5"
                  >
                    {setoresDisponiveis.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grid Duplo: Prioridade & Status */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                      <Flame className="w-3.5 h-3.5 text-[#5B50E5]" />
                      Prioridade
                    </label>
                    <select
                      value={prioridade}
                      onChange={(e) => setPrioridade(e.target.value as PrioridadeTarefa)}
                      className="coursue-input text-xs cursor-pointer py-2.5"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente 🔥</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-primary)" }}>
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ColumnStatus)}
                      className="coursue-input text-xs cursor-pointer py-2.5"
                    >
                      <option value="nao_iniciado">Não iniciado</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="revisao">Revisão</option>
                      <option value="concluido">Concluído</option>
                    </select>
                  </div>
                </div>

                {/* Prazo: Data + Horário */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                      <Calendar className="w-3.5 h-3.5 text-[#5B50E5]" />
                      Data de Entrega
                    </label>
                    <input
                      type="date"
                      value={prazo}
                      onChange={(e) => setPrazo(e.target.value)}
                      className="coursue-input text-xs cursor-pointer py-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                      <Calendar className="w-3.5 h-3.5 text-[#5B50E5]" />
                      Horário Limite
                    </label>
                    <input
                      type="time"
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                      className="coursue-input text-xs cursor-pointer py-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* ── COLUNA DIREITA: ESCOPO & ATRIBUIÇÃO DE MEMBRO ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1">
                  <span className="h-2 w-2 rounded-full bg-[#5B50E5]" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B50E5]">
                    2. Escopo & Responsável
                  </span>
                </div>

                {/* Descrição Detalhada */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                    <AlignLeft className="w-3.5 h-3.5 text-[#5B50E5]" />
                    Descrição / Instruções Técnicas
                  </label>
                  <textarea
                    rows={4}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Especifique os entregáveis, dimensões, referências visuais, links ou diretrizes operacionais desta tarefa..."
                    className="w-full rounded-2xl p-3.5 text-xs outline-none transition-all resize-none"
                    style={{
                      backgroundColor: "var(--surface-alt)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {/* Seleção Interativa de Membro Responsável (assigned_to) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                      <UserIcon className="w-3.5 h-3.5 text-[#5B50E5]" />
                      Atribuir Responsável (assigned_to) *
                    </label>
                    <span className="text-[11px] font-extrabold text-[#5B50E5]">
                      {selectedUser
                        ? selectedUser.comoQuerSerChamado || selectedUser.nickname || selectedUser.nome
                        : "Nenhum selecionado"}
                    </span>
                  </div>

                  {/* Campo de Busca de Membro */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                      placeholder="Buscar membro por nome ou email..."
                      className="coursue-input pl-9 text-xs py-2"
                    />
                  </div>

                  {/* Lista com Scroll de Membros da Equipe */}
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {filteredUsers.map((u) => {
                      const isSelected = selectedUser?.id === u.id;
                      const displayName = u.comoQuerSerChamado || u.nickname || u.nome;

                      return (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected ? "ring-2 ring-[#5B50E5]" : ""
                          }`}
                          style={{
                            backgroundColor: isSelected ? "var(--brand-light)" : "var(--surface-alt)",
                            borderColor: isSelected ? "#5B50E5" : "var(--border)",
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={u.avatarUrl}
                              alt={displayName}
                              className="w-9 h-9 rounded-full object-cover shrink-0"
                              style={{ border: "1.5px solid var(--border)" }}
                            />
                            <div className="min-w-0">
                              <span
                                className="text-xs font-extrabold block truncate"
                                style={{ color: isSelected ? "#5B50E5" : "var(--text-primary)" }}
                              >
                                {displayName}
                              </span>
                              <span className="text-[10px] block truncate" style={{ color: "var(--text-secondary)" }}>
                                {u.email}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? "bg-[#5B50E5] border-[#5B50E5] text-white" : "border-[#9CA3AF]"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <div className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                        Nenhum membro encontrado com esse termo.
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* ── FOOTER DO MODAL ── */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="text-xs flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Central de Operações Hashira Sensi</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="coursue-btn-secondary text-xs py-3 px-6 flex-1 sm:flex-initial"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="coursue-btn-primary text-xs py-3 px-8 shadow-xl shadow-[#5B50E5]/30 flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                >
                  <Plus className="w-4 h-4" /> Criar Demanda
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
