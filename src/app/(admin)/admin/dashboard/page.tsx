"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Filter,
  Plus,
  AlertTriangle,
  Search,
  Eye,
  Trash2,
  BarChart3,
  BarChart2,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  Zap,
  Sparkles,
  Layers,
  Headphones,
  Briefcase,
  Package,
  MessageSquare,
  PieChart as PieChartIcon,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  Demanda,
  getStoredDemandas,
  saveStoredDemandas,
  fetchDemandasFromSupabase,
  saveDemandaToSupabase,
  deleteDemandaFromSupabase,
  HASHIRAS_SEED,
} from "@/lib/demands";
import { AppSidebar } from "@/components/AppSidebar";
import { DemandDetailModal } from "@/components/DemandDetailModal";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useRouter } from "next/navigation";
import { getActiveUser } from "@/lib/authPermissions";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [setorSelecionado, setSetorSelecionado] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDemanda, setSelectedDemanda] = useState<Demanda | null>(null);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    const user = getActiveUser();
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.papel !== "administrador" && user.email !== "mhvzbusiness@gmail.com") {
      toast.error("Acesso restrito a Administradores.");
      router.push("/dashboard");
      return;
    }
    setUserChecked(true);

    const reloadDemandas = async () => {
      const remote = await fetchDemandasFromSupabase();
      setDemandas(remote);
    };

    reloadDemandas();

    const channel = supabase
      .channel("admin-dashboard-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "operacoes_tarefas" }, () => {
        reloadDemandas();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "demandas" }, () => {
        reloadDemandas();
      })
      .subscribe();

    window.addEventListener("hashira_demandas_updated", reloadDemandas);
    window.addEventListener("hashira_operacoes_tarefas_updated", reloadDemandas);
    window.addEventListener("storage", reloadDemandas);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("hashira_demandas_updated", reloadDemandas);
      window.removeEventListener("hashira_operacoes_tarefas_updated", reloadDemandas);
      window.removeEventListener("storage", reloadDemandas);
    };
  }, [router]);

  const updateDemandas = (novas: Demanda[]) => {
    setDemandas(novas);
    saveStoredDemandas(novas);
  };

  const demandasFiltradas = useMemo(() => {
    return demandas.filter((d) => {
      const matchSetor = setorSelecionado === "todos" || d.setorId === setorSelecionado;
      const matchSearch =
        d.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.setorNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.colaboradorNome && d.colaboradorNome.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSetor && matchSearch;
    });
  }, [demandas, setorSelecionado, searchQuery]);

  // Estado dos filtros avançados do Gráfico Geral
  const [chartViewType, setChartViewType] = useState<"barras" | "donut" | "area">("barras");
  const [chartPeriodFilter, setChartPeriodFilter] = useState<"todos" | "semana" | "mes">("todos");
  const [chartStatusFilter, setChartStatusFilter] = useState<"todos" | "concluida" | "em_andamento" | "atrasada">("todos");

  // Métricas Consolidadas Globais
  const metricasGlobais = useMemo(() => {
    const total = demandas.length;
    const concluidas = demandas.filter((d) => d.status === "concluida").length;
    const emAndamento = demandas.filter((d) => d.status === "em_andamento" || d.status === "pendente").length;
    const atrasadas = demandas.filter((d) => d.status === "atrasada").length;
    const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    return { total, concluidas, emAndamento, atrasadas, taxaConclusao };
  }, [demandas]);

  const setorPanorama = useMemo(() => {
    return HASHIRAS_SEED.map((setor) => {
      const demanSetor = demandas.filter((d) => d.setorId === setor.id);
      const total = demanSetor.length;
      const concluidas = demanSetor.filter((d) => d.status === "concluida").length;
      const atrasadas = demanSetor.filter((d) => d.status === "atrasada").length;
      const pendentes = demanSetor.filter((d) => d.status === "pendente" || d.status === "em_andamento").length;
      const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

      let saude: "saudavel" | "atencao" | "critico" = "saudavel";
      let saudeCor = "#16A34A";
      let saudeLabel = "Saudável";

      if (atrasadas > 1 || (total > 0 && pendentes / total > 0.6)) {
        saude = "critico";
        saudeCor = "#DC2626";
        saudeLabel = "Crítico";
      } else if (atrasadas === 1 || (total > 0 && pendentes / total > 0.4)) {
        saude = "atencao";
        saudeCor = "#D97706";
        saudeLabel = "Atenção";
      }

      return {
        ...setor,
        total,
        concluidas,
        atrasadas,
        pendentes,
        taxaConclusao,
        saude,
        saudeCor,
        saudeLabel,
      };
    });
  }, [demandas]);

  // Dados calculados para os Gráficos Gerais considerando filtros
  const chartDataFiltrado = useMemo(() => {
    let baseDemandas = [...demandas];

    // Filtro de status se selecionado
    if (chartStatusFilter !== "todos") {
      baseDemandas = baseDemandas.filter((d) => {
        if (chartStatusFilter === "em_andamento") return d.status === "em_andamento" || d.status === "pendente";
        return d.status === chartStatusFilter;
      });
    }

    return HASHIRAS_SEED.map((setor) => {
      const demanSetor = baseDemandas.filter((d) => d.setorId === setor.id);
      const total = demanSetor.length;
      const concluidas = demanSetor.filter((d) => d.status === "concluida").length;
      const atrasadas = demanSetor.filter((d) => d.status === "atrasada").length;
      const pendentes = demanSetor.filter((d) => d.status === "pendente" || d.status === "em_andamento").length;

      return {
        name: setor.nome,
        shortName: setor.nome.split(" ")[0],
        total,
        concluidas,
        pendentes,
        atrasadas,
        cor: setor.cor,
      };
    });
  }, [demandas, chartStatusFilter]);

  const donutData = useMemo(() => {
    return chartDataFiltrado
      .filter((d) => d.total > 0)
      .map((d) => ({
        name: d.name,
        value: d.total,
        color: d.cor,
      }));
  }, [chartDataFiltrado]);

  const setoresAtencao = useMemo(() => {
    return [...setorPanorama]
      .filter((s) => s.saude !== "saudavel")
      .sort((a, b) => b.atrasadas - a.atrasadas);
  }, [setorPanorama]);

  const setoresRanking = useMemo(() => {
    return [...setorPanorama].sort((a, b) => b.taxaConclusao - a.taxaConclusao);
  }, [setorPanorama]);

  if (!userChecked) return null;

  const handleDeleteDemanda = async (id: string) => {
    await deleteDemandaFromSupabase(id);
    toast.success("Demanda removida");
  };

  const handleCreateDemanda = async (nova: Omit<Demanda, "id" | "criadoEm">) => {
    const id = "dem-" + Date.now();
    const objetoCompleto: Demanda = {
      ...nova,
      id,
      criadoEm: new Date().toISOString(),
    };

    // Optimistic update: atualiza o estado local IMEDIATAMENTE
    setDemandas((prev) => [objetoCompleto, ...prev]);

    await saveDemandaToSupabase(objetoCompleto);
    toast.success("Demanda criada e atribuída com sucesso!");
  };

  const getSetorIcon = (iconName: string) => {
    switch (iconName) {
      case "Sparkles":
        return <Sparkles className="w-4 h-4" />;
      case "Layers":
        return <Layers className="w-4 h-4" />;
      case "Headphones":
        return <Headphones className="w-4 h-4" />;
      case "Briefcase":
        return <Briefcase className="w-4 h-4" />;
      case "Package":
        return <Package className="w-4 h-4" />;
      case "MessageSquare":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Fixa Esquerda */}
      <AppSidebar userRole="administrador" userName="Administrador Central" />

      {/* Main Content Body */}
      <div className="flex-1 min-w-0 p-8 space-y-8">
        
        {/* Top Admin Banner */}
        <section
          className="coursue-banner relative p-8 md:p-10 shadow-xl overflow-hidden rounded-[28px]"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 100%)" }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold mb-3 bg-white/10 text-[#C7C2F5]">
                <Shield className="w-3.5 h-3.5" />
                Centro de Comando — Visão Geral Administrativa
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                Panorama Operacional Hashira
              </h1>
              <p className="mt-2 text-sm text-white/80 max-w-2xl">
                Monitore em tempo real o fluxo de entregas, saúde dos 6 departamentos e alocação de recursos da equipe.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/operacoes"
                className="coursue-btn-primary bg-[#5B50E5] hover:bg-[#483EA8] text-white py-3 px-6 text-sm shadow-lg shadow-[#5B50E5]/30 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Criar Demanda na Central de Operações <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Overview KPIs Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Demandas */}
          <div className="coursue-card p-6 rounded-[24px] shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: "var(--text-secondary)" }}>
                Total de Demandas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                  {metricasGlobais.total}
                </span>
                <span className="text-[11px] font-bold text-[#5B50E5]">ativas</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#5B50E5]/10 text-[#5B50E5] group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Taxa de Conclusão */}
          <div className="coursue-card p-6 rounded-[24px] shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: "var(--text-secondary)" }}>
                Taxa de Eficiência
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600 font-['Plus_Jakarta_Sans']">
                  {metricasGlobais.taxaConclusao}%
                </span>
                <span className="text-[11px] font-bold text-emerald-600">concluídas</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Em Andamento */}
          <div className="coursue-card p-6 rounded-[24px] shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: "var(--text-secondary)" }}>
                Em Andamento
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#5B50E5] font-['Plus_Jakarta_Sans']">
                  {metricasGlobais.emAndamento}
                </span>
                <span className="text-[11px] font-bold text-[#5B50E5]">em produção</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-[#5B50E5] group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Atrasadas / Atenção */}
          <div className="coursue-card p-6 rounded-[24px] shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: "var(--text-secondary)" }}>
                Demandas Atrasadas
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold font-['Plus_Jakarta_Sans'] ${metricasGlobais.atrasadas > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {metricasGlobais.atrasadas}
                </span>
                <span className="text-[11px] font-bold" style={{ color: metricasGlobais.atrasadas > 0 ? "#DC2626" : "#16A34A" }}>
                  {metricasGlobais.atrasadas > 0 ? "requer ação" : "sob controle"}
                </span>
              </div>
            </div>
            <div className={`p-3.5 rounded-2xl group-hover:scale-110 transition-transform ${metricasGlobais.atrasadas > 0 ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"}`}>
              {metricasGlobais.atrasadas > 0 ? <AlertTriangle className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
            </div>
          </div>
        </section>

        {/* Sector Filter Chips */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <Filter className="w-4 h-4 text-[#5B50E5]" />
              Filtrar Visão por Departamento Hashira
            </label>
            <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>
              Exibindo <strong style={{ color: 'var(--text-primary)' }}>{demandasFiltradas.length} {demandasFiltradas.length === 1 ? "demanda" : "demandas"}</strong>
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-2.5 pt-0.5 w-full no-scrollbar">
            <button
              onClick={() => setSetorSelecionado("todos")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-2 ${
                setorSelecionado === "todos"
                  ? "bg-[#1E1B4B] text-white shadow-md ring-2 ring-[#5B50E5]"
                  : "border hover:border-[#5B50E5]"
              }`}
              style={{
                backgroundColor: setorSelecionado === "todos" ? undefined : "var(--surface)",
                color: setorSelecionado === "todos" ? "#FFFFFF" : "var(--text-secondary)",
                borderColor: setorSelecionado === "todos" ? undefined : "var(--border)",
              }}
            >
              <span>Todos os Setores</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-extrabold">
                {demandas.length}
              </span>
            </button>

            {HASHIRAS_SEED.map((s) => {
              const count = demandas.filter((d) => d.setorId === s.id).length;
              const isSelected = setorSelecionado === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSetorSelecionado(s.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#5B50E5] text-white shadow-md ring-2 ring-[#5B50E5]"
                      : "border hover:border-[#5B50E5]"
                  }`}
                  style={{
                    backgroundColor: isSelected ? "#5B50E5" : "var(--surface)",
                    color: isSelected ? "#FFFFFF" : "var(--text-secondary)",
                    borderColor: isSelected ? "transparent" : "var(--border)",
                  }}
                >
                  <span>{s.nome}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-extrabold"
                    style={{
                      background: isSelected ? "rgba(255,255,255,0.2)" : s.badgeBg,
                      color: isSelected ? "#FFFFFF" : s.badgeText,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Sector Cards Panorama Modernizados */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {setorPanorama.map((sp) => {
            const isSelected = setorSelecionado === sp.id;

            return (
              <motion.div
                key={sp.id}
                whileHover={{ y: -3 }}
                onClick={() => setSetorSelecionado(isSelected ? "todos" : sp.id)}
                className={`coursue-card p-6 rounded-[24px] shadow-sm hover:shadow-md cursor-pointer transition-all border relative overflow-hidden flex flex-col justify-between ${
                  isSelected ? "ring-2 ring-[#5B50E5] shadow-lg" : ""
                }`}
                style={{
                  backgroundColor: isSelected ? "var(--surface-raised)" : "var(--surface)",
                  borderColor: isSelected ? "#5B50E5" : "var(--border)",
                }}
              >
                {/* Faixa decorativa superior com a cor oficial do Hashira */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: sp.cor }}
                />

                <div className="space-y-4">
                  {/* Top row: Badge do Setor + Ícone + Badge de Saúde */}
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="p-2.5 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: sp.badgeBg, color: sp.badgeText }}
                      >
                        {getSetorIcon(sp.icone)}
                      </div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider truncate font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                        {sp.nome}
                      </h4>
                    </div>

                    <span
                      className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1.5 shadow-xs"
                      style={{
                        background:
                          sp.saude === "saudavel"
                            ? "#DCFCE7"
                            : sp.saude === "atencao"
                            ? "#FEF3C7"
                            : "#FEE2E2",
                        color: sp.saudeCor,
                      }}
                    >
                      <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: sp.saudeCor }} />
                      {sp.saudeLabel}
                    </span>
                  </div>

                  {/* 3 Métricas: Total, Concluídas, Atrasadas */}
                  <div
                    className="grid grid-cols-3 gap-2 py-3 px-2 rounded-2xl"
                    style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
                  >
                    <div className="text-center">
                      <span className="text-[9px] font-bold block uppercase" style={{ color: "var(--text-muted)" }}>
                        Total
                      </span>
                      <span className="text-lg font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                        {sp.total}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[9px] font-bold block uppercase text-emerald-600">
                        Concluídas
                      </span>
                      <span className="text-lg font-extrabold text-emerald-600 font-['Plus_Jakarta_Sans']">
                        {sp.concluidas}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[9px] font-bold block uppercase text-rose-600">
                        Atrasadas
                      </span>
                      <span className="text-lg font-extrabold text-rose-600 font-['Plus_Jakarta_Sans']">
                        {sp.atrasadas}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso do Setor */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span style={{ color: "var(--text-secondary)" }}>Progresso Geral</span>
                      <span className="font-extrabold" style={{ color: sp.cor }}>{sp.taxaConclusao}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${sp.taxaConclusao}%`,
                          backgroundColor: sp.cor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Descrição */}
                  <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {sp.descricao}
                  </p>
                </div>

                {/* Footer do Card com CTA de Filtro */}
                <div className="pt-3 mt-3 flex items-center justify-between text-[11px] font-bold" style={{ borderTop: "1px solid var(--border)" }}>
                  <span style={{ color: isSelected ? "#5B50E5" : "var(--text-muted)" }}>
                    {isSelected ? "● Filtro Ativo" : "Clique para isolar"}
                  </span>
                  <span className="text-[#5B50E5] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    {sp.total} demandas →
                  </span>
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* Charts & Analytics Section com Filtros Interativos */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Main Interactive Chart Card */}
          <div className="coursue-card p-6 md:p-8 rounded-[24px] shadow-sm space-y-6">
            {/* Chart Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="text-base font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                  Gráfico Analítico de Entregas Hashira
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Distribuição de demandas, status e performance comparativa
                </p>
              </div>

              {/* Chart Controls: Tipo & Status Filter */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Tipo de Visualização */}
                <div className="flex rounded-full p-1 shadow-xs" style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}>
                  <button
                    onClick={() => setChartViewType("barras")}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
                      chartViewType === "barras" ? "bg-[#5B50E5] text-white shadow-xs" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Barras
                  </button>
                  <button
                    onClick={() => setChartViewType("donut")}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
                      chartViewType === "donut" ? "bg-[#5B50E5] text-white shadow-xs" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <PieChartIcon className="w-3.5 h-3.5" /> Setores
                  </button>
                  <button
                    onClick={() => setChartViewType("area")}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
                      chartViewType === "area" ? "bg-[#5B50E5] text-white shadow-xs" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Área
                  </button>
                </div>

                {/* Filtro de Status */}
                <select
                  value={chartStatusFilter}
                  onChange={(e) => setChartStatusFilter(e.target.value as any)}
                  className="coursue-input py-1 px-3 text-xs w-auto cursor-pointer"
                >
                  <option value="todos">Todos Status</option>
                  <option value="concluida">Apenas Concluídas</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="atrasada">Atrasadas</option>
                </select>
              </div>
            </div>

            {/* Chart Canvas */}
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                {chartViewType === "barras" ? (
                  <BarChart data={chartDataFiltrado} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                      }}
                    />
                    <Bar dataKey="concluidas" fill="#16A34A" radius={[6, 6, 0, 0]} name="Concluídas" />
                    <Bar dataKey="pendentes" fill="#5B50E5" radius={[6, 6, 0, 0]} name="Em Andamento" />
                    <Bar dataKey="atrasadas" fill="#DC2626" radius={[6, 6, 0, 0]} name="Atrasadas" />
                  </BarChart>
                ) : chartViewType === "donut" ? (
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                      }}
                    />
                    <Pie
                      data={donutData.length > 0 ? donutData : [{ name: "Sem dados", value: 1, color: "#9CA3AF" }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                ) : (
                  <AreaChart data={chartDataFiltrado} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorConcluidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPendentes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B50E5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#5B50E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="concluidas" stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#colorConcluidas)" name="Concluídas" />
                    <Area type="monotone" dataKey="pendentes" stroke="#5B50E5" strokeWidth={3} fillOpacity={1} fill="url(#colorPendentes)" name="Em Andamento" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranking de Eficiência & Alertas Lateral */}
          <div className="space-y-6">
            {/* Card de Ranking de Produtividade */}
            <div className="coursue-card p-6 rounded-[24px] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <TrendingUp className="w-4 h-4 text-[#5B50E5]" />
                  Ranking de Eficiência
                </h3>
                <span className="text-[10px] font-bold text-[#5B50E5]">6 setores</span>
              </div>

              <div className="space-y-3">
                {setoresRanking.map((s, idx) => (
                  <div
                    key={s.id}
                    onClick={() => setSetorSelecionado(s.id)}
                    className="p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 hover:border-[#5B50E5]"
                    style={{ backgroundColor: "var(--surface-alt)", borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-extrabold text-[#5B50E5] w-4 text-center">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate" style={{ color: "var(--text-primary)" }}>
                          {s.nome}
                        </span>
                        <span className="text-[10px] block" style={{ color: "var(--text-secondary)" }}>
                          {s.concluidas}/{s.total} entregas
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full" style={{ backgroundColor: s.badgeBg, color: s.badgeText }}>
                      {s.taxaConclusao}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Setores em Alerta */}
            <div className="coursue-card p-6 rounded-[24px] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Setores em Alerta
                </h3>
                <span className="text-[10px] font-bold text-rose-600">{setoresAtencao.length} em atenção</span>
              </div>

              <div className="space-y-3">
                {setoresAtencao.length === 0 ? (
                  <div className="text-center py-6 space-y-1">
                    <span className="text-2xl block">🎉</span>
                    <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                      Todos os setores estão saudáveis!
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                      Nenhum gargalo de entregas atrasadas detectado.
                    </p>
                  </div>
                ) : (
                  setoresAtencao.map((sa) => (
                    <div
                      key={sa.id}
                      onClick={() => setSetorSelecionado(sa.id)}
                      className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/30 hover:border-rose-400 transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>
                          {sa.nome}
                        </span>
                        <span className="text-[10px] font-extrabold text-rose-600 uppercase bg-rose-100 px-2 py-0.5 rounded-full">
                          {sa.atrasadas} atrasadas
                        </span>
                      </div>
                      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        {sa.pendentes} demandas aguardando conclusão.
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Control Table */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 className="text-xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                Painel Geral de Controle
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Lista completa de todas as demandas cadastradas
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por demanda ou colaborador…"
                className="coursue-input pl-11 text-xs"
              />
            </div>
          </div>

          <div className="coursue-card overflow-hidden rounded-[20px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" style={{ color: 'var(--text-primary)' }}>
                <thead className="text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th className="px-6 py-4">Título</th>
                    <th className="px-6 py-4">Setor Hashira</th>
                    <th className="px-6 py-4">Responsável</th>
                    <th className="px-6 py-4">Prazo</th>
                    <th className="px-6 py-4">Prioridade</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {demandasFiltradas.map((d) => (
                    <tr key={d.id} className="transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-raised)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td className="px-6 py-4 font-semibold" style={{ color: 'var(--text-primary)' }}>{d.titulo}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase text-[#5B50E5]" style={{ backgroundColor: 'var(--brand-light)' }}>
                          {d.setorNome}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {d.colaboradorNome || "Geral"}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{d.prazo}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700">
                          {d.prioridade}
                        </span>
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
                      <td className="px-6 py-4 text-right space-x-1">
                        <button
                          onClick={() => setSelectedDemanda(d)}
                          className="p-2 rounded-xl text-[#5B50E5] hover:bg-[#5B50E5] hover:text-white transition-colors"
                          style={{ backgroundColor: 'var(--surface-raised)' }}
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDemanda(d.id)}
                          className="p-2 rounded-xl text-rose-600 transition-colors"
                          style={{ backgroundColor: 'var(--rose-hover-bg)' }}
                          title="Excluir Demanda"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal de Detalhes da Demanda */}
      <DemandDetailModal
        open={!!selectedDemanda}
        demanda={selectedDemanda}
        onClose={() => setSelectedDemanda(null)}
      />
    </div>
  );
}
