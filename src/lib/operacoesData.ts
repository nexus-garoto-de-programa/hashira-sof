export type ColumnStatus = "nao_iniciado" | "em_andamento" | "revisao" | "concluido";
export type PrioridadeTarefa = "baixa" | "media" | "alta" | "urgente";

export interface TeamMember {
  id: string;
  initials: string;
  name: string;
  color: string;
  avatarBg: string;
  avatarUrl?: string;
  email?: string;
}

export interface KanbanColumnConfig {
  id: ColumnStatus;
  label: string;
  dotColor: string;
}

export const DEFAULT_KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { id: "nao_iniciado", label: "Não iniciado", dotColor: "#8B5CF6" },
  { id: "em_andamento", label: "Em andamento", dotColor: "#3B82F6" },
  { id: "revisao", label: "Revisão", dotColor: "#D97706" },
  { id: "concluido", label: "Concluído", dotColor: "#16A34A" },
];

export interface OperacoesSetor {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  capaUrl?: string;
  totalTarefas: number;
  concluidas: number;
  pendentes: number;
}

export interface OperacoesProjeto {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  donoId?: string;
  donoNome?: string;
  setorId?: string;
  setorNome?: string;
  colunas?: KanbanColumnConfig[];
  totalTarefas: number;
  concluidas: number;
  tarefasTítulos: string[];
  criadoEm?: string;
}

export interface OperacoesTarefa {
  id: string;
  titulo: string;
  descricao?: string;
  setorId: string;
  setorNome: string;
  status: ColumnStatus;
  prioridade?: PrioridadeTarefa;
  ordem?: number;
  atrasoDias?: number;
  membro: TeamMember;
  dataEntrega: string;
  horarioEntrega?: string;
  projetoId?: string;
  projetoNome?: string;
  criadoEm?: string;
}

export interface ActivityLog {
  id: string;
  membroInitials: string;
  membroColor: string;
  membroNome: string;
  acao: string;
  tarefaTitulo: string;
  tempoAtras: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "m-mh", initials: "MH", name: "Matheus Henrique", color: "#3B82F6", avatarBg: "#3B82F6" },
  { id: "m-g", initials: "G", name: "Guardian TV", color: "#EAB308", avatarBg: "#EAB308" },
  { id: "m-sd", initials: "SD", name: "Sensei Design", color: "#22C55E", avatarBg: "#22C55E" },
  { id: "m-j", initials: "J", name: "Júnio Member", color: "#A855F7", avatarBg: "#A855F7" },
];

export const SETORES_OPERACOES: OperacoesSetor[] = [
  {
    id: "sec-funil",
    nome: "Estrutura de Funil",
    descricao: "Arquitetura de landing pages, checkout, automações e VSL",
    icone: "Layers",
    totalTarefas: 0,
    concluidas: 0,
    pendentes: 0,
  },
  {
    id: "sec-marketing",
    nome: "Marketing",
    descricao: "Aquisição de tráfego, gestão de mídia e branding",
    icone: "Sparkles",
    totalTarefas: 0,
    concluidas: 0,
    pendentes: 0,
  },
  {
    id: "sec-posvenda",
    nome: "Pós-venda, Suporte e Atendimento ao Cliente",
    descricao: "Atendimento direto, suporte técnico e retenção",
    icone: "Headphones",
    totalTarefas: 0,
    concluidas: 0,
    pendentes: 0,
  },
  {
    id: "sec-servicos",
    nome: "Serviços",
    descricao: "Prestação de serviços operacionais e execução técnica",
    icone: "Briefcase",
    totalTarefas: 0,
    concluidas: 0,
    pendentes: 0,
  },
  {
    id: "sec-produtos",
    nome: "Produtos",
    descricao: "Desenvolvimento e aprimoramento de produtos e ofertas",
    icone: "Package",
    totalTarefas: 0,
    concluidas: 0,
    pendentes: 0,
  },
  {
    id: "sec-discord",
    nome: "Discord",
    descricao: "Moderação de comunidade, eventos e cargos",
    icone: "MessageSquare",
    totalTarefas: 0,
    concluidas: 0,
    pendentes: 0,
  },
  {
    id: "design",
    nome: "Design & Peças Gráficas",
    descricao: "Banners, identidade visual e materiais publicitários",
    icone: "Palette",
    capaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    totalTarefas: 0,
    concluidas: 0,
    pendentes: 0,
  },
  {
    id: "editores",
    nome: "Editores & Cortes",
    descricao: "Cortes, edições e finalizações de vídeo",
    icone: "Scissors",
    totalTarefas: 0,
    concluidas: 0,
    pendentes: 0,
  },
  {
    id: "torres",
    nome: "Torres & Operações",
    descricao: "Estrutura, operação e suporte das torres",
    icone: "Building",
    capaUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
    totalTarefas: 0,
    concluidas: 0,
    pendentes: 0,
  },
];

