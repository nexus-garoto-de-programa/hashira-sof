"use client";

import React, { useState, useEffect } from "react";
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
  getStoredOperacoesSetores,
  getStoredOperacoesTarefas,
  saveStoredOperacoesSetores,
  saveStoredOperacoesTarefas,
  fetchOperacoesSetoresFromSupabase,
  fetchOperacoesTarefasFromSupabase,
  saveOperacoesSetorToSupabase,
  saveOperacoesTarefaToSupabase,
  deleteOperacoesTarefaFromSupabase,
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

type ActiveTab = "setores" | "tarefas" | "projetos" | "performance" | "calendario";

export default function CentralOperacoesPage() {
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("setores");
  const [setores, setSetores] = useState<OperacoesSetor[]>([]);
  const [tarefas, setTarefas] = useState<OperacoesTarefa[]>([]);
  const [showNovaModal, setShowNovaModal] = useState(false);
  const [teamUsers, setTeamUsers] = useState<UserAccount[]>([]);

  useEffect(() => {
    const user = getActiveUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setActiveUser(user);

    // Fetch remoto completo — usado apenas no mount e em eventos do Realtime do Supabase.
    // NÃO deve ser chamado por eventos locais de localStorage, pois o Supabase pode ainda
    // não ter confirmado o INSERT, causando race condition e sumiço de tarefas.
    const reloadRemote = async () => {
      const [remoteUsers, remoteSetores, remoteTarefas] = await Promise.all([
        fetchUsersFromSupabase(),
        fetchOperacoesSetoresFromSupabase(),
        fetchOperacoesTarefasFromSupabase(),
      ]);
      setTeamUsers(remoteUsers);
      setSetores(remoteSetores);
      setTarefas(remoteTarefas);
    };

    // Sync local — lê apenas do localStorage (já atualizado pelo optimistic update).
    // Usado para eventos disparados pelo próprio browser sem precisar ir ao Supabase.
    const syncFromLocalStorage = () => {
      setTarefas(getStoredOperacoesTarefas());
      setSetores(getStoredOperacoesSetores());
    };

    reloadRemote();

    // Realtime do Supabase: evento vem do servidor, então podemos buscar dados frescos
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

    // Eventos locais: sincroniza do localStorage sem ir ao Supabase
    window.addEventListener("hashira_operacoes_tarefas_updated", syncFromLocalStorage);
    window.addEventListener("hashira_operacoes_setores_updated", syncFromLocalStorage);

    return () => {
      supabase.removeChannel(channelSetores);
      supabase.removeChannel(channelTarefas);
      window.removeEventListener("hashira_operacoes_tarefas_updated", syncFromLocalStorage);
      window.removeEventListener("hashira_operacoes_setores_updated", syncFromLocalStorage);
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

  const updateTarefas = async (novas: OperacoesTarefa[]) => {
    setTarefas(novas);
    saveStoredOperacoesTarefas(novas);
  };

  const handleSaveNovaTarefa = async (nova: OperacoesTarefa) => {
    // 1. Navega para a aba antes de salvar — o kanban já mostra a tarefa via optimistic update
    setActiveTab("tarefas");
    // 2. Optimistic update: insere no estado local IMEDIATAMENTE
    setTarefas((prev) => [nova, ...prev.filter((t) => t.id !== nova.id)]);
    // 3. Persiste no Supabase + localStorage em background
    //    O evento disparado dentro desta função lerá do localStorage (syncFromLocalStorage),
    //    não fará novo fetch ao Supabase, mantendo a tarefa visível.
    await saveOperacoesTarefaToSupabase(nova);
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
                  {isAdmin ? "Modo ADMIN (Pode alterar capa)" : "Modo COLABORADOR (Apenas visualiza)"}
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
                    {isAdmin
                      ? "Como ADMIN, você possui permissão exclusiva para alterar as imagens de capa das seções enviando arquivos do seu computador."
                      : "Visão dos setores e entregas. As capas são configuradas exclusivamente pelos Administradores."}
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

              {isAdmin && (
                <button
                  onClick={() => setShowNovaModal(true)}
                  className="coursue-btn-primary bg-[#5B50E5] hover:bg-[#483EA8] text-white py-3 px-6 text-sm shadow-lg shadow-[#5B50E5]/30 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Nova tarefa
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Tabs Navigation Bar */}
        <div
          className="flex p-1.5 rounded-[20px] shadow-sm overflow-x-auto no-scrollbar"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`relative flex items-center justify-center gap-2.5 px-6 py-3 rounded-full text-xs font-extrabold transition-all flex-1 min-w-[130px] ${
                  isActive
                    ? "bg-[#5B50E5] text-white shadow-sm"
                    : ""
                }`}
                style={{
                  color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--surface-alt)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
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

            {activeTab === "tarefas" && <KanbanTarefasTab tarefas={tarefas} />}

            {activeTab === "projetos" && <ProjetosTab />}

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
        />
      </div>
    </div>
  );
}
