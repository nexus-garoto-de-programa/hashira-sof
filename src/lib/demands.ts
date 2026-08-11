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

export function getStoredDemandas(): Demanda[] {
  if (typeof window === "undefined") return [];
  try {
    const isCleared = localStorage.getItem(STORAGE_CLEARED_FLAG);
    if (!isCleared) {
      localStorage.setItem(STORAGE_KEY_DEMANDAS, JSON.stringify([]));
      localStorage.setItem(STORAGE_CLEARED_FLAG, "true");
      return [];
    }

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
  const index = list.findIndex((u) => u.id === user.id || u.email === user.email);
  if (index >= 0) {
    list[index] = user;
  } else {
    list.push(user);
  }
  localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(list));
}
