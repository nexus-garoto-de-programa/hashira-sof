"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarClock,
  Clock,
  Moon,
  Sun,
  Coffee,
  CheckCircle2,
  Calendar,
  Sparkles,
  Users,
  ShieldAlert,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  EscalaTurno,
  DiaSemana,
  fetchEscalaTurnos,
  getSemanaRodizioAtual,
} from "@/lib/torresData";
import { UserAccount, fetchUsersFromSupabase } from "@/lib/authPermissions";
import { Tag, UserTag, fetchTags, fetchUserTags, userHasTag } from "@/lib/userTags";
import { useRealtimeSubscription } from "@/lib/realtimeSync";
import { UserTagBadge } from "@/components/UserTagBadge";

interface TorresEscalaTabProps {
  currentUser: UserAccount;
  isAdminView: boolean;
}

interface TorreItem {
  id: string;
  nome: string;
  apelido: string;
  avatarUrl?: string;
  userAccount: UserAccount;
}

export const TorresEscalaTab: React.FC<TorresEscalaTabProps> = ({
  currentUser,
  isAdminView,
}) => {
  const [turnos, setTurnos] = useState<EscalaTurno[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [loading, setLoading] = useState(true);

  const semanaAtual = useMemo(() => getSemanaRodizioAtual(), []);
  const [semanaVisualizada, setSemanaVisualizada] = useState<1 | 2 | 3>(semanaAtual);

  const carregarDados = async () => {
    try {
      const [turnosData, usersData, tagsData, userTagsData] = await Promise.all([
        fetchEscalaTurnos(),
        fetchUsersFromSupabase(),
        fetchTags(),
        fetchUserTags(),
      ]);
      setTurnos(turnosData);
      setUsers(usersData);
      setTags(tagsData);
      setUserTags(userTagsData);
    } catch (e) {
      console.error("[ESCALA] Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  useRealtimeSubscription({
    topics: ["escala", "tags", "user_tags", "usuarios"],
    onUpdate: carregarDados,
  });

  // Mapeia os usuários que possuem a tag "Torre" de forma 100% dinâmica
  const torresEnriquecidas = useMemo<TorreItem[]>(() => {
    return users
      .filter((u) => userHasTag(u, "torre", userTags, tags))
      .map((u) => ({
        id: u.id,
        nome: u.nome,
        apelido: u.comoQuerSerChamado || u.nickname || u.nome,
        avatarUrl: u.avatarUrl,
        userAccount: u,
      }))
      .sort((a, b) => a.apelido.localeCompare(b.apelido, "pt-BR"));
  }, [users, userTags, tags]);

  // Identifica qual torre corresponde ao usuário logado
  const minhaTorre = useMemo<TorreItem | null>(() => {
    if (!currentUser) return null;
    const isTorre = userHasTag(currentUser, "torre", userTags, tags);
    if (!isTorre) return null;

    const matched = torresEnriquecidas.find((t) => t.id === currentUser.id);
    if (matched) return matched;

    return {
      id: currentUser.id,
      nome: currentUser.nome,
      apelido: currentUser.comoQuerSerChamado || currentUser.nickname || currentUser.nome,
      avatarUrl: currentUser.avatarUrl,
      userAccount: currentUser,
    };
  }, [torresEnriquecidas, currentUser, userTags, tags]);

  // Helper para obter turnos de um colaborador em um dia específico (e ciclo se fim de semana)
  const getTurnosDoColaborador = (
    colaboradorId: string,
    dia: DiaSemana,
    ciclo?: 1 | 2 | 3
  ) => {
    return turnos.filter((t) => {
      if (t.colaborador_id !== colaboradorId) return false;
      if (t.dia_semana !== dia) return false;
      if (dia === "sabado" || dia === "domingo") {
        return t.semana_ciclo === ciclo;
      }
      return !t.semana_ciclo;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs" style={{ color: "var(--text-secondary)" }}>
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 animate-spin text-[#5B50E5]" />
          Carregando escala dos Torres...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── HEADER DA ESCALA ── */}
      <div
        className="coursue-card p-6 sm:p-7 rounded-[28px] border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="space-y-1.5 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/25 flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              Escala Oficial Torres
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              ● Semana {semanaAtual} do Rodízio (Ativa)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
            {isAdminView ? "Escala Semanal da Equipe de Torres" : `Minha Escala — ${minhaTorre?.apelido || currentUser.comoQuerSerChamado || currentUser.nome}`}
          </h2>
          <p className="text-xs max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            {isAdminView
              ? "Visão panorâmica consolidada: turnos fixos de segunda a sexta e rodízio cíclico de 3 semanas aos fins de semana."
              : "Seu horário oficial de expediente semanal e escala de plantões/folgas no rodízio de sábado e domingo."}
          </p>
        </div>

        {/* Seletor Rápido de Ciclo de Fim de Semana */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 z-10 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Ciclo Fim de Semana:
          </span>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
            {([1, 2, 3] as const).map((sem) => {
              const isSelected = semanaVisualizada === sem;
              const isCurrent = semanaAtual === sem;
              return (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSemanaVisualizada(sem)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#5B50E5] text-white shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>Semana {sem}</span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Semana Corrente" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 1. VISÃO PANORÂMICA (ADMIN / GESTOR) ── */}
      {isAdminView && (
        <div className="space-y-8">
          {/* TABELA 1: SEGUNDA A SEXTA (FIXO) */}
          <div
            className="coursue-card overflow-hidden rounded-[28px] border shadow-xs"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="p-5 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Sun className="w-4 h-4 text-amber-500" />
                  Segunda a Sexta (Horário Fixo Semanal)
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Repete toda semana para garantir a cobertura contínua das operações
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" style={{ color: "var(--text-primary)" }}>
                <thead
                  className="text-[11px] font-black uppercase tracking-wider"
                  style={{
                    backgroundColor: "var(--surface-alt)",
                    color: "var(--text-secondary)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <tr>
                    <th className="px-5 py-3.5 w-44">Período / Dias</th>
                    {torresEnriquecidas.map((torre) => (
                      <th key={torre.id} className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {/* Foto real com fallback de iniciais */}
                          {torre.avatarUrl ? (
                            <img
                              src={torre.avatarUrl}
                              alt={torre.apelido}
                              className="w-8 h-8 rounded-full object-cover border border-purple-500/30 shadow-xs shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                                if (next) next.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-black text-xs items-center justify-center uppercase shrink-0 ${
                              torre.avatarUrl ? "hidden" : "flex"
                            }`}
                          >
                            {torre.apelido[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate">
                              {torre.apelido}
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 truncate">
                              {torre.nome}
                            </div>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {/* Bloco Seg / Ter / Qua */}
                  <tr className="transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="px-5 py-4 font-bold align-top">
                      <div className="flex items-center gap-1.5 text-[#5B50E5] font-extrabold">
                        <Calendar className="w-3.5 h-3.5" />
                        Seg / Ter / Qua
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        Início da semana
                      </span>
                    </td>
                    {torresEnriquecidas.map((torre) => {
                      const turnosSeg = getTurnosDoColaborador(torre.id, "segunda");
                      return (
                        <td key={torre.id} className="px-5 py-4 align-top">
                          <div className="space-y-1.5">
                            {turnosSeg.length === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
                                <Coffee className="w-3 h-3 text-slate-400" />
                                Sem escala
                              </span>
                            ) : (
                              turnosSeg.map((t) => (
                                <div
                                  key={t.id}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold mr-2 ${
                                    t.cruza_madrugada
                                      ? "bg-purple-950/60 text-purple-200 border border-purple-500/40 shadow-xs"
                                      : "bg-[#5B50E5]/10 text-[#5B50E5] dark:text-indigo-300 border border-[#5B50E5]/20"
                                  }`}
                                >
                                  {t.cruza_madrugada ? (
                                    <Moon className="w-3 h-3 text-purple-400" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-[#5B50E5]" />
                                  )}
                                  <span>{t.hora_inicio} – {t.hora_fim}</span>
                                  {t.cruza_madrugada && (
                                    <span className="text-[9px] font-sans px-1 rounded bg-purple-500/20 text-purple-300 font-extrabold uppercase">
                                      Madrugada
                                    </span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Bloco Qui / Sex */}
                  <tr className="transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="px-5 py-4 font-bold align-top">
                      <div className="flex items-center gap-1.5 text-[#8B5CF6] font-extrabold">
                        <Calendar className="w-3.5 h-3.5" />
                        Qui / Sex
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        Fechamento semanal
                      </span>
                    </td>
                    {torresEnriquecidas.map((torre) => {
                      const turnosQui = getTurnosDoColaborador(torre.id, "quinta");
                      return (
                        <td key={torre.id} className="px-5 py-4 align-top">
                          <div className="space-y-1.5">
                            {turnosQui.length === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
                                <Coffee className="w-3 h-3 text-slate-400" />
                                Sem escala
                              </span>
                            ) : (
                              turnosQui.map((t) => (
                                <div
                                  key={t.id}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold mr-2 ${
                                    t.cruza_madrugada
                                      ? "bg-purple-950/60 text-purple-200 border border-purple-500/40 shadow-xs"
                                      : "bg-[#5B50E5]/10 text-[#5B50E5] dark:text-indigo-300 border border-[#5B50E5]/20"
                                  }`}
                                >
                                  {t.cruza_madrugada ? (
                                    <Moon className="w-3 h-3 text-purple-400" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-[#5B50E5]" />
                                  )}
                                  <span>{t.hora_inicio} – {t.hora_fim}</span>
                                  {t.cruza_madrugada && (
                                    <span className="text-[9px] font-sans px-1 rounded bg-purple-500/20 text-purple-300 font-extrabold uppercase">
                                      Madrugada
                                    </span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TABELA 2: SÁBADO E DOMINGO (RODÍZIO DE 3 SEMANAS) */}
          <div
            className="coursue-card overflow-hidden rounded-[28px] border shadow-xs"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="p-5 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <CalendarClock className="w-4 h-4 text-[#8B5CF6]" />
                  Sábado e Domingo (Rodízio Cíclico de 3 Semanas)
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Cobertura de fins de semana alternada entre as torres a cada 7 dias
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Info className="w-3.5 h-3.5 text-[#5B50E5]" />
                <span>Linha destacada indica o ciclo ativo nesta semana</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" style={{ color: "var(--text-primary)" }}>
                <thead
                  className="text-[11px] font-black uppercase tracking-wider"
                  style={{
                    backgroundColor: "var(--surface-alt)",
                    color: "var(--text-secondary)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <tr>
                    <th className="px-5 py-3.5 w-44">Semana do Ciclo</th>
                    {torresEnriquecidas.map((torre) => (
                      <th key={torre.id} className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {torre.avatarUrl ? (
                            <img
                              src={torre.avatarUrl}
                              alt={torre.apelido}
                              className="w-5 h-5 rounded-full object-cover border border-purple-500/30 shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                                if (next) next.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-black text-[10px] items-center justify-center uppercase shrink-0 ${
                              torre.avatarUrl ? "hidden" : "flex"
                            }`}
                          >
                            {torre.apelido[0]}
                          </div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate">
                            {torre.apelido}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {([1, 2, 3] as const).map((sem) => {
                    const isCurrent = semanaAtual === sem;
                    const isViewed = semanaVisualizada === sem;

                    return (
                      <tr
                        key={sem}
                        className={`transition-all ${
                          isCurrent
                            ? "bg-purple-500/5 dark:bg-purple-950/20 font-medium"
                            : "hover:bg-black/5 dark:hover:bg-white/5"
                        } ${isViewed ? "ring-1 ring-inset ring-[#8B5CF6]/30" : ""}`}
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                              Semana {sem}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                Atual
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">
                            Sábado & Domingo
                          </span>
                        </td>

                        {torresEnriquecidas.map((torre) => {
                          const turnoSab = getTurnosDoColaborador(torre.id, "sabado", sem);
                          const turnoDom = getTurnosDoColaborador(torre.id, "domingo", sem);

                          return (
                            <td key={torre.id} className="px-5 py-4 align-top">
                              <div className="space-y-1.5">
                                {/* Sábado */}
                                <div className="flex items-center gap-2">
                                  <span className="w-7 text-[11px] font-bold text-slate-400">Sáb:</span>
                                  {turnoSab.length > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                                      <Clock className="w-3 h-3 text-purple-500" />
                                      {turnoSab[0].hora_inicio} – {turnoSab[0].hora_fim}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
                                      <Coffee className="w-3 h-3 text-slate-400" />
                                      Folga
                                    </span>
                                  )}
                                </div>

                                {/* Domingo */}
                                <div className="flex items-center gap-2">
                                  <span className="w-7 text-[11px] font-bold text-slate-400">Dom:</span>
                                  {turnoDom.length > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                      <Clock className="w-3 h-3 text-indigo-500" />
                                      {turnoDom[0].hora_inicio} – {turnoDom[0].hora_fim}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
                                      <Coffee className="w-3 h-3 text-slate-400" />
                                      Folga
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. VISÃO INDIVIDUAL (TORRE) ── */}
      {!isAdminView && minhaTorre && (
        <div className="space-y-8">
          {/* Card de Resumo do Próximo Fim de Semana */}
          {(() => {
            const turnoSabAtual = getTurnosDoColaborador(minhaTorre.id, "sabado", semanaAtual);
            const turnoDomAtual = getTurnosDoColaborador(minhaTorre.id, "domingo", semanaAtual);
            const temPlantaoFimSemana = turnoSabAtual.length > 0 || turnoDomAtual.length > 0;

            return (
              <div
                className="p-6 rounded-[28px] border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                style={{
                  backgroundColor: temPlantaoFimSemana ? "rgba(139, 92, 246, 0.06)" : "rgba(16, 185, 129, 0.06)",
                  borderColor: temPlantaoFimSemana ? "rgba(139, 92, 246, 0.3)" : "rgba(16, 185, 129, 0.3)",
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar do Colaborador */}
                  {minhaTorre.avatarUrl ? (
                    <img
                      src={minhaTorre.avatarUrl}
                      alt={minhaTorre.apelido}
                      className="w-14 h-14 rounded-full object-cover border-2 border-purple-500/40 shadow-sm shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (next) next.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-black text-lg items-center justify-center uppercase shrink-0 ${
                      minhaTorre.avatarUrl ? "hidden" : "flex"
                    }`}
                  >
                    {minhaTorre.apelido[0]}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          temPlantaoFimSemana
                            ? "bg-purple-500/20 text-purple-600 dark:text-purple-300"
                            : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                        }`}
                      >
                        {temPlantaoFimSemana ? "⚡ Plantão neste Fim de Semana" : "🏖️ Fim de Semana Livre"}
                      </span>
                      <span className="text-xs text-slate-400">
                        Ciclo: Semana {semanaAtual} de 3
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                      {temPlantaoFimSemana
                        ? "Você possui turno agendado neste fim de semana"
                        : "Você está 100% de folga no próximo sábado e domingo!"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Fique atento ao registro correto do seu ponto eletrônico durante o expediente.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-border shadow-xs flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Sábado</div>
                      <div className="text-xs font-mono font-black text-slate-800 dark:text-slate-200">
                        {turnoSabAtual.length > 0
                          ? `${turnoSabAtual[0].hora_inicio} – ${turnoSabAtual[0].hora_fim}`
                          : "Folga"}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-border shadow-xs flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Domingo</div>
                      <div className="text-xs font-mono font-black text-slate-800 dark:text-slate-200">
                        {turnoDomAtual.length > 0
                          ? `${turnoDomAtual[0].hora_inicio} – ${turnoDomAtual[0].hora_fim}`
                          : "Folga"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quadro de Expediente Semanal (Segunda a Sexta) */}
          <div
            className="coursue-card p-6 sm:p-7 rounded-[28px] border shadow-xs space-y-5"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Clock className="w-4 h-4 text-[#5B50E5]" />
                Meu Expediente Fixo (Segunda a Sexta)
              </h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Seus horários regulares em cada dia útil da semana
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { dia: "segunda" as DiaSemana, label: "Segunda-feira", short: "Seg" },
                { dia: "terca" as DiaSemana, label: "Terça-feira", short: "Ter" },
                { dia: "quarta" as DiaSemana, label: "Quarta-feira", short: "Qua" },
                { dia: "quinta" as DiaSemana, label: "Quinta-feira", short: "Qui" },
                { dia: "sexta" as DiaSemana, label: "Sexta-feira", short: "Sex" },
              ].map(({ dia, label, short }) => {
                const turnosDia = getTurnosDoColaborador(minhaTorre.id, dia);

                return (
                  <div
                    key={dia}
                    className="p-4 rounded-2xl border flex flex-col justify-between space-y-3 hover:border-[#5B50E5]/50 transition-all"
                    style={{
                      backgroundColor: "var(--surface-alt)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-[#5B50E5]">
                        {short}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Dia útil
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {turnosDia.length === 0 ? (
                        <div className="p-2 rounded-xl text-xs font-medium text-slate-400 flex items-center gap-1">
                          <Coffee className="w-3.5 h-3.5" />
                          <span>Folga</span>
                        </div>
                      ) : (
                        turnosDia.map((t) => (
                          <div
                            key={t.id}
                            className={`p-2 rounded-xl text-xs font-mono font-extrabold flex items-center justify-between ${
                              t.cruza_madrugada
                                ? "bg-purple-950/40 text-purple-200 border border-purple-500/30"
                                : "bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 border border-border"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {t.cruza_madrugada ? (
                                <Moon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-[#5B50E5] shrink-0" />
                              )}
                              <span>{t.hora_inicio} – {t.hora_fim}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meu Rodízio de 3 Semanas (Planejamento Pessoal) */}
          <div
            className="coursue-card p-6 sm:p-7 rounded-[28px] border shadow-xs space-y-5"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <CalendarClock className="w-4 h-4 text-[#8B5CF6]" />
                  Meu Rodízio de Fim de Semana (Ciclo de 3 Semanas)
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Consulte com antecedência suas folgas e plantões nas próximas semanas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([1, 2, 3] as const).map((sem) => {
                const isCurrent = semanaAtual === sem;
                const sab = getTurnosDoColaborador(minhaTorre.id, "sabado", sem);
                const dom = getTurnosDoColaborador(minhaTorre.id, "domingo", sem);

                return (
                  <div
                    key={sem}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
                      isCurrent
                        ? "bg-purple-500/10 border-[#8B5CF6]/50 ring-2 ring-[#8B5CF6]/30"
                        : "bg-surface-alt border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">
                          Semana {sem}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            Semana Atual
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Sábado */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-border">
                        <span className="text-xs font-bold text-slate-500">Sábado</span>
                        {sab.length > 0 ? (
                          <span className="text-xs font-mono font-black text-purple-600 dark:text-purple-400">
                            {sab[0].hora_inicio} – {sab[0].hora_fim}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Coffee className="w-3 h-3" /> Folga
                          </span>
                        )}
                      </div>

                      {/* Domingo */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-border">
                        <span className="text-xs font-bold text-slate-500">Domingo</span>
                        {dom.length > 0 ? (
                          <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                            {dom[0].hora_inicio} – {dom[0].hora_fim}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Coffee className="w-3 h-3" /> Folga
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Caso o usuário não seja Admin e não seja identificado como uma das Torres */}
      {!isAdminView && !minhaTorre && (
        <div
          className="coursue-card p-8 rounded-[28px] border text-center space-y-3"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
            Escala Individual não encontrada
          </h3>
          <p className="text-xs max-w-md mx-auto text-slate-500">
            Seu usuário atual não possui a tag <strong>Torre</strong> atribuída. Caso faça parte da equipe de operações, solicite a atribuição da tag a um administrador.
          </p>
        </div>
      )}
    </div>
  );
};
