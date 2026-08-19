"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  CheckSquare,
  FolderKanban,
  BarChart2,
  Calendar as CalendarIcon,
  Plus,
  Sparkles,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  TEAM_MEMBERS,
  OperacoesSetor,
  OperacoesTarefa,
  OperacoesProjeto,
  ColumnStatus,
  getStoredOperacoesSetores,
  getStoredOperacoesTarefas,
  getStoredOperacoesProjetos,
  saveStoredOperacoesSetores,
  saveStoredOperacoesTarefas,
  saveStoredOperacoesProjetos,
  fetchOperacoesSetoresFromSupabase,
  fetchOperacoesTarefasFromSupabase,
  saveOperacoesSetorToSupabase,
  saveOperacoesTarefaToSupabase,
  updateTarefaStatusEOrdem,
  deleteOperacoesTarefaFromSupabase,
  recalculateProjectCounters,
} from "@/lib/operacoesData";

import { AppSidebar } from "@/components/AppSidebar";
import { SetoresTab } from "@/components/operacoes/SetoresTab";
import { KanbanTarefasTab } from "@/components/operacoes/KanbanTarefasTab";
import { ProjetosTab } from "@/components/operacoes/ProjetosTab";
import { PerformanceTab } from "@/components/operacoes/PerformanceTab";
import { CalendarioTab } from "@/components/operacoes/CalendarioTab";
import { NovaTarefaModal } from "@/components/operacoes/NovaTarefaModal";

import { getActiveUser, fetchUsersFromSupabase, UserAccount } from "@/lib/authPermissions";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type ActiveTab = "setores" | "tarefas" | "projetos" | "performance" | "calendario";

