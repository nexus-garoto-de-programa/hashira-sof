"use client";

import React, { useMemo, useState } from "react";
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
} from "lucide-react";
import {
  Demanda,
  getStoredDemandas,
  saveStoredDemandas,
  HASHIRAS_SEED,
} from "@/lib/demands";
import { AppSidebar } from "@/components/AppSidebar";
import { DemandDetailModal } from "@/components/DemandDetailModal";
import { CreateDemandModal } from "@/components/CreateDemandModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [demandas, setDemandas] = useState<Demanda[]>(getStoredDemandas);
  const [setorSelecionado, setSetorSelecionado] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDemanda, setSelectedDemanda] = useState<Demanda | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const setorPanorama = useMemo(() => {
    return HASHIRAS_SEED.map((setor) => {
      const demanSetor = demandas.filter((d) => d.setorId === setor.id);
      const total = demanSetor.length;
      const concluidas = demanSetor.filter((d) => d.status === "concluida").length;
      const atrasadas = demanSetor.filter((d) => d.status === "atrasada").length;
      const pendentes = demanSetor.filter((d) => d.status === "pendente" || d.status === "em_andamento").length;

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
        saude,
        saudeCor,
        saudeLabel,
      };
    });
  }, [demandas]);

  const chartDataSetores = useMemo(() => {
    return setorPanorama.map((s) => ({
      name: s.nome,
      concluidas: s.concluidas,
      pendentes: s.pendentes,
      atrasadas: s.atrasadas,
    }));
  }, [setorPanorama]);

  const setoresAtencao = useMemo(() => {
    return [...setorPanorama]
      .filter((s) => s.saude !== "saudavel")
      .sort((a, b) => b.atrasadas - a.atrasadas);
  }, [setorPanorama]);

  const handleDeleteDemanda = (id: string) => {
    const novas = demandas.filter((d) => d.id !== id);
    updateDemandas(novas);
    toast.success("Demanda removida");
  };

  const handleCreateDemanda = (nova: Omit<Demanda, "id" | "criadoEm">) => {
    const id = "dem-" + Date.now();
    const objetoCompleto: Demanda = {
      ...nova,
      id,
      criadoEm: new Date().toISOString(),
    };
    updateDemandas([objetoCompleto, ...demandas]);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Fixa Esquerda */}
      <AppSidebar userRole="administrador" userName="Administrador Central" />

      {/* Main Content Body */}
      <div className="flex-1 min-w-0 p-8 space-y-8">
        
        {/* Top Admin Banner */}
        <section
          className="coursue-banner relative p-8 md:p-10 shadow-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 100%)" }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold mb-3 bg-white/10 text-[#C7C2F5]">
                <Shield className="w-3.5 h-3.5" />
                Visão Panorâmica — Painel do Administrador
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                Gestão Geral de Setores & Demandas
              </h1>
              <p className="mt-2 text-sm text-white/80 max-w-2xl">
                Monitore o fluxo de entregas nos 6 Departamentos Hashiras, gerencie prazos e distribua atribuições.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="coursue-btn-primary bg-[#5B50E5] hover:bg-[#483EA8] text-white py-3 px-6 text-sm shadow-lg shadow-[#5B50E5]/30"
              >
                <Plus className="w-4 h-4" /> Publicar Nova Demanda
              </button>
            </div>
          </div>
        </section>

        {/* Top Sector Selector Chips */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <Filter className="w-4 h-4 text-[#5B50E5]" />
              Filtrar Visão por Departamento Hashira
            </label>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Exibindo <strong style={{ color: 'var(--text-primary)' }}>{demandasFiltradas.length} demandas</strong>
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSetorSelecionado("todos")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                setorSelecionado === "todos"
                  ? "bg-[#1E1B4B] text-white shadow-md"
                  : "border hover:border-[#5B50E5]"
              }`}
              style={{
                backgroundColor: setorSelecionado === "todos" ? undefined : "var(--surface)",
                color: setorSelecionado === "todos" ? "#FFFFFF" : "var(--text-secondary)",
                borderColor: setorSelecionado === "todos" ? undefined : "var(--border)",
              }}
            >
              Todos os Setores ({demandas.length})
            </button>
            {HASHIRAS_SEED.map((s) => {
              const count = demandas.filter((d) => d.setorId === s.id).length;
              const isSelected = setorSelecionado === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSetorSelecionado(s.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#5B50E5] text-white shadow-md"
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
                    className="px-2 py-0.5 rounded-full text-[10px]"
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

        {/* Sector Cards Panorama */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {setorPanorama.map((sp) => (
            <div
              key={sp.id}
              onClick={() => setSetorSelecionado(sp.id)}
              className={`coursue-card p-6 rounded-[24px] shadow-sm hover:shadow-md cursor-pointer transition-all ${
                setorSelecionado === sp.id ? "ring-2 ring-[#5B50E5]" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg"
                  style={{ background: sp.badgeBg, color: sp.badgeText }}
                >
                  {sp.nome}
                </span>

                <span
                  className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full"
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
                  ● {sp.saudeLabel}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 my-3 text-center" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span className="text-[10px] font-semibold block uppercase" style={{ color: 'var(--text-muted)' }}>
                    Total
                  </span>
                  <span className="text-xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                    {sp.total}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold block uppercase" style={{ color: 'var(--text-muted)' }}>
                    Concluídas
                  </span>
                  <span className="text-xl font-extrabold text-emerald-600 font-['Plus_Jakarta_Sans']">
                    {sp.concluidas}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold block uppercase" style={{ color: 'var(--text-muted)' }}>
                    Atrasadas
                  </span>
                  <span className="text-xl font-extrabold text-rose-600 font-['Plus_Jakarta_Sans']">
                    {sp.atrasadas}
                  </span>
                </div>
              </div>

              <p className="text-xs line-clamp-2 mt-2" style={{ color: 'var(--text-secondary)' }}>{sp.descricao}</p>
            </div>
          ))}
        </section>

        {/* Charts + Alert Ranking */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          <div className="coursue-card p-6 rounded-[24px] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                  Desempenho por Departamento Hashira
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Comparativo de entregas concluídas, pendentes e atrasadas
                </p>
              </div>
              <BarChart3 className="w-5 h-5 text-[#5B50E5]" />
            </div>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataSetores} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--text-primary)", fontSize: "12px" }} />
                  <Bar dataKey="concluidas" fill="#16A34A" radius={[4, 4, 0, 0]} name="Concluídas" />
                  <Bar dataKey="pendentes" fill="#5B50E5" radius={[4, 4, 0, 0]} name="Em Andamento" />
                  <Bar dataKey="atrasadas" fill="#DC2626" radius={[4, 4, 0, 0]} name="Atrasadas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="coursue-card p-6 rounded-[24px] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#DC2626] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                Setores em Alerta
              </h3>
              <span className="text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>{setoresAtencao.length} em atenção</span>
            </div>

            <div className="space-y-3">
              {setoresAtencao.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: 'var(--text-secondary)' }}>
                  Todos os setores estão em estado saudável! 🎉
                </p>
              ) : (
                setoresAtencao.map((sa) => (
                  <div
                    key={sa.id}
                    onClick={() => setSetorSelecionado(sa.id)}
                    className="p-3.5 rounded-2xl border border-rose-100 hover:border-rose-300 transition-all cursor-pointer space-y-1"
                    style={{ backgroundColor: 'var(--surface-raised)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{sa.nome}</span>
                      <span className="text-[10px] font-extrabold text-rose-600 uppercase bg-rose-100 px-2 py-0.5 rounded-full">
                        {sa.atrasadas} atrasadas
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      {sa.pendentes} demandas aguardando conclusão.
                    </p>
                  </div>
                ))
              )}
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

      {/* Modais */}
      <DemandDetailModal
        open={!!selectedDemanda}
        demanda={selectedDemanda}
        onClose={() => setSelectedDemanda(null)}
      />

      <CreateDemandModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateDemanda}
      />
    </div>
  );
}
