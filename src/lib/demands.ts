export type Prioridade = "baixa" | "media" | "alta" | "urgente";
export type StatusDemanda = "pendente" | "em_andamento" | "concluida" | "atrasada";
export type TipoAnexo = "imagem" | "video" | "link";

export interface Anexo {
  id: string;
  tipo: TipoAnexo;
  titulo: string;
  url: string;
}

export interface HistoricoItem {
  id: string;
  usuarioNome: string;
  acao: string;
  data: string;
  comentario?: string;
}

export interface SetorHashira {
  id: string;
  nome: string;
  slug: string;
  membrosReferencia: string[];
  cor: string;
  badgeBg: string;
  badgeText: string;
  icone: string;
  descricao: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: "colaborador" | "administrador";
  setorId: string;
  setorNome: string;
  statusConta: "ativo" | "pendente_aprovacao";
  avatarUrl: string;
  criadoEm: string;
}

export interface Demanda {
  id: string;
  titulo: string;
  descricao: string;
  setorId: string;
  setorNome: string;
  criadoPor: string;
  colaboradorId?: string;
  colaboradorNome?: string;
  colaboradorEmail?: string; // chave estável para matching confiável
  colaboradorAvatar?: string;
  prazo: string; // YYYY-MM-DD
  prioridade: Prioridade;
  status: StatusDemanda;
  progresso: number; // 0 a 100
  anexos: Anexo[];
  historico: HistoricoItem[];
  criadoEm: string;
}

// ── SEED OFICIAL DOS 6 DEPARTAMENTOS HASHIRAS ──
export const HASHIRAS_SEED: SetorHashira[] = [
  {
    id: "sec-marketing",
    nome: "Marketing",
    slug: "marketing",
    membrosReferencia: [],
    cor: "#C2185B",
    badgeBg: "#FCE4EC",
    badgeText: "#C2185B",
    icone: "Sparkles",
    descricao: "Aquisição de tráfego, gestão de mídia paga, estratégias de crescimento e branding.",
  },
  {
    id: "sec-funil",
    nome: "Estrutura de Funil",
    slug: "estrutura-de-funil",
    membrosReferencia: [],
    cor: "#5E35B1",
    badgeBg: "#EDE7F6",
    badgeText: "#5E35B1",
    icone: "Layers",
    descricao: "Arquitetura de landing pages, checkout, automações de vendas e otimização de conversão.",
  },
  {
    id: "sec-posvenda",
    nome: "Pós-venda, Suporte e Atendimento ao Cliente",
    slug: "pos-venda-suporte",
    membrosReferencia: [],
    cor: "#00838F",
    badgeBg: "#E0F7FA",
    badgeText: "#00838F",
    icone: "Headphones",
    descricao: "Atendimento direto ao cliente, suporte técnico, retenção e satisfação da base.",
  },
  {
    id: "sec-servicos",
    nome: "Serviços",
    slug: "servicos",
    membrosReferencia: [],
    cor: "#0369A1",
    badgeBg: "#E0F2FE",
    badgeText: "#0369A1",
    icone: "Briefcase",
    descricao: "Prestação de serviços operacionais, onboarding e execução técnica dos projetos.",
  },
  {
    id: "sec-produtos",
    nome: "Produtos",
    slug: "produtos",
    membrosReferencia: [],
    cor: "#D97706",
    badgeBg: "#FEF3C7",
    badgeText: "#D97706",
    icone: "Package",
    descricao: "Desenvolvimento e aprimoramento de produtos, ofertas e conteúdo educacional.",
  },
  {
    id: "sec-discord",
    nome: "Discord",
    slug: "discord",
    membrosReferencia: [],
    cor: "#15803D",
    badgeBg: "#DCFCE7",
    badgeText: "#15803D",
    icone: "MessageSquare",
    descricao: "Moderação da comunidade, eventos ao vivo, cargos e engajamento dos membros.",
  },
];

// Seed Inicial de Demandas Zerada por solicitação do usuário
export const DEMANDAS_SEED: Demanda[] = [];

const STORAGE_KEY_DEMANDAS = "hashira_cascade_demandas_v3";
const STORAGE_KEY_SETORES = "hashira_cascade_setores_v3";
const STORAGE_KEY_USUARIOS = "hashira_cascade_usuarios_v3";
const STORAGE_CLEARED_FLAG = "hashira_cascade_demandas_cleared_v3";

