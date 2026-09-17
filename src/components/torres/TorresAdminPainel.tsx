"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  Clock,
  Download,
  Printer,
  Calendar,
  User,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  PontoRegistro,
  fetchHistoricoPontos,
  getTodayDateString,
} from "@/lib/torresData";
import { UserAccount, fetchUsersFromSupabase } from "@/lib/authPermissions";
import { useRealtimeSubscription } from "@/lib/realtimeSync";
import { toast } from "sonner";

interface TorresAdminPainelProps {
  currentUser: UserAccount;
}

type PeriodoFiltro = "hoje" | "7dias" | "mes" | "todos";

export const TorresAdminPainel: React.FC<TorresAdminPainelProps> = ({ currentUser }) => {
  const [pontos, setPontos] = useState<PontoRegistro[]>([]);
  const [colaboradores, setColaboradores] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedColab, setSelectedColab] = useState<string>("todos");
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("hoje");

  const carregarHistorico = async () => {
    try {
      const hoje = getTodayDateString();
      let dataInicio: string | undefined = undefined;

      if (periodo === "hoje") {
        dataInicio = hoje;
      } else if (periodo === "7dias") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        dataInicio = d.toISOString().split("T")[0];
      } else if (periodo === "mes") {
        const d = new Date();
        dataInicio = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      }

      const [resPontos, resUsers] = await Promise.all([
        fetchHistoricoPontos(selectedColab, dataInicio),
        fetchUsersFromSupabase(),
      ]);

      setPontos(resPontos);
      setColaboradores(resUsers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, [selectedColab, periodo]);

  useRealtimeSubscription({
    topics: ["ponto"],
    onUpdate: () => carregarHistorico(),
  });

  const usersMap = useMemo(() => {
    const map = new Map<string, UserAccount>();
    colaboradores.forEach((u) => map.set(u.id, u));
    return map;
  }, [colaboradores]);

  // Exportar para CSV
  const handleExportCSV = () => {
    if (pontos.length === 0) {
      toast.error("Nenhum registro para exportar.");
      return;
    }

    const headers = ["ID", "Colaborador", "Email", "Tipo", "Data", "Hora"];
    const rows = pontos.map((p) => {
      const u = usersMap.get(p.colaborador_id);
      const dataObj = new Date(p.timestamp);
      const dataStr = dataObj.toLocaleDateString("pt-BR");
      const horaStr = dataObj.toLocaleTimeString("pt-BR");
      return [
        p.id,
        u?.comoQuerSerChamado || u?.nome || p.colaborador_id,
        u?.email || "",
        p.tipo === "entrada" ? "Entrada" : "Saída",
        dataStr,
        horaStr,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_pontos_${periodo}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório CSV baixado com sucesso!");
  };

  const handlePrint = () => {
    window.print();
  };

  // Estatísticas do período
  const totalRegistros = pontos.length;
  const totalEntradas = pontos.filter((p) => p.tipo === "entrada").length;
  const totalSaidas = pontos.filter((p) => p.tipo === "saida").length;
  const colaboradoresDistintos = new Set(pontos.map((p) => p.colaborador_id)).size;

  return (
    <div
      className="p-6 rounded-[28px] space-y-6 shadow-sm"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header com Ações de Auditoria */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
              Auditoria de Ponto & Presença da Equipe
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#5B50E5]/15 text-[#5B50E5]">
              Gestão Central
            </span>
          </div>
          <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            Histórico completo de entradas, saídas e frequência de todos os colaboradores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl" style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}>
          <span className="text-[10px] font-bold uppercase tracking-wider block text-zinc-400">
            Total Batidas
          </span>
          <span className="text-2xl font-black tracking-tight block text-[#5B50E5]">
            {totalRegistros}
          </span>
        </div>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}>
          <span className="text-[10px] font-bold uppercase tracking-wider block text-zinc-400">
            Entradas
          </span>
          <span className="text-2xl font-black tracking-tight block text-emerald-500">
            {totalEntradas}
          </span>
        </div>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}>
          <span className="text-[10px] font-bold uppercase tracking-wider block text-zinc-400">
            Saídas
          </span>
          <span className="text-2xl font-black tracking-tight block text-rose-500">
            {totalSaidas}
          </span>
        </div>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}>
          <span className="text-[10px] font-bold uppercase tracking-wider block text-zinc-400">
            Colaboradores Ativos
          </span>
          <span className="text-2xl font-black tracking-tight block" style={{ color: "var(--text-primary)" }}>
            {colaboradoresDistintos}
          </span>
        </div>
      </div>

      {/* Filtros de Tabela */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl" style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 flex-1">
          <User className="w-4 h-4 text-[#5B50E5]" />
          <select
            value={selectedColab}
            onChange={(e) => setSelectedColab(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors outline-none cursor-pointer flex-1 sm:flex-none"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="todos">Todos os colaboradores</option>
            {colaboradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.comoQuerSerChamado || c.nome} ({c.setorNome || "Geral"})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {(["hoje", "7dias", "mes", "todos"] as PeriodoFiltro[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                periodo === p
                  ? "bg-[#5B50E5] text-white shadow-sm"
                  : "hover:bg-zinc-500/10 text-zinc-400"
              }`}
            >
              {p === "hoje"
                ? "Hoje"
                : p === "7dias"
                ? "7 dias"
                : p === "mes"
                ? "Este Mês"
                : "Tudo"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Histórico */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead style={{ backgroundColor: "var(--surface-alt)", borderBottom: "1px solid var(--border)" }}>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-4">Setor</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {pontos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-400 font-bold">
                    Nenhum registro de ponto encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                pontos.map((p) => {
                  const u = usersMap.get(p.colaborador_id);
                  const dataObj = new Date(p.timestamp);
                  const isEntrada = p.tipo === "entrada";

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-500/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                            alt={u?.nome || "Avatar"}
                            className="w-7 h-7 rounded-full object-cover border"
                          />
                          <div>
                            <span className="font-bold block" style={{ color: "var(--text-primary)" }}>
                              {u?.comoQuerSerChamado || u?.nome || "Colaborador Removido"}
                            </span>
                            <span className="text-[10px] text-zinc-400 block truncate max-w-[150px]">
                              {u?.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-medium">
                        {u?.setorNome || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isEntrada
                              ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isEntrada ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {isEntrada ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold" style={{ color: "var(--text-primary)" }}>
                        {dataObj.toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#5B50E5]">
                        {dataObj.toLocaleTimeString("pt-BR")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
