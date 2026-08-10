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
    totalTarefas: 17,
    concluidas: 11,
    pendentes: 6,
  },
  {
    id: "torres",
    nome: "Torres",
    descricao: "Estrutura, operação e suporte das torres",
    icone: "Building",
    capaUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
    totalTarefas: 9,
    concluidas: 1,
    pendentes: 8,
  },
];

export const TAREFAS_OPERACOES_SEED: OperacoesTarefa[] = [
  // Não Iniciado (5)
  {
    id: "t-1",
    titulo: "OVERLAY SENSEI",
    setorId: "design",
    setorNome: "Design",
    status: "nao_iniciado",
    atrasoDias: 39,
    membro: TEAM_MEMBERS[2], // SD
    dataEntrega: "2026-06-29",
  },
  {
    id: "t-2",
    titulo: "DEMANDAS DISCORD",
    setorId: "torres",
    setorNome: "Torres",
    status: "nao_iniciado",
    atrasoDias: 6,
    membro: TEAM_MEMBERS[1], // G
    dataEntrega: "2026-08-01",
  },
  {
    id: "t-3",
    titulo: "HUDS PERFEITOS",
    setorId: "torres",
    setorNome: "Torres",
    status: "nao_iniciado",
    atrasoDias: 43,
    membro: TEAM_MEMBERS[1], // G
    dataEntrega: "2026-06-25",
  },
  {
    id: "t-4",
    titulo: "CRIAR VÍDEOS EXPLICATIVOS PARA TODOS OS PACKS",
    setorId: "torres",
    setorNome: "Torres",
    status: "nao_iniciado",
    atrasoDias: 43,
    membro: TEAM_MEMBERS[1], // G
    dataEntrega: "2026-06-25",
  },
  {
    id: "t-5",
    titulo: "Emojis Animados Discord",
    setorId: "design",
    setorNome: "Design",
    status: "nao_iniciado",
    atrasoDias: 33,
    membro: TEAM_MEMBERS[2], // SD
    dataEntrega: "2026-07-05",
  },

  // Em andamento (2)
  {
    id: "t-6",
    titulo: "SITE INTERNACIONAL – REVISÃO",
    setorId: "design",
    setorNome: "Design",
    status: "em_andamento",
    atrasoDias: 46,
    membro: TEAM_MEMBERS[0], // MH
    dataEntrega: "2026-06-22",
  },
  {
    id: "t-7",
    titulo: "🥇 BANNERS — CARGOS",
    setorId: "design",
    setorNome: "Design",
    status: "em_andamento",
    atrasoDias: 43,
    membro: TEAM_MEMBERS[0], // MH
    dataEntrega: "2026-06-25",
  },

  // Revisão (7)
  {
    id: "t-8",
    titulo: "SITE FELIPE – TRAFEGO PAGP",
    setorId: "design",
    setorNome: "Design",
    status: "revisao",
    atrasoDias: 45,
    membro: TEAM_MEMBERS[0], // MH
    dataEntrega: "2026-06-23",
  },
  {
    id: "t-9",
    titulo: "SITE HASHIRA LATAM",
    setorId: "design",
    setorNome: "Design",
    status: "revisao",
    atrasoDias: 44,
    membro: TEAM_MEMBERS[0], // MH
    dataEntrega: "2026-06-24",
  },
  {
    id: "t-10",
    titulo: "ANDROID VIP E PLATINA – TAREFAS",
    setorId: "torres",
    setorNome: "Torres",
    status: "revisao",
    atrasoDias: 48,
    membro: TEAM_MEMBERS[1], // G
    dataEntrega: "2026-06-20",
  },
  {
    id: "t-11",
    titulo: "EMU PLATINA E VIP – TAREFAS",
    setorId: "torres",
    setorNome: "Torres",
    status: "revisao",
    atrasoDias: 48,
    membro: TEAM_MEMBERS[1], // G
    dataEntrega: "2026-06-20",
  },
  {
    id: "t-12",
    titulo: "IPHONE VIP E IPHONE PLATINA",
    setorId: "torres",
    setorNome: "Torres",
    status: "revisao",
    atrasoDias: 48,
    membro: TEAM_MEMBERS[1], // G
    dataEntrega: "2026-06-20",
  },
  {
    id: "t-13",
    titulo: "PACK PERMANENTE – TAREFAS",
    setorId: "torres",
    setorNome: "Torres",
    status: "revisao",
    atrasoDias: 48,
    membro: TEAM_MEMBERS[1], // G
    dataEntrega: "2026-06-20",
  },
  {
    id: "t-14",
    titulo: "PACK COMPLETO – TAREFAS",
    setorId: "torres",
    setorNome: "Torres",
    status: "revisao",
    atrasoDias: 48,
    membro: TEAM_MEMBERS[1], // G
    dataEntrega: "2026-06-20",
  },

  // Concluído (12)
  {
    id: "t-15",
    titulo: "OVERLAY BANNER",
    setorId: "design",
    setorNome: "Design",
    status: "concluido",
    membro: TEAM_MEMBERS[2], // SD
    dataEntrega: "2026-06-22",
  },
  {
    id: "t-16",
    titulo: "BANNERS RANKED",
    setorId: "design",
    setorNome: "Design",
    status: "concluido",
    membro: TEAM_MEMBERS[0], // MH
    dataEntrega: "2026-06-18",
  },
  {
    id: "t-17",
    titulo: "BANNERS E OVERLAY",
    setorId: "design",
    setorNome: "Design",
    status: "concluido",
    membro: TEAM_MEMBERS[0], // MH
    dataEntrega: "2026-06-24",
  },
  {
    id: "t-18",
    titulo: "Emoji Rank",
    setorId: "design",
    setorNome: "Design",
    status: "concluido",
    membro: TEAM_MEMBERS[2], // SD
    dataEntrega: "2026-06-20",
  },
  {
    id: "t-19",
    titulo: "BANNER GERAL",
    setorId: "design",
    setorNome: "Design",
    status: "concluido",
    membro: TEAM_MEMBERS[0], // MH
    dataEntrega: "2026-06-20",
  },
  {
    id: "t-20",
    titulo: "BANNER RANKED",
    setorId: "design",
    setorNome: "Design",
    status: "concluido",
    membro: TEAM_MEMBERS[0], // MH
    dataEntrega: "2026-06-12",
  },
  {
    id: "t-21",
    titulo: "Overlay Sensi",
    setorId: "design",
    setorNome: "Design",
    status: "concluido",
    membro: TEAM_MEMBERS[2], // SD
    dataEntrega: "2026-06-20",
  },
  {
    id: "t-22",
    titulo: "MUDANÇA SITE HOME – EQUAL SITE TRAFEGO PAGO",
    setorId: "design",
    setorNome: "Design",
    status: "concluido",
    membro: TEAM_MEMBERS[0], // MH
    dataEntrega: "2026-06-09",
  },
  {
    id: "t-23",
    titulo: "BIO HASHIRA TIK TOK – YOUTUBE",
    setorId: "design",
    setorNome: "Design",
    status: "concluido",
    membro: TEAM_MEMBERS[0], // MH
    dataEntrega: "2026-06-20",
  },
];

