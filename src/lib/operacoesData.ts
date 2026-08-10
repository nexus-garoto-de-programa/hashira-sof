export type ColumnStatus = "nao_iniciado" | "em_andamento" | "revisao" | "concluido";

export interface TeamMember {
  id: string;
  initials: string;
  name: string;
  color: string;
  avatarBg: string;
}

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
  cor: string;
  totalTarefas: number;
  concluidas: number;
  tarefasTítulos: string[];
}

export interface OperacoesTarefa {
  id: string;
  titulo: string;
  setorId: string;
  setorNome: string;
  status: ColumnStatus;
  atrasoDias?: number;
  membro: TeamMember;
  dataEntrega: string;
  projetoId?: string;
  projetoNome?: string;
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
    id: "editores",
    nome: "Editores",
    descricao: "Cortes, edições e finalizações de vídeo",
    icone: "Scissors",
    totalTarefas: 0,
    concluidas: 0,
    pendentes: 0,
  },
  {
    id: "design",
    nome: "Design",
    descricao: "Banners, identidade visual e peças gráficas",
    icone: "Palette",
    capaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    totalTarefas: 0,
    concluidas: 0,
    pendentes: 0,
  },
  {
    id: "torres",
    nome: "Torres",
    descricao: "Estrutura, operação e suporte das torres",
    icone: "Building",
    capaUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
    totalTarefas: 0,
    concluidas: 0,
    pendentes: 0,
  },
];

// Seed Inicial de Tarefas Zerada por solicitação do usuário
export const TAREFAS_OPERACOES_SEED: OperacoesTarefa[] = [];

export const PROJETOS_OPERACOES_SEED: OperacoesProjeto[] = [];

export const ACTIVITIES_SEED: ActivityLog[] = [];

const STORAGE_KEY_OPER_TAREFAS = "central_operacoes_tarefas_v3";
const STORAGE_KEY_OPER_PROJETOS = "central_operacoes_projetos_v3";
const STORAGE_KEY_OPER_SETORES = "central_operacoes_setores_v3";
const STORAGE_OPER_CLEARED = "central_operacoes_tarefas_cleared_v3";

export function getStoredOperacoesSetores(): OperacoesSetor[] {
  if (typeof window === "undefined") return SETORES_OPERACOES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPER_SETORES);
    if (raw) return JSON.parse(raw);
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
  } catch (e) {
    console.error("Erro ao salvar setores da Central de Operações", e);
  }
}

export function getStoredOperacoesTarefas(): OperacoesTarefa[] {
  if (typeof window === "undefined") return [];
  try {
    const isCleared = localStorage.getItem(STORAGE_OPER_CLEARED);
    if (!isCleared) {
      localStorage.setItem(STORAGE_KEY_OPER_TAREFAS, JSON.stringify([]));
      localStorage.setItem(STORAGE_OPER_CLEARED, "true");
      return [];
    }

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
  } catch (e) {
    console.error("Erro ao salvar tarefas da Central de Operações", e);
  }
}

export function getStoredOperacoesProjetos(): OperacoesProjeto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPER_PROJETOS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao carregar projetos da Central de Operações", e);
  }
  return [];
}

export function saveStoredOperacoesProjetos(projetos: OperacoesProjeto[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_OPER_PROJETOS, JSON.stringify(projetos));
  } catch (e) {
    console.error("Erro ao salvar projetos da Central de Operações", e);
  }
}
