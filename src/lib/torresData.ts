import { supabase } from "@/lib/supabase";
import { notifyRealtimeChange } from "@/lib/realtimeSync";

// ==========================================
// 1. PONTOS ELETRÔNICOS
// ==========================================

export interface PontoRegistro {
  id: string;
  colaborador_id: string;
  tipo: "entrada" | "saida";
  timestamp: string;
  criado_em?: string;
}

const STORAGE_KEY_PONTOS = "hashira_pontos_cache_v1";

export function getTodayDateString(): string {
  // Retorna YYYY-MM-DD no horário local
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStoredPontos(): PontoRegistro[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PONTOS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("[PONTOS] Erro ao ler cache local de pontos:", e);
  }
  return [];
}

export function saveStoredPontos(pontos: PontoRegistro[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PONTOS, JSON.stringify(pontos));
  } catch (e) {}
}

export async function fetchPontosDoDia(colaboradorId: string, dataIso?: string): Promise<PontoRegistro[]> {
  const targetDate = dataIso || getTodayDateString();
  const startIso = `${targetDate}T00:00:00.000Z`;
  const endIso = `${targetDate}T23:59:59.999Z`;

  try {
    const { data, error } = await supabase
      .from("pontos")
      .select("*")
      .eq("colaborador_id", colaboradorId)
      .gte("timestamp", startIso)
      .lte("timestamp", endIso)
      .order("timestamp", { ascending: true });

    if (error) {
      console.warn("[PONTOS] Erro ao buscar pontos do dia no Supabase:", error.message);
      return getStoredPontos().filter(
        (p) => p.colaborador_id === colaboradorId && p.timestamp.startsWith(targetDate)
      );
    }

    if (data) {
      // Atualiza cache local mesclando
      const local = getStoredPontos().filter(
        (p) => !(p.colaborador_id === colaboradorId && p.timestamp.startsWith(targetDate))
      );
      saveStoredPontos([...local, ...data]);
      return data as PontoRegistro[];
    }
  } catch (e) {
    console.error("[PONTOS] Exceção ao buscar pontos do dia:", e);
  }

  return getStoredPontos().filter(
    (p) => p.colaborador_id === colaboradorId && p.timestamp.startsWith(targetDate)
  );
}

