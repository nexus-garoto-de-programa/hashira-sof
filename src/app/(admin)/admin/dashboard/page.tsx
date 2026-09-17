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
import { CreateDemandModal } from "@/components/CreateDemandModal";
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

import { useRealtimeSubscription } from "@/lib/realtimeSync";
import { useGlobalLoading } from "@/context/LoadingContext";
import { useUserTags } from "@/lib/userTags";
import { UserTagBadge } from "@/components/UserTagBadge";
import { getStoredUsers, UserAccount } from "@/lib/authPermissions";
import { Tag as TagIcon } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { withLoading } = useGlobalLoading();
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [setorSelecionado, setSetorSelecionado] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDemanda, setSelectedDemanda] = useState<Demanda | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  const { tags, getUserTagsList } = useUserTags();
  const [usersList, setUsersList] = useState<UserAccount[]>(getStoredUsers);
  const [tagFiltro, setTagFiltro] = useState<string>("todas");

  const reloadDemandas = async () => {
    const remote = await fetchDemandasFromSupabase();
    setDemandas(remote);
  };

  useEffect(() => {
    setUsersList(getStoredUsers());
  }, []);

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
    reloadDemandas();
  }, [router]);

  // Hook de Sincronização em Tempo Real (Supabase Realtime + Cross-Tab Broadcast + Window Focus + Polling)
  useRealtimeSubscription({
    topics: ["demandas", "tarefas", "setores", "usuarios", "branding", "tags", "user_tags"],
    onUpdate: reloadDemandas,
    pollIntervalMs: 8000,
  });

  const updateDemandas = (novas: Demanda[]) => {
    setDemandas(novas);
    saveStoredDemandas(novas);
  };

  const getDemandColabTags = (demanda: Demanda) => {
    if (!demanda.colaboradorId && !demanda.colaboradorNome && !demanda.colaboradorEmail) return [];
    if (demanda.colaboradorId) {
      const direct = getUserTagsList(demanda.colaboradorId);
      if (direct.length > 0) return direct;
    }
    const matched = usersList.find(
      (u) =>
        (demanda.colaboradorEmail && u.email?.toLowerCase().trim() === demanda.colaboradorEmail.toLowerCase().trim()) ||
        (demanda.colaboradorNome && u.nome?.toLowerCase().trim() === demanda.colaboradorNome.toLowerCase().trim()) ||
        (demanda.colaboradorNome && u.nickname?.toLowerCase().trim() === demanda.colaboradorNome.toLowerCase().trim()) ||
        (demanda.colaboradorNome && u.comoQuerSerChamado?.toLowerCase().trim() === demanda.colaboradorNome.toLowerCase().trim())
    );
    if (matched) {
      return getUserTagsList(matched.id);
    }
    return [];
  };

  const demandasFiltradas = useMemo(() => {
    return demandas.filter((d) => {
      const matchSetor = setorSelecionado === "todos" || d.setorId === setorSelecionado;
      const matchSearch =
        d.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.setorNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.colaboradorNome && d.colaboradorNome.toLowerCase().includes(searchQuery.toLowerCase()));
      const dTags = getDemandColabTags(d);
      const matchTag = tagFiltro === "todas" || dTags.some((t) => t.id === tagFiltro);
      return matchSetor && matchSearch && matchTag;
    });
  }, [demandas, setorSelecionado, searchQuery, tagFiltro, usersList, getUserTagsList]);

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
    await withLoading(async () => {
      await deleteDemandaFromSupabase(id);
      toast.success("Demanda removida");
    }, "Excluindo demanda...");
  };

  const handleUpdateStatus = async (demandaId: string, newStatus: any, comentario?: string) => {
    let demandaAtualizada: Demanda | null = null;

    const atualizadas = demandas.map((d) => {
      if (d.id === demandaId) {
        const novoProgresso = newStatus === "concluida" ? 100 : newStatus === "em_andamento" ? 50 : 10;
        const novoHistorico = [...d.historico];
        if (comentario) {
          novoHistorico.push({
            id: "h-" + Date.now(),
            usuarioNome: "Administrador Central",
            acao: `Status alterado para ${newStatus.replace("_", " ")}`,
            data: new Date().toISOString().slice(0, 16).replace("T", " "),
            comentario,
          });
        }
        demandaAtualizada = {
          ...d,
          status: newStatus,
          progresso: novoProgresso,
          historico: novoHistorico,
        };
        return demandaAtualizada;
      }
      return d;
    });

    updateDemandas(atualizadas);
    if (selectedDemanda && selectedDemanda.id === demandaId && demandaAtualizada) {
      setSelectedDemanda(demandaAtualizada);
    }

    if (demandaAtualizada) {
      await saveDemandaToSupabase(demandaAtualizada);
    }
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

    await withLoading(async () => {
      await saveDemandaToSupabase(objetoCompleto);
      toast.success("Demanda criada e atribuída com sucesso!");
    }, "Criando e atribuindo demanda...");
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
      <div className="flex-1 min-w-0 p-6 md:p-8 space-y-6">
        
        {/* Top Admin Header (Desktop-First HIG) */}
        <section
          className="coursue-card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-md mb-2 text-[#5B50E5]" style={{ backgroundColor: "var(--brand-light)" }}>
              <Shield className="w-3.5 h-3.5" />
              <span>Painel de Gestão</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Panorama Geral de Demandas
            </h1>
            <p className="mt-1 text-xs md:text-sm" style={{ color: "var(--text-secondary)" }}>
              Acompanhamento de entregas, saúde dos setores e desempenho da equipe.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-[#5B50E5] hover:bg-[#483EA8] active:bg-[#3D3490] transition-colors flex items-center gap-1.5 shadow-xs"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              <Plus className="w-4 h-4" />
              <span>Nova Demanda</span>
            </button>

            <Link
              href="/operacoes"
              className="px-3.5 py-2 text-xs font-semibold border transition-colors flex items-center gap-1.5"
              style={{
                borderRadius: "var(--radius-md)",
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-alt)",
                color: "var(--text-primary)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5B50E5]" />
              <span>Central de Operações</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
          </div>
        </section>

        {/* Overview KPIs Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Demandas */}
          <div
            className="coursue-card p-5 flex items-center justify-between transition-shadow"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-secondary)" }}>
                Total de Demandas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  {metricasGlobais.total}
                </span>
                <span className="text-[11px] font-semibold text-[#5B50E5]">cadastradas</span>
              </div>
            </div>
            <div
              className="p-2.5 rounded-lg text-[#5B50E5]"
              style={{ backgroundColor: "var(--brand-light)" }}
            >
              <Activity className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Taxa de Conclusão */}
          <div
            className="coursue-card p-5 flex items-center justify-between transition-shadow"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-secondary)" }}>
                Taxa de Conclusão
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600 tracking-tight">
                  {metricasGlobais.taxaConclusao}%
                </span>
                <span className="text-[11px] font-semibold text-emerald-600">finalizadas</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Em Andamento */}
          <div
            className="coursue-card p-5 flex items-center justify-between transition-shadow"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-secondary)" }}>
                Em Andamento
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#5B50E5] tracking-tight">
                  {metricasGlobais.emAndamento}
                </span>
                <span className="text-[11px] font-semibold text-[#5B50E5]">em produção</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-[#5B50E5]">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Atrasadas / Atenção */}
          <div
            className="coursue-card p-5 flex items-center justify-between transition-shadow"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-secondary)" }}>
                Atrasadas
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tracking-tight ${metricasGlobais.atrasadas > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {metricasGlobais.atrasadas}
                </span>
                <span className="text-[11px] font-semibold" style={{ color: metricasGlobais.atrasadas > 0 ? "#DC2626" : "#16A34A" }}>
                  {metricasGlobais.atrasadas > 0 ? "requer atenção" : "em dia"}
                </span>
              </div>
            </div>
            <div className={`p-2.5 rounded-lg ${metricasGlobais.atrasadas > 0 ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"}`}>
              {metricasGlobais.atrasadas > 0 ? <AlertTriangle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </div>
          </div>
        </section>

        {/* Sector Filter Chips */}
        <section className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Filter className="w-3.5 h-3.5 text-[#5B50E5]" />
              Filtrar por Departamento
            </label>
            <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>
              Exibindo <strong style={{ color: 'var(--text-primary)' }}>{demandasFiltradas.length} {demandasFiltradas.length === 1 ? "demanda" : "demandas"}</strong>
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 w-full no-scrollbar">
            <button
              onClick={() => setSetorSelecionado("todos")}
              className="px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 border"
              style={{
                borderRadius: "var(--radius-md)",
                backgroundColor: setorSelecionado === "todos" ? "#5B50E5" : "var(--surface)",
                color: setorSelecionado === "todos" ? "#FFFFFF" : "var(--text-secondary)",
                borderColor: setorSelecionado === "todos" ? "#5B50E5" : "var(--border)",
              }}
            >
              <span>Todos os Setores</span>
              <span
                className="px-1.5 py-0.2 rounded text-[10px] font-extrabold"
                style={{
                  backgroundColor: setorSelecionado === "todos" ? "rgba(255,255,255,0.2)" : "var(--border)",
                  color: setorSelecionado === "todos" ? "#FFFFFF" : "var(--text-primary)",
                }}
              >
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
                  className="px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 border"
                  style={{
                    borderRadius: "var(--radius-md)",
                    backgroundColor: isSelected ? "#5B50E5" : "var(--surface)",
                    color: isSelected ? "#FFFFFF" : "var(--text-secondary)",
                    borderColor: isSelected ? "#5B50E5" : "var(--border)",
                  }}
                >
                  <span>{s.nome}</span>
                  <span
                    className="px-1.5 py-0.2 rounded text-[10px] font-extrabold"
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

        {/* Sector Cards Panorama HIG */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {setorPanorama.map((sp) => {
            const isSelected = setorSelecionado === sp.id;

            return (
              <div
                key={sp.id}
                onClick={() => setSetorSelecionado(isSelected ? "todos" : sp.id)}
                className={`coursue-card p-5 cursor-pointer transition-all border relative overflow-hidden flex flex-col justify-between ${
                  isSelected ? "ring-2 ring-[#5B50E5]" : ""
                }`}
                style={{
                  backgroundColor: isSelected ? "var(--surface-raised)" : "var(--surface)",
                  borderColor: isSelected ? "#5B50E5" : "var(--border)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                {/* Faixa decorativa superior fina */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: sp.cor }}
                />

                <div className="space-y-3">
                  {/* Top row: Badge do Setor + Ícone + Badge de Saúde */}
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="p-1.5 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: sp.badgeBg, color: sp.badgeText }}
                      >
                        {getSetorIcon(sp.icone)}
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider truncate" style={{ color: "var(--text-primary)" }}>
                        {sp.nome}
                      </h4>
                    </div>

                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1.5 border"
                      style={{
                        background:
                          sp.saude === "saudavel"
                            ? "rgba(22, 163, 74, 0.1)"
                            : sp.saude === "atencao"
                            ? "rgba(217, 119, 6, 0.1)"
                            : "rgba(220, 38, 38, 0.1)",
                        color: sp.saudeCor,
                        borderColor:
                          sp.saude === "saudavel"
                            ? "rgba(22, 163, 74, 0.2)"
                            : sp.saude === "atencao"
                            ? "rgba(217, 119, 6, 0.2)"
                            : "rgba(220, 38, 38, 0.2)",
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sp.saudeCor }} />
                      {sp.saudeLabel}
                    </span>
                  </div>

                  {/* 3 Métricas: Total, Concluídas, Atrasadas */}
                  <div
                    className="grid grid-cols-3 gap-2 py-2 px-2"
                    style={{
                      backgroundColor: "var(--surface-alt)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div className="text-center">
                      <span className="text-[9px] font-bold block uppercase" style={{ color: "var(--text-muted)" }}>
                        Total
                      </span>
                      <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                        {sp.total}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[9px] font-bold block uppercase text-emerald-600">
                        Feitas
                      </span>
                      <span className="text-base font-bold text-emerald-600">
                        {sp.concluidas}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[9px] font-bold block uppercase text-rose-600">
                        Atraso
                      </span>
                      <span className="text-base font-bold text-rose-600">
                        {sp.atrasadas}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso do Setor */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <span style={{ color: "var(--text-secondary)" }}>Progresso</span>
                      <span className="font-bold" style={{ color: sp.cor }}>{sp.taxaConclusao}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
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
                <div className="pt-2.5 mt-2.5 flex items-center justify-between text-[11px] font-medium" style={{ borderTop: "1px solid var(--border)" }}>
                  <span style={{ color: isSelected ? "#5B50E5" : "var(--text-muted)" }}>
                    {isSelected ? "● Filtro Ativo" : "Clique para isolar"}
                  </span>
                  <span className="text-[#5B50E5] font-semibold flex items-center gap-1">
                    {sp.total} demandas →
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Charts & Analytics Section com Filtros Interativos */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Main Interactive Chart Card */}
          <div
            className="coursue-card p-5 md:p-6 space-y-5"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            {/* Chart Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  Fluxo e Desempenho de Entregas
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Distribuição de demandas por departamento e status
                </p>
              </div>

              {/* Chart Controls: Tipo & Status Filter */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Tipo de Visualização */}
                <div className="flex rounded-md p-0.5 border" style={{ backgroundColor: "var(--surface-alt)", borderColor: "var(--border)" }}>
                  <button
                    onClick={() => setChartViewType("barras")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1 ${
                      chartViewType === "barras" ? "bg-[#5B50E5] text-white" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Barras
                  </button>
                  <button
                    onClick={() => setChartViewType("donut")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1 ${
                      chartViewType === "donut" ? "bg-[#5B50E5] text-white" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <PieChartIcon className="w-3.5 h-3.5" /> Setores
                  </button>
                  <button
                    onClick={() => setChartViewType("area")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1 ${
                      chartViewType === "area" ? "bg-[#5B50E5] text-white" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Área
                  </button>
                </div>

                {/* Filtro de Status */}
                <select
                  value={chartStatusFilter}
                  onChange={(e) => setChartStatusFilter(e.target.value as any)}
                  className="coursue-input py-1 px-2.5 text-xs w-auto cursor-pointer"
                  style={{ borderRadius: "var(--radius-sm)" }}
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
                  <BarChart data={chartDataFiltrado} margin={{ top: 16, right: 16, left: 0, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                        boxShadow: "var(--shadow-md)",
                      }}
                    />
                    <Bar dataKey="concluidas" fill="#16A34A" radius={[4, 4, 0, 0]} name="Concluídas" />
                    <Bar dataKey="pendentes" fill="#5B50E5" radius={[4, 4, 0, 0]} name="Em Andamento" />
                    <Bar dataKey="atrasadas" fill="#DC2626" radius={[4, 4, 0, 0]} name="Atrasadas" />
                  </BarChart>
                ) : chartViewType === "donut" ? (
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                        boxShadow: "var(--shadow-md)",
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
                  <AreaChart data={chartDataFiltrado} margin={{ top: 16, right: 16, left: 0, bottom: 16 }}>
                    <defs>
                      <linearGradient id="colorConcluidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPendentes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B50E5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#5B50E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                        boxShadow: "var(--shadow-md)",
                      }}
                    />
                    <Area type="monotone" dataKey="concluidas" stroke="#16A34A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorConcluidas)" name="Concluídas" />
                    <Area type="monotone" dataKey="pendentes" stroke="#5B50E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPendentes)" name="Em Andamento" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranking de Eficiência & Alertas Lateral */}
          <div className="space-y-4">
            {/* Card de Ranking de Produtividade */}
            <div
              className="coursue-card p-5 space-y-3"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              <div className="flex items-center justify-between pb-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                  <TrendingUp className="w-3.5 h-3.5 text-[#5B50E5]" />
                  Ranking de Conclusão
                </h3>
                <span className="text-[10px] font-semibold text-[#5B50E5]">6 setores</span>
              </div>

              <div className="space-y-2">
                {setoresRanking.map((s, idx) => (
                  <div
                    key={s.id}
                    onClick={() => setSetorSelecionado(s.id)}
                    className="p-2.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-between gap-3 hover:border-[#5B50E5]"
                    style={{ backgroundColor: "var(--surface-alt)", borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-[#5B50E5] w-4 text-center">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold block truncate" style={{ color: "var(--text-primary)" }}>
                          {s.nome}
                        </span>
                        <span className="text-[10px] block" style={{ color: "var(--text-secondary)" }}>
                          {s.concluidas}/{s.total} concluídas
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: s.badgeBg, color: s.badgeText }}>
                      {s.taxaConclusao}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Setores em Alerta */}
            <div
              className="coursue-card p-5 space-y-3"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              <div className="flex items-center justify-between pb-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Demandas Atrasadas
                </h3>
                <span className="text-[10px] font-semibold text-rose-600">{setoresAtencao.length} em atenção</span>
              </div>

              <div className="space-y-2">
                {setoresAtencao.length === 0 ? (
                  <div className="text-center py-4 space-y-0.5">
                    <p className="text-xs font-semibold text-emerald-600">
                      Sem gargalos no momento
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                      Todos os setores estão em dia.
                    </p>
                  </div>
                ) : (
                  setoresAtencao.map((sa) => (
                    <div
                      key={sa.id}
                      onClick={() => setSetorSelecionado(sa.id)}
                      className="p-2.5 rounded-lg border border-rose-200 bg-rose-500/5 hover:border-rose-300 transition-colors cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                          {sa.nome}
                        </span>
                        <span className="text-[10px] font-bold text-rose-600 uppercase bg-rose-500/10 px-1.5 py-0.2 rounded">
                          {sa.atrasadas} atraso{sa.atrasadas > 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                        {sa.pendentes} demandas em aberto.
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Control Table */}
        <section className="space-y-3 pt-2">
          <div className="flex flex-col gap-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Todas as Demandas Cadastradas
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Visão detalhada e gerenciamento de status
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por título ou colaborador…"
                    className="coursue-input pl-9 text-xs py-2"
                    style={{ borderRadius: "var(--radius-md)" }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-[#5B50E5] hover:bg-[#483EA8] active:bg-[#3D3490] transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova</span>
                </button>
              </div>
            </div>

            {/* Filtro Rápido por Tag */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                  <TagIcon className="w-3 h-3 text-slate-400" />
                  Filtrar por tag:
                </span>
                <button
                  type="button"
                  onClick={() => setTagFiltro("todas")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                    tagFiltro === "todas"
                      ? "bg-[#5B50E5] text-white shadow-xs font-semibold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  Todas
                </button>
                {tags.map((t) => {
                  const isSelected = tagFiltro === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTagFiltro(isSelected ? "todas" : t.id)}
                      className={`transition-all rounded-full ${
                        isSelected ? "ring-2 ring-offset-1 ring-[#5B50E5]" : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      <UserTagBadge tag={t} size="xs" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className="coursue-card overflow-hidden"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" style={{ color: 'var(--text-primary)' }}>
                <thead className="text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th className="px-4 py-3">Título</th>
                    <th className="px-4 py-3">Setor</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Prazo</th>
                    <th className="px-4 py-3">Prioridade</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {demandasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                        Nenhuma demanda encontrada.
                      </td>
                    </tr>
                  ) : (
                    demandasFiltradas.map((d) => {
                      const colabTags = getDemandColabTags(d);
                      return (
                      <tr
                        key={d.id}
                        className="transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{d.titulo}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-[#5B50E5]" style={{ backgroundColor: 'var(--brand-light)' }}>
                            {d.setorNome}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                          <div className="flex flex-col gap-1 items-start">
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {d.colaboradorNome || "Geral"}
                            </span>
                            {colabTags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                {colabTags.map((t) => (
                                  <UserTagBadge key={t.id} tag={t} size="xs" />
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{d.prazo}</td>
                        <td className="px-4 py-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-700 border border-amber-500/20">
                            {d.prioridade}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              d.status === "concluida"
                                ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                : d.status === "em_andamento"
                                ? "bg-sky-500/10 text-sky-700 border border-sky-500/20"
                                : d.status === "atrasada"
                                ? "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                            }`}
                          >
                            {d.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            onClick={() => setSelectedDemanda(d)}
                            className="p-1.5 rounded-md text-[#5B50E5] hover:bg-[#5B50E5] hover:text-white transition-colors"
                            style={{ backgroundColor: 'var(--surface-raised)' }}
                            title="Ver Detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDemanda(d.id)}
                            className="p-1.5 rounded-md text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
                            style={{ backgroundColor: 'var(--rose-hover-bg)' }}
                            title="Excluir Demanda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                      );
                    })
                  )}
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
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Modal de Criação de Demanda pelo Administrador */}
      <CreateDemandModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateDemanda}
      />
    </div>
  );
}