import { supabase } from "@/lib/supabase";

export function mapOperacoesRowToDemanda(row: any): Demanda {
  let statusDemanda: StatusDemanda = "pendente";
  let progresso = 0;
  const s = row.status || "nao_iniciado";

  if (s === "concluido") {
    statusDemanda = "concluida";
    progresso = 100;
  } else if (s === "revisao") {
    statusDemanda = "em_andamento";
    progresso = 85;
  } else if (s === "em_andamento") {
    statusDemanda = "em_andamento";
    progresso = 50;
  } else {
    statusDemanda = "pendente";
    progresso = 0;
  }

  // Verifica atraso se o prazo expirou e não está concluída
  const hojeStr = new Date().toISOString().split("T")[0];
  if (s !== "concluido" && row.prazo && row.prazo < hojeStr) {
    statusDemanda = "atrasada";
  }

  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao || "",
    setorId: row.setor_id || "sec-funil",
    setorNome: row.setor_nome || "Estrutura de Funil",
    criadoPor: "Central de Operações",
    colaboradorId: row.responsavel_id,
    colaboradorNome: row.responsavel_nome,
    colaboradorEmail: row.responsavel_email || undefined,
    colaboradorAvatar: row.responsavel_avatar || undefined,
    prazo: row.prazo || hojeStr,
    prioridade: (row.prioridade as Prioridade) || "media",
    status: statusDemanda,
    progresso,
    anexos: Array.isArray(row.anexos) ? row.anexos : [],
    historico: Array.isArray(row.historico) ? row.historico : [],
    criadoEm: row.criado_em || new Date().toISOString(),
  };
}

export function mapSupabaseRowToDemanda(row: any): Demanda {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao || "",
    setorId: row.setor_id || row.setorId || "sec-funil",
    setorNome: row.setor_nome || row.setorNome || "Estrutura de Funil",
    criadoPor: row.criado_por || row.criadoPor || "Administrador",
    colaboradorId: row.colaborador_id || row.colaboradorId,
    colaboradorNome: row.colaborador_nome || row.colaboradorNome,
    colaboradorEmail: row.colaborador_email || row.colaboradorEmail,
    colaboradorAvatar: row.colaborador_avatar || row.colaboradorAvatar,
    prazo: row.prazo || new Date().toISOString().split("T")[0],
    prioridade: row.prioridade || "media",
    status: row.status || "pendente",
    progresso: row.progresso ?? 0,
    anexos: Array.isArray(row.anexos) ? row.anexos : [],
    historico: Array.isArray(row.historico) ? row.historico : [],
    criadoEm: row.criado_em || row.criadoEm || new Date().toISOString(),
  };
}

export function mapDemandaToSupabaseRow(d: Demanda) {
  return {
    id: d.id,
    titulo: d.titulo,
    descricao: d.descricao,
    setor_id: d.setorId,
    setor_nome: d.setorNome,
    criado_por: d.criadoPor,
    colaborador_id: d.colaboradorId,
    colaborador_nome: d.colaboradorNome,
    colaborador_email: d.colaboradorEmail,
    colaborador_avatar: d.colaboradorAvatar,
    prazo: d.prazo,
    prioridade: d.prioridade,
    status: d.status,
    progresso: d.progresso,
    anexos: d.anexos,
    historico: d.historico,
  };
}

export async function fetchDemandasFromSupabase(): Promise<Demanda[]> {
  try {
    // 1. Busca da tabela primária unificada 'operacoes_tarefas'
    const { data: operData, error: operErr } = await supabase
      .from("operacoes_tarefas")
      .select("*")
      .order("criado_em", { ascending: false });

    // 2. Busca também da tabela legada 'demandas' para não perder registros históricos
    const { data: legData } = await supabase.from("demandas").select("*");

    const demandasMap = new Map<string, Demanda>();

    // Mapeia registros legados
    if (legData && legData.length > 0) {
      legData.forEach((row) => {
        const d = mapSupabaseRowToDemanda(row);
        demandasMap.set(d.id, d);
      });
    }

    // Mapeia registros da Central de Operações (prioridade mais alta)
    if (operData && operData.length > 0) {
      operData.forEach((row) => {
        const d = mapOperacoesRowToDemanda(row);
        demandasMap.set(d.id, d);
      });
    }

    const unificadas = Array.from(demandasMap.values());

    if (unificadas.length > 0) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY_DEMANDAS, JSON.stringify(unificadas));
        } catch (e) {}
      }
      return unificadas;
    }
  } catch (e) {
    console.error("[SUPABASE ERROR] Exceção ao buscar demandas:", e);
  }
  return getStoredDemandas();
}