export const PROJETOS_OPERACOES_SEED: OperacoesProjeto[] = [
  {
    id: "proj-geral",
    nome: "Geral & Demandas Avulsas",
    descricao: "Projeto padrão para tarefas e demandas sem projeto específico.",
    cor: "#8B5CF6",
    totalTarefas: 0,
    concluidas: 0,
    tarefasTítulos: [],
    criadoEm: new Date().toISOString(),
  },
];

export const TAREFAS_OPERACOES_SEED: OperacoesTarefa[] = [];
export const ACTIVITIES_SEED: ActivityLog[] = [];

const STORAGE_KEY_OPER_TAREFAS = "central_operacoes_tarefas_v4";
const STORAGE_KEY_OPER_PROJETOS = "central_operacoes_projetos_v4";
const STORAGE_KEY_OPER_SETORES = "central_operacoes_setores_v4";

import { supabase } from "@/lib/supabase";

export function mapSupabaseRowToOperacoesTarefa(row: any): OperacoesTarefa {
  const isUrlAvatar = typeof row.responsavel_avatar === "string" && (row.responsavel_avatar.startsWith("http") || row.responsavel_avatar.startsWith("data:") || row.responsavel_avatar.startsWith("/"));

  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao || "",
    setorId: row.setor_id || "sec-funil",
    setorNome: row.setor_nome || "Estrutura de Funil",
    status: row.status || "nao_iniciado",
    prioridade: row.prioridade || "media",
    ordem: row.ordem ?? 0,
    atrasoDias: row.atraso_dias ?? 0,
    membro: {
      id: row.responsavel_id || "m-mh",
      initials: row.responsavel_nome ? row.responsavel_nome.substring(0, 2).toUpperCase() : "MH",
      name: row.responsavel_nome || "Matheus Henrique",
      color: isUrlAvatar ? "#5B50E5" : row.responsavel_avatar || "#3B82F6",
      avatarBg: isUrlAvatar ? "#5B50E5" : row.responsavel_avatar || "#3B82F6",
      avatarUrl: isUrlAvatar ? row.responsavel_avatar : undefined,
    },
    dataEntrega: row.prazo || new Date().toISOString().split("T")[0],
    projetoId: row.projeto_id,
    projetoNome: row.projeto_nome,
    criadoEm: row.criado_em,
  };
}

export function mapOperacoesTarefaToSupabaseRow(t: OperacoesTarefa) {
  return {
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    status: t.status,
    prioridade: t.prioridade || "media",
    setor_id: t.setorId,
    setor_nome: t.setorNome,
    responsavel_id: t.membro?.id,
    responsavel_nome: t.membro?.name,
    responsavel_avatar: t.membro?.avatarUrl || t.membro?.color || "#5B50E5",
    prazo: t.dataEntrega,
  };
}

export async function fetchOperacoesTarefasFromSupabase(): Promise<OperacoesTarefa[]> {
  try {
    const { data, error } = await supabase.from("operacoes_tarefas").select("*");
    if (error) {
      console.warn("[SUPABASE WARN] Falha ao ler operacoes_tarefas, usando localStorage:", error.message);
      return getStoredOperacoesTarefas();
    }
    if (data) {
      const tarefas = data.map(mapSupabaseRowToOperacoesTarefa);
      // Mescla com dados adicionais salvos localmente (ex: projetoId, ordem)
      const stored = getStoredOperacoesTarefas();
      const storedMap = new Map(stored.map((t) => [t.id, t]));

      const merged = tarefas.map((remoteT) => {
        const local = storedMap.get(remoteT.id);
        return {
          ...remoteT,
          projetoId: local?.projetoId || remoteT.projetoId,
          projetoNome: local?.projetoNome || remoteT.projetoNome,
          horarioEntrega: local?.horarioEntrega || remoteT.horarioEntrega,
          ordem: local?.ordem ?? remoteT.ordem ?? 0,
        };
      });

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY_OPER_TAREFAS, JSON.stringify(merged));
        } catch (e) {}
      }
      return merged;
    }
  } catch (e) {
    console.error("[SUPABASE ERROR] Exceção ao buscar operacoes_tarefas:", e);
  }
  return getStoredOperacoesTarefas();
}

