"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Sparkles,
  User as UserIcon,
  Tag,
  AlignLeft,
  Calendar,
  Layers,
  Flame,
  Search,
  Check,
  Clock,
  ChevronDown,
  Activity,
  CheckCircle2,
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
        try {
          const users = await fetchUsersFromSupabase();
          setUsersList(users);
          if (users.length > 0) {
            setSelectedUser((prev) => (prev && users.some((u) => u.id === prev.id) ? prev : users[0]));
          }
        } catch (e) {
          console.warn("[MODAL WARN] Falha ao carregar usuários:", e);
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

    const userDisplayName = selectedUser.comoQuerSerChamado || selectedUser.nickname || selectedUser.nome || "Membro";
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

  // Helper de cores de prioridade
  const prioridadeColors: Record<PrioridadeTarefa, { bg: string; text: string; dot: string; label: string }> = {
    baixa: { bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500", label: "Baixa" },
    media: { bg: "bg-indigo-500/10", text: "text-indigo-500", dot: "bg-[#5B50E5]", label: "Média" },
    alta: { bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500", label: "Alta" },
    urgente: { bg: "bg-rose-500/10", text: "text-rose-500", dot: "bg-rose-500", label: "Urgente 🔥" },
  };

  // Helper de cores de status
  const statusColors: Record<ColumnStatus, { dot: string; label: string }> = {
    nao_iniciado: { dot: "bg-gray-400", label: "Não iniciado" },
    em_andamento: { dot: "bg-[#5B50E5]", label: "Em andamento" },
    revisao: { dot: "bg-amber-400", label: "Revisão" },
    concluido: { dot: "bg-emerald-500", label: "Concluído" },
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop com Blur Profundo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 backdrop-blur-md bg-black/60 z-0"
        />

        {/* Dialog SaaS Premium (Linear/Height Style) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl lg:max-w-5xl rounded-[28px] p-6 sm:p-8 md:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.55)] z-10 space-y-6 my-6 border border-border/80 flex flex-col max-h-[90vh] overflow-hidden"
          style={{
            backgroundColor: "var(--surface)",
            backgroundImage: "linear-gradient(180deg, var(--surface) 0%, var(--surface-alt) 100%)",
          }}
        >
          {/* Subtle Top Border Glow */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#5B50E5]/50 to-transparent pointer-events-none" />

          {/* Header Superior com Hierarquia e Soft Badge */}
          <div className="flex items-center justify-between pb-5 border-b border-border/70">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-[#5B50E5]/15 text-[#5B50E5] border border-[#5B50E5]/25 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Nova Tarefa na Central de Operações
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  Preencha os detalhes operacionais, vincule ao projeto e atribua ao responsável
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full transition-all duration-150 hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-105"
              title="Fechar Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form com Layout Horizontal Dividido ao Meio */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* ── COLUNA ESQUERDA: PARÂMETROS & CONFIGURAÇÃO DA TAREFA ── */}
              <div className="space-y-4 lg:border-r lg:border-border/60 lg:pr-8">
                {/* Soft Pill Badge Seção 1 */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#5B50E5]/10 text-[#5B50E5] border border-[#5B50E5]/20">
                  <Activity className="w-3.5 h-3.5" />
                  1. Informações Principais
                </div>

                {/* Título da Tarefa */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider block text-muted-foreground">
                    Título da Tarefa *
                  </label>
                  <input
                    type="text"
                    required
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: OVERLAY BANNER PROMOÇÃO LANÇAMENTO"
                    className="w-full rounded-xl px-4 py-3 text-xs font-semibold transition-all duration-200 outline-none focus:ring-2 focus:ring-[#5B50E5]/25 focus:border-[#5B50E5]"
                    style={{
                      backgroundColor: "var(--surface-alt)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {/* Projeto Vinculado */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#5B50E5]" />
                      Projeto Vinculado *
                    </span>
                    {selectedProjetoObj && (
                      <span
                        className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: selectedProjetoObj.cor + "15",
                          borderColor: selectedProjetoObj.cor + "30",
                          color: selectedProjetoObj.cor,
                        }}
                      >
                        {selectedProjetoObj.nome}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <select
                      value={projetoId}
                      onChange={(e) => setProjetoId(e.target.value)}
                      className="w-full appearance-none rounded-xl px-4 py-2.5 pr-10 text-xs font-medium cursor-pointer transition-all duration-200 outline-none focus:ring-2 focus:ring-[#5B50E5]/25 focus:border-[#5B50E5]"
                      style={{
                        backgroundColor: "var(--surface-alt)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {projetosDisponiveis.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Setor / Departamento Hashira */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                    <Layers className="w-3.5 h-3.5 text-[#5B50E5]" />
                    Departamento Hashira
                  </label>
                  <div className="relative">
                    <select
                      value={setorId}
                      onChange={(e) => setSetorId(e.target.value)}
                      className="w-full appearance-none rounded-xl px-4 py-2.5 pr-10 text-xs font-medium cursor-pointer transition-all duration-200 outline-none focus:ring-2 focus:ring-[#5B50E5]/25 focus:border-[#5B50E5]"
                      style={{
                        backgroundColor: "var(--surface-alt)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {setoresDisponiveis.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Grid Duplo: Prioridade & Status com Indicadores Visuais */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                      <Flame className="w-3.5 h-3.5 text-[#5B50E5]" />
                      Prioridade
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                        <span className={`w-2 h-2 rounded-full ${prioridadeColors[prioridade].dot}`} />
                      </div>
                      <select
                        value={prioridade}
                        onChange={(e) => setPrioridade(e.target.value as PrioridadeTarefa)}
                        className="w-full appearance-none rounded-xl pl-8 pr-10 py-2.5 text-xs font-medium cursor-pointer transition-all duration-200 outline-none focus:ring-2 focus:ring-[#5B50E5]/25 focus:border-[#5B50E5]"
                        style={{
                          backgroundColor: "var(--surface-alt)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente 🔥</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5B50E5]" />
                      Status
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                        <span className={`w-2 h-2 rounded-full ${statusColors[status].dot}`} />
                      </div>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as ColumnStatus)}
                        className="w-full appearance-none rounded-xl pl-8 pr-10 py-2.5 text-xs font-medium cursor-pointer transition-all duration-200 outline-none focus:ring-2 focus:ring-[#5B50E5]/25 focus:border-[#5B50E5]"
                        style={{
                          backgroundColor: "var(--surface-alt)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value="nao_iniciado">Não iniciado</option>
                        <option value="em_andamento">Em andamento</option>
                        <option value="revisao">Revisão</option>
                        <option value="concluido">Concluído</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Prazo: Data + Horário com Ícones Integrados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 text-[#5B50E5]" />
                      Data de Entrega
                    </label>
                    <input
                      type="date"
                      value={prazo}
                      onChange={(e) => setPrazo(e.target.value)}
                      className="w-full rounded-xl px-3.5 py-2.5 text-xs font-medium cursor-pointer transition-all duration-200 outline-none focus:ring-2 focus:ring-[#5B50E5]/25 focus:border-[#5B50E5]"
                      style={{
                        backgroundColor: "var(--surface-alt)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-[#5B50E5]" />
                      Horário Limite
                    </label>
                    <input
                      type="time"
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                      className="w-full rounded-xl px-3.5 py-2.5 text-xs font-medium cursor-pointer transition-all duration-200 outline-none focus:ring-2 focus:ring-[#5B50E5]/25 focus:border-[#5B50E5]"
                      style={{
                        backgroundColor: "var(--surface-alt)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ── COLUNA DIREITA: ESCOPO & ATRIBUIÇÃO DE MEMBRO ── */}
              <div className="space-y-4">
                {/* Soft Pill Badge Seção 2 */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#5B50E5]/10 text-[#5B50E5] border border-[#5B50E5]/20">
                  <UserIcon className="w-3.5 h-3.5" />
                  2. Escopo & Responsável
                </div>

                {/* Descrição Detalhada */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                    <AlignLeft className="w-3.5 h-3.5 text-[#5B50E5]" />
                    Descrição / Instruções Técnicas
                  </label>
                  <textarea
                    rows={4}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Especifique os entregáveis, dimensões, referências visuais, links ou diretrizes operacionais desta tarefa..."
                    className="w-full rounded-xl p-3.5 text-xs outline-none transition-all duration-200 resize-none focus:ring-2 focus:ring-[#5B50E5]/25 focus:border-[#5B50E5]"
                    style={{
                      backgroundColor: "var(--surface-alt)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {/* Seleção Interativa de Membro Responsável (assigned_to) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                      <UserIcon className="w-3.5 h-3.5 text-[#5B50E5]" />
                      Atribuir Responsável (assigned_to) *
                    </label>
                    <span className="text-[11px] font-extrabold text-[#5B50E5] truncate max-w-[160px]">
                      {selectedUser
                        ? selectedUser.comoQuerSerChamado || selectedUser.nickname || selectedUser.nome
                        : "Nenhum selecionado"}
                    </span>
                  </div>

                  {/* Campo de Busca de Membro */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                      placeholder="Buscar membro por nome ou email..."
                      className="w-full rounded-xl pl-9 pr-4 py-2 text-xs transition-all duration-200 outline-none focus:ring-2 focus:ring-[#5B50E5]/25 focus:border-[#5B50E5]"
                      style={{
                        backgroundColor: "var(--surface-alt)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>

                  {/* Lista com Scroll de Membros da Equipe */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {filteredUsers.map((u) => {
                      const isSelected = selectedUser?.id === u.id;
                      const displayName = u.comoQuerSerChamado || u.nickname || u.nome || "Membro";
                      const userAvatar = u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.nome || "User")}`;

                      return (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className={`p-2.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? "border-[#5B50E5] bg-gradient-to-r from-[#5B50E5]/15 via-[#5B50E5]/8 to-transparent ring-1 ring-[#5B50E5]/40 shadow-xs"
                              : "border-border/60 hover:bg-black/5 dark:hover:bg-white/[0.04]"
                          }`}
                          style={{
                            backgroundColor: isSelected ? undefined : "var(--surface-alt)",
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={userAvatar}
                              alt={displayName}
                              className={`w-8 h-8 rounded-full object-cover shrink-0 aspect-square transition-all ${
                                isSelected ? "ring-2 ring-[#5B50E5]" : "ring-1 ring-white/10"
                              }`}
                            />
                            <div className="min-w-0">
                              <span
                                className="text-xs font-bold block truncate"
                                style={{ color: isSelected ? "#5B50E5" : "var(--text-primary)" }}
                              >
                                {displayName}
                              </span>
                              <span className="text-[10px] block truncate text-muted-foreground">
                                {u.email}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected ? "bg-[#5B50E5] border-[#5B50E5] text-white scale-110" : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        Nenhum membro encontrado com esse termo.
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* ── FOOTER DO MODAL (SaaS Linear Style) ── */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/70">
              <div className="text-xs flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Central de Operações Hashira Sensi</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 hover:bg-muted text-muted-foreground hover:text-foreground flex-1 sm:flex-initial"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="coursue-btn-primary text-xs py-2.5 px-7 shadow-lg shadow-[#5B50E5]/25 hover:shadow-[#5B50E5]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 flex-1 sm:flex-initial font-bold"
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