import { notifyRealtimeChange } from "@/lib/realtimeSync";

export async function saveDemandaToSupabase(demanda: Demanda): Promise<boolean> {
  try {
    // Mapeia status para operacoes_tarefas
    let operStatus = "nao_iniciado";
    if (demanda.status === "concluida") operStatus = "concluido";
    else if (demanda.status === "em_andamento" || demanda.status === "atrasada") operStatus = "em_andamento";

    // 1. Salva/Atualiza em operacoes_tarefas
    await supabase.from("operacoes_tarefas").upsert(
      {
        id: demanda.id,
        titulo: demanda.titulo,
        descricao: demanda.descricao,
        status: operStatus,
        prioridade: demanda.prioridade,
        setor_id: demanda.setorId,
        setor_nome: demanda.setorNome,
        responsavel_id: demanda.colaboradorId,
        responsavel_nome: demanda.colaboradorNome,
        responsavel_avatar: demanda.colaboradorAvatar,
        prazo: demanda.prazo,
      },
      { onConflict: "id" }
    );

    // 2. Salva em demandas
    const row = mapDemandaToSupabaseRow(demanda);
    await supabase.from("demandas").upsert(row, { onConflict: "id" });
  } catch (e) {
    console.error("[SUPABASE ERROR] Exceção ao salvar demanda:", e);
  }

  const current = getStoredDemandas();
  const updated = [demanda, ...current.filter((d) => d.id !== demanda.id)];
  saveStoredDemandas(updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_demandas_updated"));
    window.dispatchEvent(new CustomEvent("hashira_operacoes_tarefas_updated"));
    notifyRealtimeChange("demandas", demanda);
    notifyRealtimeChange("tarefas", demanda);
  }
  return true;
}

export async function deleteDemandaFromSupabase(id: string): Promise<boolean> {
  try {
    await supabase.from("operacoes_tarefas").delete().eq("id", id);
    await supabase.from("demandas").delete().eq("id", id);
  } catch (e) {
    console.error("[SUPABASE ERROR] Exceção ao deletar demanda:", e);
  }
  const current = getStoredDemandas();
  const updated = current.filter((d) => d.id !== id);
  saveStoredDemandas(updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_demandas_updated"));
    window.dispatchEvent(new CustomEvent("hashira_operacoes_tarefas_updated"));
    notifyRealtimeChange("demandas", { id });
    notifyRealtimeChange("tarefas", { id });
  }
  return true;
}

export function getStoredDemandas(): Demanda[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEMANDAS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao ler demandas", e);
  }
  return [];
}

export function saveStoredDemandas(demandas: Demanda[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_DEMANDAS, JSON.stringify(demandas));
    window.dispatchEvent(new CustomEvent("hashira_demandas_updated"));
  } catch (e) {
    console.error("Erro ao salvar demandas", e);
  }
}

export function getStoredSetores(): SetorHashira[] {
  if (typeof window === "undefined") return HASHIRAS_SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETORES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao ler setores", e);
  }
  localStorage.setItem(STORAGE_KEY_SETORES, JSON.stringify(HASHIRAS_SEED));
  return HASHIRAS_SEED;
}

export function saveStoredSetores(setores: SetorHashira[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_SETORES, JSON.stringify(setores));
  } catch (e) {
    console.error("Erro ao salvar setores", e);
  }
}

export function getStoredUsuarios(): Usuario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USUARIOS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao ler usuarios", e);
  }
  return [];
}

export function saveStoredUsuario(user: Usuario) {
  if (typeof window === "undefined") return;
  const list = getStoredUsuarios();
  const index = list.findIndex((u) => u.id === user.id || u.email.toLowerCase().trim() === user.email.toLowerCase().trim());
  if (index >= 0) {
    list[index] = user;
  } else {
    list.push(user);
  }
  localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("hashira_users_updated"));
}