import { notifyRealtimeChange } from "@/lib/realtimeSync";

export async function saveOperacoesTarefaToSupabase(tarefa: OperacoesTarefa): Promise<boolean> {
  try {
    const row = mapOperacoesTarefaToSupabaseRow(tarefa);
    const { error } = await supabase.from("operacoes_tarefas").upsert(row, { onConflict: "id" });
    if (error) {
      console.error("[SUPABASE ERROR] Falha ao salvar operacoes_tarefa no Supabase:", error.message);
    }
  } catch (e) {
    console.error("[SUPABASE ERROR] Exceção ao salvar operacoes_tarefa:", e);
  }
  const current = getStoredOperacoesTarefas();
  const updated = [tarefa, ...current.filter((t) => t.id !== tarefa.id)];
  saveStoredOperacoesTarefas(updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_operacoes_tarefas_updated"));
    window.dispatchEvent(new CustomEvent("hashira_demandas_updated"));
    notifyRealtimeChange("tarefas", tarefa);
    notifyRealtimeChange("demandas", tarefa);
  }
  return true;
}

export async function updateTarefaStatusEOrdem(
  tarefaId: string,
  novoStatus: ColumnStatus,
  novaOrdem: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("operacoes_tarefas")
      .update({ status: novoStatus })
      .eq("id", tarefaId);

    if (error) {
      console.error("[SUPABASE ERROR] Falha ao atualizar status da tarefa no Supabase:", error.message);
      return false;
    }
  } catch (e) {
    console.error("[SUPABASE ERROR] Exceção ao atualizar status da tarefa:", e);
    return false;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_operacoes_tarefas_updated"));
    window.dispatchEvent(new CustomEvent("hashira_demandas_updated"));
    notifyRealtimeChange("tarefas", { id: tarefaId, status: novoStatus, ordem: novaOrdem });
    notifyRealtimeChange("demandas", { id: tarefaId, status: novoStatus });
  }
  return true;
}

export async function deleteOperacoesTarefaFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("operacoes_tarefas").delete().eq("id", id);
    if (error) {
      console.error("[SUPABASE ERROR] Falha ao deletar operacoes_tarefa:", error.message);
    }
  } catch (e) {
    console.error("[SUPABASE ERROR] Exceção ao deletar operacoes_tarefa:", e);
  }
  const current = getStoredOperacoesTarefas();
  const updated = current.filter((t) => t.id !== id);
  saveStoredOperacoesTarefas(updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_operacoes_tarefas_updated"));
    window.dispatchEvent(new CustomEvent("hashira_demandas_updated"));
    notifyRealtimeChange("tarefas", { id });
    notifyRealtimeChange("demandas", { id });
  }
  return true;
}

export async function fetchOperacoesSetoresFromSupabase(): Promise<OperacoesSetor[]> {
  try {
    const { data, error } = await supabase.from("operacoes_setores").select("*");
    if (error) {
      console.warn("[SUPABASE WARN] Falha ao ler operacoes_setores, usando localStorage:", error.message);
      return getStoredOperacoesSetores();
    }
    if (data && data.length > 0) {
      const setoresMapped: OperacoesSetor[] = data.map((s: any) => ({
        id: s.id,
        nome: s.nome,
        descricao: s.descricao || "",
        icone: s.icone || "Layers",
        capaUrl: s.capa_url || undefined,
        totalTarefas: s.total_tarefas ?? 0,
        concluidas: s.concluidas ?? 0,
        pendentes: s.pendentes ?? 0,
      }));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY_OPER_SETORES, JSON.stringify(setoresMapped));
        } catch (e) {}
      }
      return setoresMapped;
    }
  } catch (e) {
    console.error("[SUPABASE ERROR] Exceção ao buscar operacoes_setores:", e);
  }
  return getStoredOperacoesSetores();
}

