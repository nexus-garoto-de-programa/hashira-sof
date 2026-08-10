"use client";

import React, { useState, useEffect } from "react";
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
  saveStoredOperacoesSetores,
  getStoredOperacoesTarefas,
  saveStoredOperacoesTarefas,
} from "@/lib/operacoesData";

import { AppSidebar } from "@/components/AppSidebar";
import { SetoresTab } from "@/components/operacoes/SetoresTab";
import { KanbanTarefasTab } from "@/components/operacoes/KanbanTarefasTab";
import { ProjetosTab } from "@/components/operacoes/ProjetosTab";
import { PerformanceTab } from "@/components/operacoes/PerformanceTab";
import { CalendarioTab } from "@/components/operacoes/CalendarioTab";
import { NovaTarefaModal } from "@/components/operacoes/NovaTarefaModal";

import { getActiveUser, USERS_SEED, UserAccount } from "@/lib/authPermissions";

type ActiveTab = "setores" | "tarefas" | "projetos" | "performance" | "calendario";

export default function CentralOperacoesPage() {
  const [activeUser, setActiveUser] = useState<UserAccount>(() => USERS_SEED[0]);

  useEffect(() => {
    setActiveUser(getActiveUser());
  }, []);

  const isAdmin = activeUser.email === "mhvzbusiness@gmail.com" || activeUser.papel === "administrador";

  const [activeTab, setActiveTab] = useState<ActiveTab>("setores");
  const [setores, setSetores] = useState<OperacoesSetor[]>(getStoredOperacoesSetores);
  const [tarefas, setTarefas] = useState<OperacoesTarefa[]>(getStoredOperacoesTarefas);
  const [showNovaModal, setShowNovaModal] = useState(false);

  const updateSetoresState = (novos: OperacoesSetor[]) => {
    setSetores(novos);
    saveStoredOperacoesSetores(novos);
  };

  const handleUpdateCoverImage = (setorId: string, dataUrl: string) => {
    const atualizados = setores.map((s) => (s.id === setorId ? { ...s, capaUrl: dataUrl } : s));
    updateSetoresState(atualizados);
  };

  const updateTarefas = (novas: OperacoesTarefa[]) => {
    setTarefas(novas);
    saveStoredOperacoesTarefas(novas);
  };

  const handleSaveNovaTarefa = (nova: OperacoesTarefa) => {
    updateTarefas([nova, ...tarefas]);
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
                  {TEAM_MEMBERS.map((m) => (
                    <div
                      key={m.id}
                      className="inline-block h-9 w-9 rounded-full flex items-center justify-center text-xs font-extrabold text-white ring-2 ring-[#1E1B4B]"
                      style={{ backgroundColor: m.avatarBg }}
                      title={m.name}
                    >
                      {m.initials}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-bold text-white/80">+ 0 membros</span>
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
        />
      </div>
    </div>
  );
}
