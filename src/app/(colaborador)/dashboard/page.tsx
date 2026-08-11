"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ArrowRight,
  Clock,
  Eye,
  Bell,
  Sparkles,
} from "lucide-react";
import {
  Demanda,
  StatusDemanda,
  getStoredDemandas,
  saveStoredDemandas,
  fetchDemandasFromSupabase,
  saveDemandaToSupabase,
} from "@/lib/demands";
import { getActiveUser, UserAccount, USERS_SEED } from "@/lib/authPermissions";
import { supabase } from "@/lib/supabase";
import { AppSidebar } from "@/components/AppSidebar";
import { DemandCard } from "@/components/DemandCard";
import { DemandDetailModal } from "@/components/DemandDetailModal";
import { PerformanceRing } from "@/components/PerformanceRing";
import { CreateDemandModal } from "@/components/CreateDemandModal";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type PeriodoFilter = "dia" | "semana" | "mes";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function CollaboratorDashboardPage() {
  const router = useRouter();
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [user, setUser] = useState<UserAccount | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [periodo, setPeriodo] = useState<PeriodoFilter>("semana");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [selectedDemanda, setSelectedDemanda] = useState<Demanda | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const active = getActiveUser();
    if (!active) {
      router.push("/login");
      return;
    }
    setUser(active);

    const reloadDemandas = async () => {
      const remote = await fetchDemandasFromSupabase();
      setDemandas(remote);
    };

    reloadDemandas();

    const channel = supabase
      .channel("colaborador-dashboard-demandas")
      .on("postgres_changes", { event: "*", schema: "public", table: "demandas" }, () => {
        reloadDemandas();
      })
      .subscribe();

    window.addEventListener("hashira_demandas_updated", reloadDemandas);
    window.addEventListener("storage", reloadDemandas);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("hashira_demandas_updated", reloadDemandas);
      window.removeEventListener("storage", reloadDemandas);
    };
  }, [router]);

  // Exibe APENAS demandas que foram explicitamente atribuídas a este colaborador (sem tarefas fantasma por setor)
  const userDemandas = useMemo(() => {
    if (!user) return [];

    const userCleanEmail = user.email ? user.email.toLowerCase().trim() : "";
    const userCleanName = user.nome ? user.nome.toLowerCase().trim() : "";

    return demandas.filter((d) => {
      const isIdMatch = Boolean(d.colaboradorId && d.colaboradorId === user.id);
      const isNameMatch = Boolean(
        d.colaboradorNome &&
        (d.colaboradorNome.toLowerCase().trim() === userCleanName ||
         d.colaboradorNome.toLowerCase().trim() === userCleanEmail)
      );
      return isIdMatch || isNameMatch;
    });
  }, [demandas, user]);

  const filteredDemandas = useMemo(() => {
    return userDemandas.filter((d) => {
      const matchSearch =
        d.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.setorNome.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === "todos" || d.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [userDemandas, searchQuery, statusFilter]);

  const proximasDemandas = useMemo(() => {
    return [...userDemandas]
      .filter((d) => d.status !== "concluida")
      .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime())
      .slice(0, 3);
  }, [userDemandas]);

  // Early return ONLY after all hooks are declared to strictly follow React Rules of Hooks
  if (!user) return null;

  const greeting = getGreeting();
  const userName = user.comoQuerSerChamado || user.nickname || user.nome || "Colaborador";
  const userSector = user.setorNome || "Estrutura de Funil";
  const userAvatar = user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

  const updateDemandasState = (novas: Demanda[]) => {
    setDemandas(novas);
    saveStoredDemandas(novas);
  };

  const demandasConcluidas = userDemandas.filter((d) => d.status === "concluida").length;
  const totalDemandas = userDemandas.length;
  const pctConclusaoGeral = totalDemandas > 0 ? Math.round((demandasConcluidas / totalDemandas) * 100) : 0;

  // Calculo real das conclusões por dia da semana (Seg a Sáb) baseado em userDemandas reais
  const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const chartData = diasSemana.map((diaLabel, idx) => {
    // Seg=1, Ter=2, Qua=3, Qui=4, Sex=5, Sab=6
    const targetDayIndex = idx + 1;
    const count = userDemandas.filter((d) => {
      if (d.status !== "concluida") return false;
      if (!d.criadoEm) return false;
      const date = new Date(d.criadoEm);
      const day = date.getDay(); // 0: Dom, 1: Seg, ... 6: Sáb
      return day === targetDayIndex;
    }).length;
    return { name: diaLabel, concluida: count };
  });

  const handleUpdateStatus = (demandaId: string, newStatus: StatusDemanda, comentario?: string) => {
    const atualizadas = demandas.map((d) => {
      if (d.id === demandaId) {
        const novoProgresso = newStatus === "concluida" ? 100 : newStatus === "em_andamento" ? 50 : 10;
        const novoHistorico = [...d.historico];
        if (comentario) {
          novoHistorico.push({
            id: "h-" + Date.now(),
            usuarioNome: userName,
            acao: `Status alterado para ${newStatus.replace("_", " ")}`,
            data: new Date().toISOString().slice(0, 16).replace("T", " "),
            comentario,
          });
        }
        return {
          ...d,
          status: newStatus,
          progresso: novoProgresso,
          historico: novoHistorico,
        };
      }
      return d;
    });

    updateDemandasState(atualizadas);
    if (selectedDemanda && selectedDemanda.id === demandaId) {
      setSelectedDemanda((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleCreateDemanda = (novaDemanda: Omit<Demanda, "id" | "criadoEm">) => {
    const id = "dem-" + Date.now();
    const objetoCompleto: Demanda = {
      ...novaDemanda,
      id,
      criadoEm: new Date().toISOString(),
    };
    updateDemandasState([objetoCompleto, ...demandas]);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Fixa Esquerda */}
      <AppSidebar userRole={user.papel} userName={userName} userEmail={user.email} />

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Superior */}
        <header
          className="sticky top-0 z-20 h-16 px-8 flex items-center justify-between backdrop-blur-md transition-colors"
          style={{
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="relative w-96">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar demandas por nome ou setor…"
              className="coursue-input pl-11 shadow-sm text-xs"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                className="p-2 rounded-full transition-colors relative"
                style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--text-secondary)' }}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#5B50E5] animate-ping" />
              </button>
            </div>
            <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
              <img
                src={userAvatar}
                alt={userName}
                className="h-9 w-9 rounded-full object-cover"
                style={{ border: '1px solid var(--border)' }}
              />
              <div className="hidden sm:block">
                <span className="text-xs font-bold block leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {userName}
                </span>
                <span className="text-[10px] font-semibold text-[#5B50E5] uppercase block">
                  {userSector}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Layout in 3 Columns */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          
          {/* Central Fluid Area */}
          <div className="space-y-8 min-w-0">

            {/* Hero Greeting Banner (Coursue Style) */}
            <section
              className="coursue-banner relative p-8 md:p-10 shadow-xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, #5B50E5 0%, #3730A3 100%)" }}
            >
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold mb-3 bg-white/15 text-white">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    Modelo Cascata — Painel do Colaborador
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                    {greeting},{" "}
                    <span className="text-[#C7C2F5]">{userName} 👋</span>
                  </h1>
                  <p className="mt-2 text-sm text-white/80 max-w-xl">
                    Você tem <strong className="text-white font-bold">{userDemandas.filter(d => d.status !== 'concluida').length} demandas pendentes</strong> neste período.
                  </p>
                </div>

                {/* Quick Summary Cards (Pill style) */}
                <div className="flex flex-wrap sm:flex-nowrap gap-3">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white min-w-[130px]">
                    <span className="text-[11px] font-semibold text-white/70 block uppercase">Hoje</span>
                    <span className="text-2xl font-extrabold font-['Plus_Jakarta_Sans']">
                      {userDemandas.filter(d => d.status === 'concluida').length}/{userDemandas.length}
                    </span>
                    <span className="text-[10px] text-emerald-300 block mt-1">Concluídas</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white min-w-[130px]">
                    <span className="text-[11px] font-semibold text-white/70 block uppercase">Esta Semana</span>
                    <span className="text-2xl font-extrabold font-['Plus_Jakarta_Sans']">
                      {userDemandas.filter(d => d.status === 'em_andamento').length}
                    </span>
                    <span className="text-[10px] text-[#C7C2F5] block mt-1">Em Andamento</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Horizontal Carousel: Minhas Demandas */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                    Minhas Demandas
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Arraste horizontalmente para navegar entre suas atribuições
                  </p>
                </div>
                <span className="text-xs font-bold text-[#5B50E5] px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--brand-light)' }}>
                  {filteredDemandas.length} demandas
                </span>
              </div>

              {/* Draggable Carousel */}
              <motion.div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth">
                <AnimatePresence>
                  {filteredDemandas.map((demanda) => (
                    <DemandCard
                      key={demanda.id}
                      demanda={demanda}
                      onOpenDetails={(d) => setSelectedDemanda(d)}
                      layoutMode="carousel"
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>

            {/* Detailed Table Section: Suas Demandas */}
            <section className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h2 className="text-xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                    Suas Demandas (Tabela Detalhada)
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Filtros por período (Dia, Semana, Mês) e status operacional
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Period Slider Filter */}
                  <div className="flex rounded-full p-1 shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    {(["dia", "semana", "mes"] as PeriodoFilter[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriodo(p)}
                        className={`px-3.5 py-1 text-xs font-bold capitalize transition-all rounded-full ${
                          periodo === p
                            ? "bg-[#5B50E5] text-white shadow-sm"
                            : "hover:opacity-80"
                        }`}
                        style={{
                          color: periodo === p ? "#FFFFFF" : "var(--text-secondary)",
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="coursue-input py-1.5 px-3 text-xs w-auto cursor-pointer"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluida">Concluída</option>
                    <option value="atrasada">Atrasada</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="coursue-card overflow-hidden rounded-[20px]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs" style={{ color: 'var(--text-primary)' }}>
                    <thead className="text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                      <tr>
                        <th className="px-6 py-4">Demanda</th>
                        <th className="px-6 py-4">Setor</th>
                        <th className="px-6 py-4">Prazo</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Progresso</th>
                        <th className="px-6 py-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {filteredDemandas.map((d) => (
                        <tr key={d.id} className="transition-colors" style={{ }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-raised)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td className="px-6 py-4 font-semibold">
                            <div>
                              <span className="block text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                                {d.titulo}
                              </span>
                              <span className="text-[10px] line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                                {d.descricao}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase text-[#5B50E5]" style={{ backgroundColor: 'var(--brand-light)' }}>
                              {d.setorNome}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {d.prazo}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                d.status === "concluida"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : d.status === "em_andamento"
                                  ? "bg-sky-100 text-sky-700"
                                  : d.status === "atrasada"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {d.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 w-32">
                            <div className="flex items-center gap-2">
                              <div className="progress-bar-track flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                                <div
                                  className="progress-bar-fill h-full bg-[#5B50E5] rounded-full"
                                  style={{ width: `${d.progresso}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                                {d.progresso}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedDemanda(d)}
                              className="p-2 rounded-xl text-[#5B50E5] hover:bg-[#5B50E5] hover:text-white transition-colors"
                              style={{ backgroundColor: 'var(--surface-raised)' }}
                              title="Abrir Detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

          </div>

          {/* Right Insights Column (Statistic Panel) */}
          <aside className="space-y-6">

            {/* Meu Desempenho Card */}
            <div className="coursue-card p-6 rounded-[24px] shadow-sm text-center flex flex-col items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: 'var(--text-secondary)' }}>
                Meu Desempenho
              </h3>

              {/* Performance SVG Ring */}
              <PerformanceRing
                percentage={pctConclusaoGeral}
                name={userName}
                avatarUrl={userAvatar}
                size={130}
                strokeWidth={9}
              />

              {/* Mensagem dinâmica por faixa de desempenho */}
              {(() => {
                let title = "Que tal começar a primeira tarefa? 🚀";
                let emoji = "🌱";
                if (pctConclusaoGeral === 100) {
                  title = "Desempenho Impecável! Nível Hashira máximo!";
                  emoji = "👑⚡";
                } else if (pctConclusaoGeral >= 75) {
                  title = "Excelente ritmo! Você está quase lá!";
                  emoji = "🔥⚡";
                } else if (pctConclusaoGeral >= 50) {
                  title = "Bom progresso! Metade das entregas concluídas!";
                  emoji = "💪🎯";
                } else if (pctConclusaoGeral > 0) {
                  title = "Suas entregas iniciaram. Mantenha o foco!";
                  emoji = "⏳✨";
                }

                return (
                  <>
                    <h4 className="mt-4 text-sm font-extrabold font-['Plus_Jakarta_Sans'] leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {title} {emoji}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {pctConclusaoGeral === 0
                        ? "Você ainda não possui entregas concluídas neste período."
                        : <>Você concluiu <strong className="text-[#5B50E5]">{pctConclusaoGeral}%</strong> das suas entregas neste período.</>}
                    </p>
                  </>
                );
              })()}

              {/* Recharts Bar Chart */}
              <div className="w-full h-36 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                    <Tooltip cursor={{ fill: "var(--surface-raised)" }} contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--text-primary)", fontSize: "11px" }} />
                    <Bar dataKey="concluida" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 3 ? "#5B50E5" : "#C7C2F5"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Minhas Próximas Demandas */}
            <div className="coursue-card p-6 rounded-[24px] shadow-sm space-y-4" style={{ backgroundColor: 'var(--surface-alt)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Minhas Próximas Demandas
                </h3>
                <span className="text-[10px] font-bold text-[#5B50E5] uppercase">Prazo</span>
              </div>

              <div className="space-y-3">
                {proximasDemandas.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedDemanda(p)}
                    className="p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-sm"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate group-hover:text-[#5B50E5] transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {p.titulo}
                      </span>
                      <span className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        <Clock className="w-3 h-3 text-[#5B50E5]" /> {p.prazo}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 group-hover:text-[#5B50E5] transition-colors shrink-0" style={{ color: 'var(--text-muted)' }} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStatusFilter("todos")}
                className="coursue-btn-secondary w-full text-xs py-2.5 rounded-full mt-2"
              >
                Ver todas
              </button>
            </div>

          </aside>

        </div>
      </div>

      {/* Modais */}
      <DemandDetailModal
        open={!!selectedDemanda}
        demanda={selectedDemanda}
        onClose={() => setSelectedDemanda(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      <CreateDemandModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateDemanda}
      />
    </div>
  );
}
