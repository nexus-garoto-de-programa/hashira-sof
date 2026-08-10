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
    membrosReferencia: ["Henrique", "Play"],
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
    membrosReferencia: ["Matheus", "Sensei", "Felipe"],
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
    membrosReferencia: ["Debora", "Xarada", "Mazoti"],
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
    membrosReferencia: ["Xarada", "Tio Sam"],
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
    membrosReferencia: ["Guardião", "Mazoti"],
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
    membrosReferencia: ["Guardião"],
    cor: "#15803D",
    badgeBg: "#DCFCE7",
    badgeText: "#15803D",
    icone: "MessageSquare",
    descricao: "Moderação da comunidade, eventos ao vivo, cargos e engajamento dos membros.",
  },
];

// Seed Inicial de Demandas
export const DEMANDAS_SEED: Demanda[] = [
  {
    id: "dem-101",
    titulo: "Implementação da Nova Landing Page de Alta Conversão",
    descricao:
      "Criar e publicar nova estrutura de funil responsiva com VSL integrada, provas sociais em carrossel e gatilhos de escassez no checkout.",
    setorId: "sec-funil",
    setorNome: "Estrutura de Funil",
    criadoPor: "Administrador Central",
    colaboradorId: "usr-01",
    colaboradorNome: "Matheus Ramos",
    colaboradorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    prazo: "2026-08-10",
    prioridade: "urgente",
    status: "em_andamento",
    progresso: 75,
    anexos: [
      {
        id: "att-101",
        tipo: "imagem",
        titulo: "Wireframe Desktop Funil V3",
        url: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "att-102",
        tipo: "link",
        titulo: "Link do Protótipo no Figma",
        url: "https://figma.com/file/funil-hashira-v3",
      },
    ],
    historico: [
      {
        id: "h-101",
        usuarioNome: "Administrador Central",
        acao: "Demanda criada e atribuída a Matheus Ramos",
        data: "2026-08-05 10:00",
      },
      {
        id: "h-102",
        usuarioNome: "Matheus Ramos",
        acao: "Status alterado para Em Andamento",
        data: "2026-08-05 10:30",
        comentario: "Ajustando o tempo de carregamento da VSL e scripts de gatilho.",
      },
    ],
    criadoEm: "2026-08-05T10:00:00Z",
  },
  {
    id: "dem-102",
    titulo: "Campanha Tráfego Pago — Lançamento Turma 5",
    descricao:
      "Configurar conjuntos de anúncios no Meta Ads e Google Ads direcionados para público qualificado, com orçamento de escala em Remarketing.",
    setorId: "sec-marketing",
    setorNome: "Marketing",
    criadoPor: "Administrador Central",
    colaboradorId: "usr-02",
    colaboradorNome: "Henrique Silva",
    colaboradorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    prazo: "2026-08-12",
    prioridade: "alta",
    status: "pendente",
    progresso: 15,
    anexos: [
      {
        id: "att-103",
        tipo: "imagem",
        titulo: "Planilha de Orçamento Tráfego",
        url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
      },
    ],
    historico: [
      {
        id: "h-103",
        usuarioNome: "Administrador Central",
        acao: "Demanda publicada",
        data: "2026-08-06 11:00",
      },
    ],
    criadoEm: "2026-08-06T11:00:00Z",
  },
  {
    id: "dem-103",
    titulo: "Automação do Atendimento via WhatsApp e Z-API",
    descricao:
      "Integrar a plataforma de suporte com a Z-API para envio de mensagens automáticas de confirmação de pedido e código de rastreio.",
    setorId: "sec-posvenda",
    setorNome: "Pós-venda, Suporte e Atendimento ao Cliente",
    criadoPor: "Administrador Central",
    colaboradorId: "usr-03",
    colaboradorNome: "Debora Santos",
    colaboradorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    prazo: "2026-08-08",
    prioridade: "urgente",
    status: "concluida",
    progresso: 100,
    anexos: [],
    historico: [
      {
        id: "h-104",
        usuarioNome: "Debora Santos",
        acao: "Demanda concluída com sucesso",
        data: "2026-08-07 14:00",
        comentario: "Webhooks testados e funcionando com 100% de taxa de entrega.",
      },
    ],
    criadoEm: "2026-08-04T09:00:00Z",
  },
  {
    id: "dem-104",
    titulo: "Reformulação da Área de Membros dos Alunos",
    descricao:
      "Atualizar módulos de vídeo na área de membros, adicionar campo de anotações e sistema de progresso gamificado.",
    setorId: "sec-produtos",
    setorNome: "Produtos",
    criadoPor: "Administrador Central",
    colaboradorId: "usr-04",
    colaboradorNome: "Guardião",
    colaboradorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    prazo: "2026-08-14",
    prioridade: "media",
    status: "em_andamento",
    progresso: 40,
    anexos: [],
    historico: [],
    criadoEm: "2026-08-03T15:00:00Z",
  },
  {
    id: "dem-105",
    titulo: "Organização dos Canais VIP e Permissões no Discord",
    descricao:
      "Reorganizar cargos automáticos de alunos VIP e implementar bot de boas-vindas com verificação por token.",
    setorId: "sec-discord",
    setorNome: "Discord",
    criadoPor: "Administrador Central",
    colaboradorId: "usr-04",
    colaboradorNome: "Guardião",
    colaboradorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    prazo: "2026-08-06",
    prioridade: "alta",
    status: "atrasada",
    progresso: 60,
    anexos: [],
    historico: [
      {
        id: "h-105",
        usuarioNome: "Guardião",
        acao: "Atrasada devido a atualização de API do Discord Bot",
        data: "2026-08-06 18:00",
      },
    ],
    criadoEm: "2026-08-02T12:00:00Z",
  },
];

// Helper LocalStorage persistence
const STORAGE_KEY_DEMANDAS = "hashira_cascade_demandas_v2";
const STORAGE_KEY_SETORES = "hashira_cascade_setores_v2";
const STORAGE_KEY_USUARIOS = "hashira_cascade_usuarios_v2";

export function getStoredDemandas(): Demanda[] {
  if (typeof window === "undefined") return DEMANDAS_SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEMANDAS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao ler demandas", e);
  }
  localStorage.setItem(STORAGE_KEY_DEMANDAS, JSON.stringify(DEMANDAS_SEED));
  return DEMANDAS_SEED;
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