export async function fetchHistoricoPontos(
  colaboradorId?: string,
  dataInicio?: string,
  dataFim?: string
): Promise<PontoRegistro[]> {
  try {
    let query = supabase.from("pontos").select("*").order("timestamp", { ascending: false });

    if (colaboradorId && colaboradorId !== "todos") {
      query = query.eq("colaborador_id", colaboradorId);
    }
    if (dataInicio) {
      query = query.gte("timestamp", `${dataInicio}T00:00:00.000Z`);
    }
    if (dataFim) {
      query = query.lte("timestamp", `${dataFim}T23:59:59.999Z`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("[PONTOS] Erro ao buscar histórico no Supabase:", error.message);
      return getStoredPontos();
    }
    if (data) {
      return data as PontoRegistro[];
    }
  } catch (e) {
    console.error("[PONTOS] Exceção ao buscar histórico de pontos:", e);
  }
  return getStoredPontos();
}

export async function baterPonto(
  colaboradorId: string,
  tipo: "entrada" | "saida"
): Promise<PontoRegistro | null> {
  const novoPonto: PontoRegistro = {
    id: `pto-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    colaborador_id: colaboradorId,
    tipo,
    timestamp: new Date().toISOString(),
    criado_em: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from("pontos").insert(novoPonto);
    if (error) {
      console.error("[PONTOS] Falha ao registrar ponto no Supabase:", error.message);
    }
  } catch (e) {
    console.error("[PONTOS] Exceção ao bater ponto:", e);
  }

  // Atualiza cache local
  const current = getStoredPontos();
  saveStoredPontos([...current, novoPonto]);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_ponto_updated", { detail: novoPonto }));
    notifyRealtimeChange("ponto", novoPonto);
  }

  return novoPonto;
}

export function verificarEntradaHoje(colaboradorId: string, pontosHoje?: PontoRegistro[]): boolean {
  const lista = pontosHoje || getStoredPontos().filter(
    (p) => p.colaborador_id === colaboradorId && p.timestamp.startsWith(getTodayDateString())
  );
  return lista.some((p) => p.tipo === "entrada");
}

export function calcularTempoExpedienteHoje(pontosHoje: PontoRegistro[]) {
  if (!pontosHoje || pontosHoje.length === 0) {
    return {
      totalMinutos: 0,
      formatado: "0h 00m",
      emExpediente: false,
      ultimaEntrada: undefined,
      ultimaSaida: undefined,
    };
  }

  const ordenados = [...pontosHoje].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let totalMs = 0;
  let ultimaEntradaTime: number | null = null;
  let ultimaEntradaStr: string | undefined = undefined;
  let ultimaSaidaStr: string | undefined = undefined;
  let emExpediente = false;

  for (const p of ordenados) {
    const t = new Date(p.timestamp).getTime();
    if (p.tipo === "entrada") {
      ultimaEntradaTime = t;
      ultimaEntradaStr = p.timestamp;
      emExpediente = true;
    } else if (p.tipo === "saida") {
      if (ultimaEntradaTime !== null) {
        totalMs += Math.max(0, t - ultimaEntradaTime);
        ultimaEntradaTime = null;
      }
      ultimaSaidaStr = p.timestamp;
      emExpediente = false;
    }
  }

  if (emExpediente && ultimaEntradaTime !== null) {
    totalMs += Math.max(0, Date.now() - ultimaEntradaTime);
  }

  const totalMinutos = Math.floor(totalMs / (1000 * 60));
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  const formatado = `${horas}h ${String(minutos).padStart(2, "0")}m`;

  return {
    totalMinutos,
    formatado,
    emExpediente,
    ultimaEntrada: ultimaEntradaStr,
    ultimaSaida: ultimaSaidaStr,
  };
}

// ==========================================
// 2. AGENDA PESSOAL (MENSAL)
// ==========================================

export type TipoAgendaEvento = "reuniao" | "foco" | "entrega" | "alinhamento" | "outro";

export interface AgendaEvento {
  id: string;
  colaborador_id: string;
  data: string; // YYYY-MM-DD
  titulo: string;
  hora_inicio?: string; // HH:mm
  hora_fim?: string; // HH:mm
  tipo: TipoAgendaEvento;
  descricao?: string;
  criado_em?: string;
}

const STORAGE_KEY_AGENDA = "hashira_agenda_cache_v1";

export function getStoredAgenda(): AgendaEvento[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AGENDA);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveStoredAgenda(eventos: AgendaEvento[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_AGENDA, JSON.stringify(eventos));
  } catch (e) {}
}

export async function fetchAgendaEventos(colaboradorId?: string, anoMes?: string): Promise<AgendaEvento[]> {
  try {
    let query = supabase.from("agenda_eventos").select("*").order("data", { ascending: true });

    if (colaboradorId && colaboradorId !== "todos") {
      query = query.eq("colaborador_id", colaboradorId);
    }
    if (anoMes) {
      // anoMes no formato YYYY-MM
      query = query.gte("data", `${anoMes}-01`).lte("data", `${anoMes}-31`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("[AGENDA] Erro ao buscar agenda no Supabase:", error.message);
      return getStoredAgenda();
    }
    if (data) {
      saveStoredAgenda(data as AgendaEvento[]);
      return data as AgendaEvento[];
    }
  } catch (e) {
    console.error("[AGENDA] Exceção ao buscar agenda:", e);
  }
  return getStoredAgenda();
}

export async function saveAgendaEvento(evento: Omit<AgendaEvento, "id"> & { id?: string }): Promise<AgendaEvento | null> {
  const item: AgendaEvento = {
    id: evento.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    colaborador_id: evento.colaborador_id,
    data: evento.data,
    titulo: evento.titulo,
    hora_inicio: evento.hora_inicio || "",
    hora_fim: evento.hora_fim || "",
    tipo: evento.tipo || "outro",
    descricao: evento.descricao || "",
    criado_em: evento.criado_em || new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from("agenda_eventos").upsert(item, { onConflict: "id" });
    if (error) {
      console.error("[AGENDA] Erro ao salvar evento no Supabase:", error.message);
    }
  } catch (e) {
    console.error("[AGENDA] Exceção ao salvar evento:", e);
  }

  const current = getStoredAgenda().filter((e) => e.id !== item.id);
  saveStoredAgenda([...current, item]);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_agenda_updated", { detail: item }));
    notifyRealtimeChange("agenda", item);
  }

  return item;
}

export async function deleteAgendaEvento(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("agenda_eventos").delete().eq("id", id);
    if (error) {
      console.error("[AGENDA] Erro ao excluir evento no Supabase:", error.message);
    }
  } catch (e) {
    console.error("[AGENDA] Exceção ao excluir evento:", e);
  }

  const current = getStoredAgenda().filter((e) => e.id !== id);
  saveStoredAgenda(current);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_agenda_updated", { detail: { id, deleted: true } }));
    notifyRealtimeChange("agenda", { id, deleted: true });
  }

  return true;
}

// ==========================================
// 3. CHECKLIST DIÁRIO
// ==========================================

export interface ChecklistTemplate {
  id: string;
  item: string;
  ordem: number;
  ativo: boolean;
  colaborador_id?: string | null;
  criado_por?: string;
  criado_em?: string;
}

export interface ChecklistItem {
  id: string;
  colaborador_id: string;
  data: string; // YYYY-MM-DD
  item: string;
  concluido: boolean;
  template_id?: string | null;
  criado_em?: string;
}

const STORAGE_KEY_CHECKLIST_TEMPLATES = "hashira_chk_templates_cache_v1";
const STORAGE_KEY_CHECKLIST_ITENS = "hashira_chk_itens_cache_v1";

export async function fetchChecklistTemplates(colaboradorId?: string): Promise<ChecklistTemplate[]> {
  try {
    let query = supabase
      .from("checklist_templates")
      .select("*")
      .order("ordem", { ascending: true });

    if (colaboradorId && colaboradorId !== "todos") {
      query = query.or(`colaborador_id.is.null,colaborador_id.eq.${colaboradorId}`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[CHECKLIST] Erro ao buscar templates:", error.message);
      const raw = localStorage.getItem(STORAGE_KEY_CHECKLIST_TEMPLATES);
      const list: ChecklistTemplate[] = raw ? JSON.parse(raw) : [];
      return colaboradorId && colaboradorId !== "todos"
        ? list.filter((t) => !t.colaborador_id || t.colaborador_id === colaboradorId)
        : list;
    }
    if (data) {
      if (!colaboradorId || colaboradorId === "todos") {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_CHECKLIST_TEMPLATES, JSON.stringify(data));
        }
      }
      return data as ChecklistTemplate[];
    }
  } catch (e) {
    console.error("[CHECKLIST] Exceção ao buscar templates:", e);
  }
  return [];
}

export async function saveChecklistTemplate(
  template: Partial<ChecklistTemplate> & { item: string }
): Promise<ChecklistTemplate | null> {
  const item: ChecklistTemplate = {
    id: template.id || `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    item: template.item,
    ordem: template.ordem ?? 99,
    ativo: template.ativo ?? true,
    colaborador_id: template.colaborador_id || null,
    criado_por: template.criado_por,
    criado_em: template.criado_em || new Date().toISOString(),
  };

  try {
    await supabase.from("checklist_templates").upsert(item, { onConflict: "id" });
  } catch (e) {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_checklist_updated"));
    notifyRealtimeChange("checklist", item);
  }
  return item;
}

export async function deleteChecklistTemplate(id: string): Promise<boolean> {
  try {
    await supabase.from("checklist_templates").delete().eq("id", id);
  } catch (e) {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_checklist_updated"));
    notifyRealtimeChange("checklist", { templateId: id, deleted: true });
  }
  return true;
}

export async function fetchChecklistDoDia(colaboradorId: string, dataIso?: string): Promise<ChecklistItem[]> {
  const targetDate = dataIso || getTodayDateString();

  try {
    // 1. Busca os itens já existentes para o dia
    const { data: itensExistentes, error } = await supabase
      .from("checklist_itens")
      .select("*")
      .eq("colaborador_id", colaboradorId)
      .eq("data", targetDate)
      .order("criado_em", { ascending: true });

    if (error) {
      console.warn("[CHECKLIST] Erro ao buscar itens do dia:", error.message);
    }

    if (itensExistentes && itensExistentes.length > 0) {
      return itensExistentes as ChecklistItem[];
    }

    // 2. Se não houver itens para hoje, replica os templates ativos (reset diário)
    // Traz apenas os itens gerais da empresa + os rituais exclusivos daquela torre
    const templates = await fetchChecklistTemplates(colaboradorId);
    const ativos = templates
      .filter((t) => t.ativo && (!t.colaborador_id || t.colaborador_id === colaboradorId))
      .sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));

    if (ativos.length > 0) {
      const novosItens: ChecklistItem[] = ativos.map((t, idx) => ({
        id: `chk-${targetDate}-${colaboradorId.replace(/[^a-zA-Z0-9]/g, "")}-${idx}-${Date.now()}`,
        colaborador_id: colaboradorId,
        data: targetDate,
        item: t.item,
        concluido: false,
        template_id: t.id,
        criado_em: new Date().toISOString(),
      }));

      // Salva em lote no Supabase
      const { data: inseridos, error: insertErr } = await supabase
        .from("checklist_itens")
        .insert(novosItens)
        .select();

      if (!insertErr && inseridos) {
        return inseridos as ChecklistItem[];
      }
      return novosItens;
    }

    return [];
  } catch (e) {
    console.error("[CHECKLIST] Exceção ao carregar checklist do dia:", e);
    return [];
  }
}

