"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  X,
  User,
  CheckCircle2,
} from "lucide-react";
import { OperacoesTarefa } from "@/lib/operacoesData";
import {
  AgendaEvento,
  TipoAgendaEvento,
  fetchAgendaEventos,
  saveAgendaEvento,
  deleteAgendaEvento,
} from "@/lib/torresData";
import { getActiveUser, getStoredUsers, UserAccount, getAdminSimulatedRole } from "@/lib/authPermissions";
import { useRealtimeSubscription } from "@/lib/realtimeSync";
import { toast } from "sonner";

interface CalendarioTabProps {
  tarefas: OperacoesTarefa[];
  initialColaboradorId?: string;
}

const TIPO_COLORS: Record<TipoAgendaEvento, { bg: string; text: string; border: string; label: string }> = {
  reuniao: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/25", label: "Reunião" },
  foco: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/25", label: "Foco" },
  entrega: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/25", label: "Entrega" },
  alinhamento: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/25", label: "Alinhamento" },
  outro: { bg: "bg-zinc-500/10", text: "text-zinc-500", border: "border-zinc-500/25", label: "Geral" },
};

export const CalendarioTab: React.FC<CalendarioTabProps> = ({ tarefas, initialColaboradorId }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [selectedColabId, setSelectedColabId] = useState<string>("");
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [agendaEventos, setAgendaEventos] = useState<AgendaEvento[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDayForEvent, setSelectedDayForEvent] = useState<string>("");

  // Formulário do novo evento
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoTipo, setNovoTipo] = useState<TipoAgendaEvento>("reuniao");
  const [novaHoraInicio, setNovaHoraInicio] = useState("10:00");
  const [novaHoraFim, setNovaHoraFim] = useState("11:00");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const active = getActiveUser();
    setCurrentUser(active);
    const users = getStoredUsers();
    setAllUsers(users);

    const initialId = initialColaboradorId || active?.id || "";
    setSelectedColabId(initialId);
  }, [initialColaboradorId]);

  const isAdmin =
    currentUser?.email === "mhvzbusiness@gmail.com" ||
    currentUser?.papel === "administrador";
  const simulated = getAdminSimulatedRole();
  const isAdminView = isAdmin && simulated === "administrador";

  // Mês e Ano atuais
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Carrega eventos da agenda
  const carregarEventos = async () => {
    const anoMes = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const eventos = await fetchAgendaEventos(selectedColabId || undefined, anoMes);
    setAgendaEventos(eventos);
  };

  useEffect(() => {
    if (selectedColabId) {
      carregarEventos();
    }
  }, [selectedColabId, currentYear, currentMonth]);

  useRealtimeSubscription({
    topics: ["agenda"],
    onUpdate: () => carregarEventos(),
  });

  // Navegação do Calendário
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Cálculo da grade do mês
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Domingo
    const lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const lastDateOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Dias do mês anterior para preenchimento
    const prevDays: number[] = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      prevDays.push(lastDateOfPrevMonth - i);
    }

    // Dias do mês atual
    const currentDays = Array.from({ length: lastDateOfMonth }, (_, i) => i + 1);

    // Dias do próximo mês para completar 35 ou 42 células
    const totalCells = Math.ceil((prevDays.length + currentDays.length) / 7) * 7;
    const nextDaysCount = totalCells - (prevDays.length + currentDays.length);
    const nextDays = Array.from({ length: nextDaysCount }, (_, i) => i + 1);

    return { prevDays, currentDays, nextDays };
  }, [currentYear, currentMonth]);

  const daysOfWeek = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

  // Hoje real
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === currentYear && today.getMonth() === currentMonth;
  const todayDateNumber = today.getDate();

  const handleOpenAddEvent = (dayNumber?: number) => {
    const day = dayNumber || (isCurrentMonth ? todayDateNumber : 1);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDayForEvent(dateStr);
    setShowModal(true);
  };

  const handleSalvarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim() || !selectedColabId) return;

    setSaving(true);
    try {
      await saveAgendaEvento({
        colaborador_id: selectedColabId,
        data: selectedDayForEvent,
        titulo: novoTitulo.trim(),
        tipo: novoTipo,
        hora_inicio: novaHoraInicio,
        hora_fim: novaHoraFim,
        descricao: novaDescricao.trim(),
      });
      toast.success("Evento adicionado com sucesso!");
      setShowModal(false);
      setNovoTitulo("");
      setNovaDescricao("");
      await carregarEventos();
    } catch (err) {
      toast.error("Erro ao salvar evento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvento = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Deseja realmente remover este evento da agenda?")) return;
    await deleteAgendaEvento(id);
    toast.success("Evento removido!");
    await carregarEventos();
  };

  return (
    <div className="space-y-6">
      <div className="coursue-card p-6 rounded-[28px] space-y-6 shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        {/* Header do Calendário */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#5B50E5]/15 border border-[#5B50E5]/30 flex items-center justify-center text-[#5B50E5]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {formattedMonthName}
              </h3>
              <p className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>
                Agenda Mensal & Prazos
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Se for admin, seletor de colaborador */}
            {isAdminView && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#5B50E5]" />
                <select
                  value={selectedColabId}
                  onChange={(e) => setSelectedColabId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface-alt)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="todos">Todos os colaboradores</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.comoQuerSerChamado || u.nome} {u.papel === "administrador" ? "👑" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Controles de Navegação */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl transition-colors hover:bg-[#5B50E5]/10 cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleToday}
                className="font-extrabold text-[#5B50E5] px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--brand-light, rgba(91,80,229,0.12))',
                  border: '1px solid rgba(91,80,229,0.2)',
                }}
              >
                Hoje
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl transition-colors hover:bg-[#5B50E5]/10 cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Botão Adicionar Evento */}
            <button
              type="button"
              onClick={() => handleOpenAddEvent()}
              className="px-3.5 py-1.5 rounded-xl bg-[#5B50E5] hover:bg-[#483EA8] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Evento</span>
            </button>
          </div>
        </div>

        {/* Grade do Calendário */}
        <div className="space-y-2">
          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {daysOfWeek.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Células de Dias */}
          <div className="grid grid-cols-7 gap-2">
            {/* Dias do Mês Anterior */}
            {calendarGrid.prevDays.map((d) => (
              <div
                key={`prev-${d}`}
                className="min-h-[105px] rounded-2xl p-2 text-xs font-bold opacity-30 select-none flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <span>{d}</span>
              </div>
            ))}

            {/* Dias do Mês Atual */}
            {calendarGrid.currentDays.map((d) => {
              const isToday = isCurrentMonth && d === todayDateNumber;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

              // Tarefas daquele dia para o colaborador filtrado
              const tasksOnDay = tarefas.filter((t) => {
                const matchDate = t.dataEntrega === dateStr;
                const matchColab =
                  !selectedColabId ||
                  selectedColabId === "todos" ||
                  t.membro?.id === selectedColabId;
                return matchDate && matchColab;
              });

              // Eventos da agenda daquele dia
              const eventsOnDay = agendaEventos.filter((ev) => ev.data === dateStr);

              return (
                <div
                  key={`curr-${d}`}
                  onClick={() => handleOpenAddEvent(d)}
                  className={`min-h-[105px] rounded-2xl p-2 text-xs font-bold transition-all relative flex flex-col justify-between group cursor-pointer hover:border-[#5B50E5]/60 hover:shadow-md ${
                    isToday ? "border-[#5B50E5] shadow-sm" : ""
                  }`}
                  style={{
                    backgroundColor: isToday
                      ? 'var(--brand-light, rgba(91,80,229,0.08))'
                      : 'var(--surface-alt)',
                    border: isToday ? '2px solid #5B50E5' : '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        isToday ? "bg-[#5B50E5] text-white" : ""
                      }`}
                      style={{ color: isToday ? "#FFFFFF" : "var(--text-primary)" }}
                    >
                      {d}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddEvent(d);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[#5B50E5] hover:bg-[#5B50E5]/15 transition-all"
                      title="Adicionar evento"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Lista de itens no dia */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {/* Eventos da Agenda */}
                    {eventsOnDay.map((ev) => {
                      const cfg = TIPO_COLORS[ev.tipo] || TIPO_COLORS.outro;
                      return (
                        <div
                          key={ev.id}
                          className={`p-1 rounded-lg border text-[9px] font-bold flex items-center justify-between gap-1 truncate ${cfg.bg} ${cfg.text} ${cfg.border}`}
                          title={`${ev.hora_inicio ? `[${ev.hora_inicio}] ` : ""}${ev.titulo}`}
                        >
                          <span className="truncate">
                            {ev.hora_inicio && <span className="opacity-80 mr-0.5">{ev.hora_inicio}</span>}
                            {ev.titulo}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteEvento(ev.id, e)}
                            className="opacity-0 group-hover:opacity-100 hover:text-rose-500 p-0.5"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Tarefas Operacionais com Prazo */}
                    {tasksOnDay.map((t) => (
                      <div
                        key={t.id}
                        className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[9px] font-extrabold text-amber-500 uppercase truncate"
                        title={`Tarefa: ${t.titulo}`}
                      >
                        📌 {t.titulo}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Dias do Próximo Mês */}
            {calendarGrid.nextDays.map((d) => (
              <div
                key={`next-${d}`}
                className="min-h-[105px] rounded-2xl p-2 text-xs font-bold opacity-30 select-none flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <span>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Novo Evento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 relative"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                Novo Evento na Agenda
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-500/15 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarEvento} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Data
                </label>
                <input
                  type="date"
                  value={selectedDayForEvent}
                  onChange={(e) => setSelectedDayForEvent(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors outline-none"
                  style={{
                    backgroundColor: "var(--surface-alt)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Título do Evento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reunião de Alinhamento de Copy"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors outline-none"
                  style={{
                    backgroundColor: "var(--surface-alt)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                    Início
                  </label>
                  <input
                    type="time"
                    value={novaHoraInicio}
                    onChange={(e) => setNovaHoraInicio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors outline-none"
                    style={{
                      backgroundColor: "var(--surface-alt)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                    Fim
                  </label>
                  <input
                    type="time"
                    value={novaHoraFim}
                    onChange={(e) => setNovaHoraFim(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors outline-none"
                    style={{
                      backgroundColor: "var(--surface-alt)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Tipo de Evento
                </label>
                <select
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value as TipoAgendaEvento)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors outline-none cursor-pointer"
                  style={{
                    backgroundColor: "var(--surface-alt)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="reuniao">Reunião</option>
                  <option value="foco">Bloco de Foco</option>
                  <option value="entrega">Entrega / Deadline</option>
                  <option value="alinhamento">Alinhamento Rápido</option>
                  <option value="outro">Geral / Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Descrição (Opcional)
                </label>
                <textarea
                  placeholder="Detalhes, pautas ou links importantes..."
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors outline-none resize-none"
                  style={{
                    backgroundColor: "var(--surface-alt)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  style={{
                    backgroundColor: "var(--surface-alt)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#5B50E5] hover:bg-[#483EA8] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar Evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