export default function CentralOperacoesPage() {
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("setores");
  const [setores, setSetores] = useState<OperacoesSetor[]>([]);
  const [tarefas, setTarefas] = useState<OperacoesTarefa[]>([]);
  const [projetos, setProjetos] = useState<OperacoesProjeto[]>([]);
  const [showNovaModal, setShowNovaModal] = useState(false);
  const [teamUsers, setTeamUsers] = useState<UserAccount[]>([]);

  // Referência para rollback seguro do estado em caso de erro no drag and drop
  const tarefasRef = useRef<OperacoesTarefa[]>([]);
  tarefasRef.current = tarefas;

  useEffect(() => {
    const user = getActiveUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setActiveUser(user);

    // Fetch remoto completo — usado no mount, no retorno de foco e nos canais Realtime do Supabase
    const reloadRemote = async () => {
      const [remoteUsers, remoteSetores, remoteTarefas] = await Promise.all([
        fetchUsersFromSupabase(),
        fetchOperacoesSetoresFromSupabase(),
        fetchOperacoesTarefasFromSupabase(),
      ]);
      setTeamUsers(remoteUsers);
      setSetores(remoteSetores);
      setTarefas(remoteTarefas);
      setProjetos(getStoredOperacoesProjetos());
    };

    // Sync local rápido
    const syncFromLocalStorage = () => {
      setTarefas(getStoredOperacoesTarefas());
      setSetores(getStoredOperacoesSetores());
      setProjetos(getStoredOperacoesProjetos());
    };

    reloadRemote();

    // Sincronização multiusuário: Realtime do Supabase
    const channelSetores = supabase
      .channel("operacoes-setores-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "operacoes_setores" }, () => {
        reloadRemote();
      })
      .subscribe();

    const channelTarefas = supabase
      .channel("operacoes-tarefas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "operacoes_tarefas" }, () => {
        reloadRemote();
      })
      .subscribe();

    // Eventos locais disparados na mesma aba
    window.addEventListener("hashira_operacoes_tarefas_updated", syncFromLocalStorage);
    window.addEventListener("hashira_operacoes_setores_updated", syncFromLocalStorage);
    window.addEventListener("hashira_operacoes_projetos_updated", syncFromLocalStorage);

    // Refetch ao focar na janela (re-sincroniza caso outro usuário tenha alterado)
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        reloadRemote();
      }
    };
    window.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("focus", handleFocus);

    return () => {
      supabase.removeChannel(channelSetores);
      supabase.removeChannel(channelTarefas);
      window.removeEventListener("hashira_operacoes_tarefas_updated", syncFromLocalStorage);
      window.removeEventListener("hashira_operacoes_setores_updated", syncFromLocalStorage);
      window.removeEventListener("hashira_operacoes_projetos_updated", syncFromLocalStorage);
      window.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  if (!activeUser) return null;

  const isAdmin = activeUser.email === "mhvzbusiness@gmail.com" || activeUser.papel === "administrador";

  const handleUpdateCoverImage = async (setorId: string, dataUrl: string) => {
    const setorTarget = setores.find((s) => s.id === setorId);
    if (setorTarget) {
      const atualizado = { ...setorTarget, capaUrl: dataUrl };
      await saveOperacoesSetorToSupabase(atualizado);
    }
  };

  const handleSaveNovaTarefa = async (nova: OperacoesTarefa) => {
    // 1. Navega para a aba de tarefas para exibir o resultado imediatamente
    setActiveTab("tarefas");
    // 2. Optimistic update
    const novasTarefas = [nova, ...tarefas.filter((t) => t.id !== nova.id)];
    setTarefas(novasTarefas);
    saveStoredOperacoesTarefas(novasTarefas);
    // 3. Salva no Supabase
    await saveOperacoesTarefaToSupabase(nova);
  };

  // Drag and Drop Handler com Atualização Otimista e Rollback em caso de erro
  const handleMoveTarefa = async (
    tarefaId: string,
    novoStatus: ColumnStatus,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    const previousSnapshot = [...tarefas];

    // Encontra a tarefa
    const targetTarefa = previousSnapshot.find((t) => t.id === tarefaId);
    if (!targetTarefa) return;

    // Atualiza otimisticamente a ordem e o status de todos os itens afetados
    const tarefasAtualizadas = previousSnapshot.map((t) => {
      if (t.id === tarefaId) {
        return {
          ...t,
          status: novoStatus,
          ordem: destinationIndex,
        };
      }
      return t;
    });

    // Aplica na UI instantaneamente
    setTarefas(tarefasAtualizadas);
    saveStoredOperacoesTarefas(tarefasAtualizadas);

    // Persiste no Supabase
    const success = await updateTarefaStatusEOrdem(tarefaId, novoStatus, destinationIndex);

    if (!success) {
      // Rollback imediato se o backend rejeitar
      setTarefas(previousSnapshot);
      saveStoredOperacoesTarefas(previousSnapshot);
      toast.error("Falha ao atualizar a tarefa no servidor. Posição restaurada.");
    }
  };

  const tabs = [
    { id: "setores", label: "Setores", icon: LayoutGrid },
    { id: "tarefas", label: "Tarefas", icon: CheckSquare },
    { id: "projetos", label: "Projetos", icon: FolderKanban },
    { id: "performance", label: "Performance", icon: BarChart2 },
    { id: "calendario", label: "Calendário", icon: CalendarIcon },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Fixa Coursue */}
      <AppSidebar />

      {/* Main Fluid Content */}
      <div className="flex-1 min-w-0 p-8 space-y-8">

        {/* Hero Banner Coursue */}
        <section
          className="coursue-banner relative p-8 md:p-10 shadow-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 100%)" }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold bg-white/10 text-[#C7C2F5]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Central de Operações — Centro de Comando Hashira Sensi
                </div>

                {/* Role Status Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                    isAdmin
                      ? "bg-amber-400 text-[#1E1B4B] shadow-sm"
                      : "bg-white/20 text-white"
                  }`}
                >
                  {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  {isAdmin ? "Modo ADMIN" : "Modo COLABORADOR"}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                <img
                  src="/hashira-logo-vertical.png"
                  alt="HASHIRA OFICIAL"
                  className="h-16 w-auto object-contain shrink-0 drop-shadow-md"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                    Central de Operações
                  </h1>
                  <p className="mt-1 text-sm text-white/80 max-w-xl">
                    Gestão de setores, projetos e fluxo de entregas Kanban em tempo real para toda a equipe.
                  </p>
                </div>
              </div>
            </div>

            {/* Member Avatars Stack + CTA Button */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                  {teamUsers.slice(0, 5).map((u) => {
                    const displayName = u.comoQuerSerChamado || u.nickname || u.nome;
                    return (
                      <img
                        key={u.id}
                        src={u.avatarUrl}
                        alt={displayName}
                        title={`${displayName} (${u.setorNome})`}
                        className="inline-block h-9 w-9 rounded-full object-cover ring-2 ring-[#1E1B4B]"
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-white/80">
                  {teamUsers.length > 5 ? `+ ${teamUsers.length - 5} membros` : `${teamUsers.length} membro(s)`}
                </span>
              </div>

              {/* Botão de Nova Tarefa disponível para todos com permissão */}
              <button
                onClick={() => setShowNovaModal(true)}
                className="coursue-btn-primary bg-[#5B50E5] hover:bg-[#483EA8] text-white py-3 px-6 text-sm shadow-lg shadow-[#5B50E5]/30 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nova tarefa
              </button>
            </div>
          </div>
        </section>

        {/* Tabs Navigation Bar */}
        <div
          className="flex p-1.5 rounded-[20px] shadow-sm overflow-x-auto no-scrollbar"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`relative flex items-center justify-center gap-2.5 px-6 py-3 rounded-full text-xs font-extrabold transition-all flex-1 min-w-[130px] ${
                  isActive ? "bg-[#5B50E5] text-white shadow-sm" : ""
                }`}
                style={{
                  color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "var(--surface-alt)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? "#FFFFFF" : "var(--text-secondary)" }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Tab Content Renderer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "setores" && (
              <SetoresTab
                setores={setores}
                tarefas={tarefas}
                isAdmin={isAdmin}
                onNavigateTab={(t) => setActiveTab(t as ActiveTab)}
                onUpdateCoverImage={handleUpdateCoverImage}
              />
            )}

            {activeTab === "tarefas" && (
              <KanbanTarefasTab
                tarefas={tarefas}
                projetos={projetos}
                onMoveTarefa={handleMoveTarefa}
              />
            )}

            {activeTab === "projetos" && (
              <ProjetosTab
                projetos={projetos}
                tarefas={tarefas}
                setores={setores}
                teamUsers={teamUsers}
                currentUser={activeUser}
                isAdmin={isAdmin}
                onUpdateProjetos={(novos) => {
                  setProjetos(novos);
                  saveStoredOperacoesProjetos(novos);
                }}
                onNavigateToTarefas={(projId) => {
                  setActiveTab("tarefas");
                }}
              />
            )}

            {activeTab === "performance" && <PerformanceTab />}

            {activeTab === "calendario" && <CalendarioTab tarefas={tarefas} />}
          </motion.div>
        </AnimatePresence>

        {/* Modal Nova Tarefa */}
        <NovaTarefaModal
          open={showNovaModal}
          onClose={() => setShowNovaModal(false)}
          onSave={handleSaveNovaTarefa}
          setores={setores}
          projetos={projetos}
        />
      </div>
    </div>
  );
}