export const PROJETOS_OPERACOES_SEED: OperacoesProjeto[] = [
  {
    id: "proj-discord",
    nome: "Discord - 2026.2",
    cor: "#8B5CF6", // Roxo
    totalTarefas: 10,
    concluidas: 7,
    tarefasTítulos: [
      "DEMANDAS DISCORD",
      "BANNERS E OVERLAY",
      "Emoji Rank",
      "BANNER GERAL",
      "Emojis Animados Discord",
      "Overlay Sensi",
    ],
  },
  {
    id: "proj-site-bsl",
    nome: "Site internacional - BSL",
    cor: "#3B82F6", // Azul
    totalTarefas: 1,
    concluidas: 0,
    tarefasTítulos: ["SITE HASHIRA LATAM"],
  },
  {
    id: "proj-lastlink",
    nome: "Lastlink - Ofertas",
    cor: "#EAB308", // Amarelo
    totalTarefas: 1,
    concluidas: 1,
    tarefasTítulos: ["Troca de banner de checkout do marechal"],
  },
  {
    id: "proj-brasil",
    nome: "HASHIRA BRASIL",
    cor: "#22C55E", // Verde
    totalTarefas: 10,
    concluidas: 2,
    tarefasTítulos: [
      "SITE FELIPE – TRAFEGO PAGP",
      "HUDS PERFEITOS",
      "CRIAR VÍDEOS EXPLICATIVOS PARA TODOS OS PACKS",
      "ANDROID VIP E PLATINA – TAREFAS",
    ],
  },
];

export const ACTIVITIES_SEED: ActivityLog[] = [
  {
    id: "act-1",
    membroInitials: "MH",
    membroColor: "#3B82F6",
    membroNome: "Matheus Henrique",
    acao: "concluiu",
    tarefaTitulo: "BANNERS RANKED",
    tempoAtras: "há 27 dias",
  },
  {
    id: "act-2",
    membroInitials: "G",
    membroColor: "#EAB308",
    membroNome: "Guardian TV",
    acao: "atualizou",
    tarefaTitulo: "DEMANDAS DISCORD",
    tempoAtras: "há cerca de 1 mês",
  },
  {
    id: "act-3",
    membroInitials: "MH",
    membroColor: "#3B82F6",
    membroNome: "Matheus Henrique",
    acao: "iniciou 🥇",
    tarefaTitulo: "BANNERS — CARGOS",
    tempoAtras: "há cerca de 1 mês",
  },
  {
    id: "act-4",
    membroInitials: "SD",
    membroColor: "#22C55E",
    membroNome: "Sensei Design",
    acao: "atualizou",
    tarefaTitulo: "OVERLAY SENSEI",
    tempoAtras: "há cerca de 1 mês",
  },
  {
    id: "act-5",
    membroInitials: "MH",
    membroColor: "#3B82F6",
    membroNome: "Matheus Henrique",
    acao: "concluiu",
    tarefaTitulo: "BANNERS E OVERLAY",
    tempoAtras: "há cerca de 1 mês",
  },
  {
    id: "act-6",
    membroInitials: "SD",
    membroColor: "#22C55E",
    membroNome: "Sensei Design",
    acao: "concluiu",
    tarefaTitulo: "OVERLAY BANNER",
    tempoAtras: "há cerca de 1 mês",
  },
];

const STORAGE_KEY_OPER_TAREFAS = "central_operacoes_tarefas_v1";
const STORAGE_KEY_OPER_PROJETOS = "central_operacoes_projetos_v1";
const STORAGE_KEY_OPER_SETORES = "central_operacoes_setores_v1";

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
  if (typeof window === "undefined") return TAREFAS_OPERACOES_SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPER_TAREFAS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao carregar tarefas da Central de Operações", e);
  }
  localStorage.setItem(STORAGE_KEY_OPER_TAREFAS, JSON.stringify(TAREFAS_OPERACOES_SEED));
  return TAREFAS_OPERACOES_SEED;
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
  if (typeof window === "undefined") return PROJETOS_OPERACOES_SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPER_PROJETOS);
    if (raw) return JSON.parse(raw);
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
  } catch (e) {
    console.error("Erro ao salvar projetos da Central de Operações", e);
  }
}