export async function saveOperacoesSetorToSupabase(setor: OperacoesSetor): Promise<boolean> {
  try {
    const row = {
      id: setor.id,
      nome: setor.nome,
      descricao: setor.descricao,
      icone: setor.icone,
      capa_url: setor.capaUrl,
      total_tarefas: setor.totalTarefas,
      concluidas: setor.concluidas,
      pendentes: setor.pendentes,
    };
    const { error } = await supabase.from("operacoes_setores").upsert(row, { onConflict: "id" });
    if (error) {
      console.error("[SUPABASE ERROR] Falha ao salvar operacoes_setor no Supabase:", error.message);
    }
  } catch (e) {
    console.error("[SUPABASE ERROR] Exceção ao salvar operacoes_setor:", e);
  }
  const current = getStoredOperacoesSetores();
  const updated = current.map((s) => (s.id === setor.id ? setor : s));
  saveStoredOperacoesSetores(updated);
  window.dispatchEvent(new CustomEvent("hashira_operacoes_setores_updated"));
  return true;
}

export function getStoredOperacoesSetores(): OperacoesSetor[] {
  if (typeof window === "undefined") return SETORES_OPERACOES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPER_SETORES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= SETORES_OPERACOES.length) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao carregar setores da Central de Operações", e);
  }
  localStorage.setItem(STORAGE_KEY_OPER_SETORES, JSON.stringify(SETORES_OPERACOES));
  return SETORES_OPERACOES;
}

export function saveStoredOperacoesSetores(setores: OperacoesSetor[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_OPER_SETORES, JSON.stringify(setores));
    window.dispatchEvent(new CustomEvent("hashira_operacoes_setores_updated"));
    notifyRealtimeChange("setores", setores);
  } catch (e) {
    console.error("Erro ao salvar setores da Central de Operações", e);
  }
}

export function getStoredOperacoesTarefas(): OperacoesTarefa[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPER_TAREFAS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao carregar tarefas da Central de Operações", e);
  }
  return [];
}

export function saveStoredOperacoesTarefas(tarefas: OperacoesTarefa[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_OPER_TAREFAS, JSON.stringify(tarefas));
    window.dispatchEvent(new CustomEvent("hashira_operacoes_tarefas_updated"));
    notifyRealtimeChange("tarefas", tarefas);
    notifyRealtimeChange("demandas", tarefas);
  } catch (e) {
    console.error("Erro ao salvar tarefas da Central de Operações", e);
  }
}

export function getStoredOperacoesProjetos(): OperacoesProjeto[] {
  if (typeof window === "undefined") return PROJETOS_OPERACOES_SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPER_PROJETOS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao carregar projetos da Central de Operações", e);
  }
  localStorage.setItem(STORAGE_KEY_OPER_PROJETOS, JSON.stringify(PROJETOS_OPERACOES_SEED));
  return PROJETOS_OPERACOES_SEED;
}

export function saveStoredOperacoesProjetos(projetos: OperacoesProjeto[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_OPER_PROJETOS, JSON.stringify(projetos));
    window.dispatchEvent(new CustomEvent("hashira_operacoes_projetos_updated"));
    notifyRealtimeChange("projetos", projetos);
  } catch (e) {
    console.error("Erro ao salvar projetos da Central de Operações", e);
  }
}

export function recalculateProjectCounters(
  projetos: OperacoesProjeto[],
  tarefas: OperacoesTarefa[]
): OperacoesProjeto[] {
  return projetos.map((proj) => {
    const tarefasDoProjeto = tarefas.filter(
      (t) => t.projetoId === proj.id || (!t.projetoId && proj.id === "proj-geral")
    );
    const totalTarefas = tarefasDoProjeto.length;
    const concluidas = tarefasDoProjeto.filter((t) => t.status === "concluido").length;
    const tarefasTítulos = tarefasDoProjeto.slice(0, 5).map((t) => t.titulo);

    return {
      ...proj,
      totalTarefas,
      concluidas,
      tarefasTítulos,
    };
  });
}