export async function toggleChecklistItem(id: string, concluido: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("checklist_itens")
      .update({ concluido })
      .eq("id", id);

    if (error) {
      console.error("[CHECKLIST] Erro ao atualizar item do checklist:", error.message);
      return false;
    }
  } catch (e) {
    console.error("[CHECKLIST] Exceção ao alternar checklist item:", e);
    return false;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_checklist_updated", { detail: { id, concluido } }));
    notifyRealtimeChange("checklist", { id, concluido });
  }
  return true;
}

export async function createChecklistItemAvulso(
  colaboradorId: string,
  itemTexto: string,
  dataIso?: string
): Promise<ChecklistItem | null> {
  const targetDate = dataIso || getTodayDateString();
  const novoItem: ChecklistItem = {
    id: `chk-avulso-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    colaborador_id: colaboradorId,
    data: targetDate,
    item: itemTexto,
    concluido: false,
    template_id: null,
    criado_em: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from("checklist_itens").insert(novoItem).select().single();
    if (error) {
      console.error("[CHECKLIST] Erro ao criar item avulso:", error.message);
    }
  } catch (e) {
    console.error("[CHECKLIST] Exceção ao criar item avulso:", e);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_checklist_updated", { detail: novoItem }));
    notifyRealtimeChange("checklist", novoItem);
  }
  return novoItem;
}

export async function deleteChecklistItem(id: string): Promise<boolean> {
  try {
    await supabase.from("checklist_itens").delete().eq("id", id);
  } catch (e) {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_checklist_updated", { detail: { id, deleted: true } }));
    notifyRealtimeChange("checklist", { id, deleted: true });
  }
  return true;
}

// ==========================================
// 4. STATUS DE PRESENÇA NO DISCORD
// ==========================================

export interface DiscordStatusItem {
  colaborador_id: string;
  discord_user_id: string;
  em_call: boolean;
  canal_atual: string | null;
  atualizado_em: string;
}

export async function fetchDiscordStatuses(): Promise<DiscordStatusItem[]> {
  try {
    const { data, error } = await supabase.from("discord_status").select("*");
    if (error) {
      console.warn("[DISCORD] Erro ao buscar status do Discord:", error.message);
      return [];
    }
    if (data) {
      return data as DiscordStatusItem[];
    }
  } catch (e) {
    console.error("[DISCORD] Exceção ao buscar status do Discord:", e);
  }
  return [];
}

export async function vincularDiscordUser(colaboradorId: string, discordUserId: string): Promise<boolean> {
  try {
    // 1. Atualiza na tabela usuarios
    await supabase.from("usuarios").update({ discord_user_id: discordUserId }).eq("id", colaboradorId);

    // 2. Inicializa ou atualiza registro em discord_status
    await supabase.from("discord_status").upsert(
      {
        colaborador_id: colaboradorId,
        discord_user_id: discordUserId,
        em_call: false,
        canal_atual: null,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "colaborador_id" }
    );

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hashira_discord_updated"));
      window.dispatchEvent(new CustomEvent("hashira_users_updated"));
      notifyRealtimeChange("discord_status");
      notifyRealtimeChange("usuarios");
    }
    return true;
  } catch (e) {
    console.error("[DISCORD] Erro ao vincular discord_user_id:", e);
    return false;
  }
}

export async function simularDiscordStatus(
  colaboradorId: string,
  emCall: boolean,
  canal: string = "🔊 Sala de Operações #01"
): Promise<boolean> {
  try {
    // Busca discord_user_id do colaborador
    const { data: usr } = await supabase.from("usuarios").select("discord_user_id").eq("id", colaboradorId).single();
    const discordId = usr?.discord_user_id || `sim-${colaboradorId}`;

    await supabase.from("discord_status").upsert(
      {
        colaborador_id: colaboradorId,
        discord_user_id: discordId,
        em_call: emCall,
        canal_atual: emCall ? canal : null,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "colaborador_id" }
    );

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hashira_discord_updated"));
      notifyRealtimeChange("discord_status");
    }
    return true;
  } catch (e) {
    console.error("[DISCORD] Erro ao simular status:", e);
    return false;
  }
}

// ==========================================
// 5. ESCALA SEMANAL DE TURNOS
// ==========================================

export type DiaSemana = "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";

export interface EscalaTurno {
  id: string;
  colaborador_id: string;
  dia_semana: DiaSemana;
  semana_ciclo?: 1 | 2 | 3; // só relevante para sabado/domingo (rodízio); undefined = turno fixo semanal
  hora_inicio: string;      // HH:mm
  hora_fim: string;         // HH:mm
  cruza_madrugada?: boolean;// true para turnos tipo 21:00–01:00
  criado_em?: string;
  atualizado_em?: string;
}

export const STORAGE_KEY_ESCALA = "hashira_escala_cache_v1";

// Segunda-feira âncora da Semana 1 do rodízio (14 de setembro de 2026)
export const ESCALA_RODIZIO_ANCORA = "2026-09-14";

export function getSemanaRodizioAtual(referenceDate = new Date()): 1 | 2 | 3 {
  try {
    const anchor = new Date(ESCALA_RODIZIO_ANCORA + "T00:00:00");
    const target = new Date(referenceDate);
    anchor.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - anchor.getTime();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const diffWeeks = Math.floor(diffMs / oneWeekMs);

    // Módulo 3 seguro mesmo se for data anterior à âncora
    const mod = ((diffWeeks % 3) + 3) % 3;
    return (mod + 1) as 1 | 2 | 3;
  } catch {
    return 1;
  }
}

export function getStoredEscalaTurnos(): EscalaTurno[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ESCALA);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("[ESCALA] Erro ao ler cache local de escala:", e);
  }
  return [];
}

export function saveStoredEscalaTurnos(turnos: EscalaTurno[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ESCALA, JSON.stringify(turnos));
  } catch (e) {}
}

export async function fetchEscalaTurnos(colaboradorId?: string): Promise<EscalaTurno[]> {
  try {
    let query = supabase.from("escala_turnos").select("*").order("hora_inicio", { ascending: true });

    if (colaboradorId && colaboradorId !== "todos") {
      query = query.eq("colaborador_id", colaboradorId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[ESCALA] Erro ao buscar turnos no Supabase:", error.message);
      const local = getStoredEscalaTurnos();
      return colaboradorId && colaboradorId !== "todos"
        ? local.filter((t) => t.colaborador_id === colaboradorId)
        : local;
    }

    if (data) {
      const turnos = data as EscalaTurno[];
      if (!colaboradorId || colaboradorId === "todos") {
        saveStoredEscalaTurnos(turnos);
      }
      return turnos;
    }
  } catch (e) {
    console.error("[ESCALA] Exceção ao buscar escala:", e);
  }

  const fallback = getStoredEscalaTurnos();
  return colaboradorId && colaboradorId !== "todos"
    ? fallback.filter((t) => t.colaborador_id === colaboradorId)
    : fallback;
}

export async function saveEscalaTurno(turno: Partial<EscalaTurno>): Promise<EscalaTurno | null> {
  const id = turno.id || `turno-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const item: EscalaTurno = {
    id,
    colaborador_id: turno.colaborador_id || "",
    dia_semana: turno.dia_semana || "segunda",
    semana_ciclo: turno.semana_ciclo,
    hora_inicio: turno.hora_inicio || "10:00",
    hora_fim: turno.hora_fim || "18:00",
    cruza_madrugada: !!turno.cruza_madrugada,
    atualizado_em: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("escala_turnos")
      .upsert(item, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.warn("[ESCALA] Erro ao salvar turno no Supabase:", error.message);
    } else if (data) {
      const local = getStoredEscalaTurnos().filter((t) => t.id !== id);
      saveStoredEscalaTurnos([...local, data as EscalaTurno]);
    }
  } catch (e) {
    console.error("[ESCALA] Exceção ao salvar turno:", e);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_escala_updated", { detail: item }));
    notifyRealtimeChange("escala");
  }

  return item;
}

export async function deleteEscalaTurno(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("escala_turnos").delete().eq("id", id);
    if (error) {
      console.warn("[ESCALA] Erro ao deletar turno no Supabase:", error.message);
    }
  } catch (e) {
    console.error("[ESCALA] Exceção ao deletar turno:", e);
  }

  const local = getStoredEscalaTurnos().filter((t) => t.id !== id);
  saveStoredEscalaTurnos(local);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_escala_updated"));
    notifyRealtimeChange("escala");
  }

  return true;
}
