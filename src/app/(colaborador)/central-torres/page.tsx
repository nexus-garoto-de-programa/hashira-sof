"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Calendar as CalendarIcon,
  CheckSquare,
  Volume2,
  ShieldCheck,
  Sparkles,
  Clock,
  ListTodo,
} from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { TorresHeaderPonto } from "@/components/torres/TorresHeaderPonto";
import { CalendarioTab } from "@/components/operacoes/CalendarioTab";
import { TorresTarefasDia } from "@/components/torres/TorresTarefasDia";
import { TorresChecklistTab } from "@/components/torres/TorresChecklistTab";
import { TorresDiscordStatus } from "@/components/torres/TorresDiscordStatus";
import { TorresAdminPainel } from "@/components/torres/TorresAdminPainel";
import {
  getActiveUser,
  getAdminSimulatedRole,
  UserAccount,
} from "@/lib/authPermissions";
import {
  OperacoesTarefa,
  fetchOperacoesTarefasFromSupabase,
} from "@/lib/operacoesData";
import { useRealtimeSubscription } from "@/lib/realtimeSync";

type TorresTab = "agenda" | "meu-dia" | "discord" | "admin-painel";

export default function CentralTorresPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<TorresTab>("meu-dia");
  const [tarefas, setTarefas] = useState<OperacoesTarefa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getActiveUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setCurrentUser(user);

    fetchOperacoesTarefasFromSupabase().then((data) => {
      setTarefas(data);
      setLoading(false);
    });
  }, [router]);

  useRealtimeSubscription({
    topics: ["all"],
    onUpdate: () => {
      fetchOperacoesTarefasFromSupabase().then((data) => setTarefas(data));
    },
  });

  if (!currentUser) return null;

  const isAdmin =
    currentUser.email === "mhvzbusiness@gmail.com" ||
    currentUser.papel === "administrador";
  const simulated = getAdminSimulatedRole();
  const isAdminView = isAdmin && simulated === "administrador";

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* App Sidebar */}
      <AppSidebar
        userName={currentUser.comoQuerSerChamado || currentUser.nome}
        userEmail={currentUser.email}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 space-y-8 overflow-y-auto">
        {/* Banner de Boas-Vindas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#5B50E5]/15 text-[#5B50E5] border border-[#5B50E5]/25">
                Módulo Operacional Integrado
              </span>
              {isAdminView && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/25">
                  👑 Visão Gestor
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Central dos Torres
            </h1>
            <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Rotina, expediente, tarefas do dia, agenda mensal e conexão Discord em tempo real.
            </p>
          </div>
        </div>

        {/* Ponto Eletrônico no Topo */}
        <TorresHeaderPonto currentUser={currentUser} />

        {/* Barra de Navegação entre Abas */}
        <div
          className="p-1.5 rounded-2xl flex items-center gap-1.5 border overflow-x-auto"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("meu-dia")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === "meu-dia"
                ? "bg-[#5B50E5] text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Meu Dia a Dia (Tarefas & Checklist)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("agenda")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === "agenda"
                ? "bg-[#5B50E5] text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Agenda Mensal Pessoal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("discord")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === "discord"
                ? "bg-[#5865F2] text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Status Discord (Voz)</span>
          </button>

          {isAdminView && (
            <button
              type="button"
              onClick={() => setActiveTab("admin-painel")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                activeTab === "admin-painel"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Painel Gestor (Auditoria de Pontos)</span>
            </button>
          )}
        </div>

        {/* Conteúdo da Aba Ativa */}
        <AnimatePresence mode="wait">
          {activeTab === "meu-dia" && (
            <motion.div
              key="meu-dia"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <TorresTarefasDia currentUser={currentUser} />
              <TorresChecklistTab currentUser={currentUser} />
            </motion.div>
          )}

          {activeTab === "agenda" && (
            <motion.div
              key="agenda"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <CalendarioTab tarefas={tarefas} initialColaboradorId={currentUser.id} />
            </motion.div>
          )}

          {activeTab === "discord" && (
            <motion.div
              key="discord"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <TorresDiscordStatus currentUser={currentUser} />
            </motion.div>
          )}

          {activeTab === "admin-painel" && isAdminView && (
            <motion.div
              key="admin-painel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <TorresAdminPainel currentUser={currentUser} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
