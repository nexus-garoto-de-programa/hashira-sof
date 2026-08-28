import { supabase } from "@/lib/supabase";
import { notifyRealtimeChange } from "@/lib/realtimeSync";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export type SufixoVendas = "-new" | "-vendas" | "" | "customizado";

export interface LinkCheckout {
  id: string;
  categoriaId?: string; // ex: "vip", "pack_completo", "sensi_permanente"
  subItemId?: string;   // ex: "android", "iphone", "emulador", "link_unico"
  nome: string;         // ex: "ANDROID", "IPHONE", "EMULADOR", "LINK ÚNICO"
  url: string;          // link Lastlink
  ativo: boolean;
}

export interface SubItemCheckoutConfig {
  id: string;
  label: string;
}

export interface CategoriaCheckoutConfig {
  id: string;
  titulo: string;
  icone: string;
  subItems: SubItemCheckoutConfig[];
}

export const CATEGORIAS_CHECKOUT_PREDEFINIDAS: CategoriaCheckoutConfig[] = [
  {
    id: "vip",
    titulo: "VIP",
    icone: "💛",
    subItems: [
      { id: "android", label: "ANDROID" },
      { id: "iphone", label: "IPHONE" },
      { id: "emulador", label: "EMULADOR" },
    ],
  },
  {
    id: "pack_completo",
    titulo: "Pack Completo",
    icone: "📦",
    subItems: [
      { id: "link_unico", label: "LINK ÚNICO" },
    ],
  },
  {
    id: "sensi_permanente",
    titulo: "Sensi Permanente",
    icone: "🎯",
    subItems: [
      { id: "link_unico", label: "LINK ÚNICO" },
    ],
  },
];

export interface Influenciador {
  id: string;
  slugBase: string;                    // nome único canônico, ex: "astorga" — SEMPRE minúsculo, sem espaço/acento
  nomeExibicao: string;                // nome pra exibição, ex: "Astorga"
  nome?: string;                       // alias para compatibilidade reversa
  sufixoVendas: SufixoVendas;          // default: "-new"
  slugVendasCustomizado?: string;      // só preenchido quando sufixoVendas === "customizado"
  ehContaInterna?: boolean;            // true para contas como "hashira-principal" (não são influenciadores de verdade)
  ativo: boolean;
  linksCheckout: LinkCheckout[];
  checkoutLinks?: LinkCheckout[];      // alias para compatibilidade
  bioLinks?: any[];
  fotoUrl: string;
  avatarUrl?: string;                  // alias compatível com padrão UserAccount
  urlBase: string;                     // domínio base do site de vendas (padrão: "hashirasensix.com.br")
  urlArvore: string;                   // domínio da árvore de links (padrão: "biohashira.com.br")
  utmSourcePadrao: string;             // padrão: "beacons"
  tokenAcessoRapido: string;
  criadoPor: string;
  criadoEm: string;
  atualizadoEm?: string;

  // Campos legados mapeados dinamicamente para compatibilidade
  slugBio?: string;
  slugPrincipal?: string;
}

export interface UTMLinkBlock {
  plataforma: "instagram" | "youtube" | "tiktok";
  label: string;
  icone: string;
  utmSource: string;
  utmMedium: string;
  utmContent: string;
  urlCompleta: string;
}

export interface ArvoreLink {
  plataforma: "instagram" | "youtube" | "tiktok";
  label: string;
  sufixo: string;  // ex: "ig", "yt", "ttk"
  urlCompleta: string;
}

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────

const STORAGE_KEY = "hashira_influenciadores_v1";

const PLATAFORMAS = [
  { id: "instagram" as const, label: "Instagram", icone: "Instagram", sufixo: "ig", utm_medium: "instagram" },
  { id: "youtube"   as const, label: "YouTube",   icone: "Youtube",   sufixo: "yt", utm_medium: "youtube" },
  { id: "tiktok"   as const, label: "TikTok",    icone: "Music2",    sufixo: "ttk", utm_medium: "tiktok" },
];

export const SUFIXOS_VENDAS_OPCOES: { valor: SufixoVendas; label: string; descricao: string }[] = [
  { valor: "-new", label: "-new (Padrão)", descricao: "hashirasensix.com.br/{slug}-new" },
  { valor: "-vendas", label: "-vendas", descricao: "hashirasensix.com.br/{slug}-vendas" },
  { valor: "", label: "Sem sufixo", descricao: "hashirasensix.com.br/{slug}" },
  { valor: "customizado", label: "Personalizado...", descricao: "Definir slug de vendas manualmente" },
];

// ─────────────────────────────────────────────
// FUNÇÕES PURAS DERIVADAS (FONTE ÚNICA DA VERDADE)
// ─────────────────────────────────────────────

/** Retorna o slug do biohashira (sempre igual a slugBase) */
export function getSlugBioHashira(inf: Influenciador): string {
  return (inf.slugBase || inf.slugBio || inf.nome || "").trim().toLowerCase();
}

/** Retorna o slug do hashirasensix resolvido */
export function getSlugHashirasensix(inf: Influenciador): string {
  if (inf.sufixoVendas === "customizado") {
    return (inf.slugVendasCustomizado?.trim() || inf.slugBase || inf.slugPrincipal || "").toLowerCase();
  }
  const base = getSlugBioHashira(inf);
  const sufixo = inf.sufixoVendas !== undefined ? inf.sufixoVendas : "-new";
  return `${base}${sufixo}`;
}

/** URL completa da página de biohashira */
export function getUrlBioHashira(inf: Influenciador): string {
  const arvore = (inf.urlArvore || "biohashira.com.br").replace(/\/$/, "");
  return `https://${arvore}/${getSlugBioHashira(inf)}`;
}

/** URL completa da página de vendas hashirasensix */
export function getUrlHashirasensix(inf: Influenciador): string {
  const base = (inf.urlBase || "hashirasensix.com.br").replace(/\/$/, "");
  return `https://${base}/${getSlugHashirasensix(inf)}`;
}

// ─────────────────────────────────────────────
// HELPERS DE NORMALIZAÇÃO E VALIDAÇÃO
// ─────────────────────────────────────────────

/** Normaliza texto para o padrão slugBase (minúsculo, sem acento, sem espaço, apenas a-z, 0-9 e hífen) */
export function normalizarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Alias para compatibilidade */
export const gerarSlug = normalizarSlug;

/** Capitaliza um slug para sugerir o Nome de Exibição (ex: "joao-silva" -> "Joao Silva") */
export function capitalizarSlugParaNome(slug: string): string {
  if (!slug) return "";
  return slug
    .split("-")
    .map((parte) => (parte ? parte.charAt(0).toUpperCase() + parte.slice(1) : ""))
    .join(" ")
    .trim();
}

/** Valida o slugBase segundo as regras estritas */
export function validarSlugBase(slug: string): { valido: boolean; erro?: string; sugestao?: string } {
  const limpo = slug.trim();
  if (!limpo) {
    return { valido: false, erro: "O slug base é obrigatório." };
  }
  const regex = /^[a-z0-9-]+$/;
  if (!regex.test(limpo)) {
    const sugerido = normalizarSlug(limpo);
    return {
      valido: false,
      erro: "O slug base só pode conter letras minúsculas sem acento, números e hífens.",
      sugestao: sugerido || undefined,
    };
  }
  return { valido: true };
}

/** Gera um slug único garantido a partir do nome (ex: "João Hashira" -> "joao-hashira", ou "joao-hashira-2" se já existir) */
export function gerarSlugUnico(nome: string, existentes: Influenciador[] = []): string {
  const base = normalizarSlug(nome) || "influenciador";
  const slugsExistentes = new Set(
    existentes.map((i) => (i.slugBase || i.slugBio || "").toLowerCase().trim())
  );

  if (!slugsExistentes.has(base)) {
    return base;
  }

  let counter = 2;
  while (slugsExistentes.has(`${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}

/** Gera um token UUID v4 simples */
export function generateTokenAcessoRapido(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Gera os blocos de UTM para as 3 plataformas */
export function generateUTMLinks(inf: Influenciador): UTMLinkBlock[] {
  const slugVendas = getSlugHashirasensix(inf);
  const base = (inf.urlBase || "hashirasensix.com.br").replace(/\/$/, "");

  return PLATAFORMAS.map((p) => {
    const params = new URLSearchParams({
      utm_source: inf.utmSourcePadrao || "beacons",
      utm_medium: p.utm_medium,
      utm_content: slugVendas,
    });
    return {
      plataforma: p.id,
      label: p.label,
      icone: p.icone,
      utmSource: inf.utmSourcePadrao || "beacons",
      utmMedium: p.utm_medium,
      utmContent: slugVendas,
      urlCompleta: `https://${base}/${slugVendas}?${params.toString()}`,
    };
  });
}

/** Gera a árvore de links biohashira */
export function generateArvoreLinks(inf: Influenciador): ArvoreLink[] {
  const arvore = (inf.urlArvore || "biohashira.com.br").replace(/\/$/, "");
  const slugBio = getSlugBioHashira(inf);
  return PLATAFORMAS.map((p) => ({
    plataforma: p.id,
    label: p.label,
    sufixo: p.sufixo,
    urlCompleta: `https://${arvore}/${slugBio}/${p.sufixo}`,
  }));
}

/** URL raiz da árvore */
export function getArvoreRaiz(inf: Influenciador): string {
  return getUrlBioHashira(inf);
}

// ─────────────────────────────────────────────
// ASSINATURA DIGITAL E FORMATAÇÃO DE CÓPIA
// ─────────────────────────────────────────────

export const HASHIRA_SIGNATURE_FOOTER = `⚡ Links oficiais gerados e validados via Central Hashira 🏯`;

/** Formata a mensagem para a cópia de um link individual com assinatura HASHIRA */
export function formatarLinkComAssinatura(titulo: string, url: string, infoAdicional?: string): string {
  let text = `🏯 CENTRAL HASHIRA — Link de Divulgação\n📌 ${titulo}\n`;
  if (infoAdicional) text += `ℹ️ ${infoAdicional}\n`;
  text += `\n🔗 ${url}\n\n${HASHIRA_SIGNATURE_FOOTER}`;
  return text;
}

/** Formata todos os links com UTM do influenciador em um único bloco */
export function formatarTodosLinksUTM(inf: Influenciador): string {
  const utms = generateUTMLinks(inf);
  const nome = inf.nomeExibicao || inf.nome || inf.slugBase;
  const slugBio = getSlugBioHashira(inf);
  const urlVendas = getUrlHashirasensix(inf);

  let text = `🏯 CENTRAL HASHIRA — Links UTM de Divulgação\n`;
  text += `👤 Influenciador: ${nome} (@${slugBio})\n`;
  text += `🌐 URL Base: ${urlVendas}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  utms.forEach((u) => {
    text += `📌 ${u.label.toUpperCase()}:\n🔗 ${u.urlCompleta}\n\n`;
  });
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${HASHIRA_SIGNATURE_FOOTER}`;
  return text;
}

/** Formata a árvore de links biohashira completa em um único bloco */
export function formatarTodaArvoreLinks(inf: Influenciador): string {
  const raiz = getArvoreRaiz(inf);
  const subrotas = generateArvoreLinks(inf);
  const nome = inf.nomeExibicao || inf.nome || inf.slugBase;

  let text = `🏯 CENTRAL HASHIRA — Árvore de Links\n`;
  text += `👤 Influenciador: ${nome}\n`;
  text += `🌳 Link Raiz: ${raiz}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📌 SUB-ROTAS POR PLATAFORMA:\n\n`;
  subrotas.forEach((s) => {
    text += `• ${s.label}: ${s.urlCompleta}\n`;
  });
  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${HASHIRA_SIGNATURE_FOOTER}`;
  return text;
}

/** Formata todos os links de checkout por categoria em um único bloco */
export function formatarTodosLinksCheckout(inf: Influenciador): string {
  const nome = inf.nomeExibicao || inf.nome || inf.slugBase;
  let text = `🏯 CENTRAL HASHIRA — Links de Checkout\n`;
  text += `👤 Influenciador: ${nome}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  CATEGORIAS_CHECKOUT_PREDEFINIDAS.forEach((cat) => {
    text += `💛 ${cat.titulo.toUpperCase()}:\n`;
    cat.subItems.forEach((sub) => {
      const link = inf.linksCheckout.find(
        (l) => l.categoriaId === cat.id && l.subItemId === sub.id
      ) || inf.linksCheckout.find(
        (l) => l.nome.toUpperCase().trim() === sub.label.toUpperCase().trim()
      );
      if (link && link.url && link.url.trim().length > 0) {
        text += `   • ${sub.label}: ${link.url}\n`;
      } else {
        text += `   • ${sub.label}: (sem link cadastrado)\n`;
      }
    });
    text += `\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${HASHIRA_SIGNATURE_FOOTER}`;
  return text;
}

/** Formata um PACOTE COMPLETO com todos os links do influenciador (UTM + Checkout + Árvore) */
export function formatarPacoteCompletoInfluenciador(inf: Influenciador): string {
  const utms = generateUTMLinks(inf);
  const raiz = getArvoreRaiz(inf);
  const subrotas = generateArvoreLinks(inf);
  const nome = inf.nomeExibicao || inf.nome || inf.slugBase;

  let text = `🏯 CENTRAL HASHIRA — PACOTE COMPLETO DE LINKS\n`;
  text += `👤 Influenciador: ${nome}\n`;
  text += `📅 Data de emissão: ${new Date().toLocaleDateString("pt-BR")}\n\n`;

  text += `====================================\n`;
  text += `📊 1. LINKS COM UTM (CAMPANHA)\n`;
  text += `====================================\n`;
  utms.forEach((u) => {
    text += `• ${u.label}: ${u.urlCompleta}\n`;
  });

  text += `\n====================================\n`;
  text += `🛒 2. LINKS DE CHECKOUT\n`;
  text += `====================================\n`;
  CATEGORIAS_CHECKOUT_PREDEFINIDAS.forEach((cat) => {
    text += `\n💛 [${cat.titulo.toUpperCase()}]\n`;
    cat.subItems.forEach((sub) => {
      const link = inf.linksCheckout.find(
        (l) => l.categoriaId === cat.id && l.subItemId === sub.id
      ) || inf.linksCheckout.find(
        (l) => l.nome.toUpperCase().trim() === sub.label.toUpperCase().trim()
      );
      if (link && link.url && link.url.trim().length > 0) {
        text += `  • ${sub.label}: ${link.url}\n`;
      } else {
        text += `  • ${sub.label}: (pendente)\n`;
      }
    });
  });

  if (!inf.ehContaInterna) {
    text += `\n====================================\n`;
    text += `🌳 3. ÁRVORE DE LINKS (biohashira)\n`;
    text += `====================================\n`;
    text += `• Raiz Principal: ${raiz}\n`;
    subrotas.forEach((s) => {
      text += `• ${s.label}: ${s.urlCompleta}\n`;
    });
  }

  text += `\n====================================\n`;
  text += `${HASHIRA_SIGNATURE_FOOTER}`;

  return text;
}

// ─────────────────────────────────────────────
// MAPEAMENTOS & INFERÊNCIA INTELIGENTE
// ─────────────────────────────────────────────

/** Infere os novos campos estruturados a partir de um registro antigo/legado */
export function inferirCamposInfluenciador(row: any): {
  slugBase: string;
  sufixoVendas: SufixoVendas;
  slugVendasCustomizado?: string;
  ehContaInterna: boolean;
  nomeExibicao: string;
} {
  // Se já tiver slug_base explícito salvo
  if (row.slug_base) {
    return {
      slugBase: row.slug_base,
      sufixoVendas: (row.sufixo_vendas as SufixoVendas) || "-new",
      slugVendasCustomizado: row.slug_vendas_customizado || undefined,
      ehContaInterna: Boolean(row.eh_conta_interna),
      nomeExibicao: row.nome_exibicao || row.nome || capitalizarSlugParaNome(row.slug_base),
    };
  }

  // Tabela oficial de casos especiais conhecidos
  const rawIdentificador = (row.slug_principal || row.slug_bio || row.nomeIdentificador || "").trim().toLowerCase();

  if (rawIdentificador === "hashira-principal" || rawIdentificador === "hashira-trafego-pago") {
    return {
      slugBase: rawIdentificador,
      sufixoVendas: "customizado",
      slugVendasCustomizado: rawIdentificador,
      ehContaInterna: true,
      nomeExibicao: row.nome || (rawIdentificador === "hashira-principal" ? "Hashira Principal" : "Hashira Tráfego Pago"),
    };
  }

  if (rawIdentificador === "drey-new2" || rawIdentificador === "drey-new") {
    return {
      slugBase: "drey",
      sufixoVendas: "-new",
      ehContaInterna: false,
      nomeExibicao: row.nome || "Drey",
    };
  }

  // Normalização de segurança: se vier -new2 legado, corrige automaticamente para -new
  if (rawIdentificador.endsWith("-new2")) {
    const base = rawIdentificador.replace(/-new2$/, "");
    return {
      slugBase: base,
      sufixoVendas: "-new",
      ehContaInterna: false,
      nomeExibicao: row.nome || capitalizarSlugParaNome(base),
    };
  }

  if (rawIdentificador.endsWith("-vendas")) {
    const base = rawIdentificador.replace(/-vendas$/, "");
    return {
      slugBase: base,
      sufixoVendas: "-vendas",
      ehContaInterna: false,
      nomeExibicao: row.nome || capitalizarSlugParaNome(base),
    };
  }

  if (rawIdentificador.endsWith("-new")) {
    const base = rawIdentificador.replace(/-new$/, "");
    return {
      slugBase: base,
      sufixoVendas: "-new",
      ehContaInterna: false,
      nomeExibicao: row.nome || capitalizarSlugParaNome(base),
    };
  }

  // Fallback geral (se não tiver sufixo)
  const base = normalizarSlug(rawIdentificador || row.nome || "influenciador");
  return {
    slugBase: base,
    sufixoVendas: "",
    ehContaInterna: false,
    nomeExibicao: row.nome || capitalizarSlugParaNome(base),
  };
}

export function mapSupabaseRowToInfluenciador(row: any): Influenciador {
  const inferido = inferirCamposInfluenciador(row);
  const foto = row.foto_url || row.fotoUrl || row.avatar_url || row.avatarUrl || "";

  const inf: Influenciador = {
    id: String(row.id),
    slugBase: inferido.slugBase,
    nomeExibicao: inferido.nomeExibicao,
    nome: inferido.nomeExibicao,
    sufixoVendas: inferido.sufixoVendas,
    slugVendasCustomizado: inferido.slugVendasCustomizado,
    ehContaInterna: inferido.ehContaInterna,
    fotoUrl: foto,
    avatarUrl: foto,
    urlBase: row.url_base || row.urlBase || "hashirasensix.com.br",
    urlArvore: row.url_arvore || row.urlArvore || "biohashira.com.br",
    utmSourcePadrao: row.utm_source_padrao || row.utmSourcePadrao || "beacons",
    linksCheckout: Array.isArray(row.links_checkout) ? row.links_checkout : [],
    tokenAcessoRapido: row.token_acesso_rapido || row.tokenAcessoRapido || "",
    ativo: row.ativo ?? true,
    criadoPor: row.criado_por || row.criadoPor || "",
    criadoEm: row.created_at || row.criado_em || new Date().toISOString(),
    atualizadoEm: row.updated_at || row.atualizadoEm,
    bioLinks: row.bio_links,
  };

  // Preenche dinamicamente os getters de compatibilidade
  inf.slugBio = getSlugBioHashira(inf);
  inf.slugPrincipal = getSlugHashirasensix(inf);
  inf.checkoutLinks = inf.linksCheckout;

  return inf;
}

export function mapInfluenciadorToSupabaseRow(inf: Influenciador) {
  const slugBio = getSlugBioHashira(inf);
  const slugVendas = getSlugHashirasensix(inf);
  const nome = inf.nomeExibicao || inf.nome || slugBio;
  const foto = inf.fotoUrl || inf.avatarUrl || "";

  const row: Record<string, any> = {
    id: inf.id,
    nome: nome,
    slug_bio: slugBio,
    slug_principal: slugVendas,
    foto_url: foto,
    url_base: inf.urlBase || "hashirasensix.com.br",
    url_arvore: inf.urlArvore || "biohashira.com.br",
    utm_source_padrao: inf.utmSourcePadrao || "beacons",
    links_checkout: inf.linksCheckout || [],
    token_acesso_rapido: inf.tokenAcessoRapido,
    ativo: inf.ativo ?? true,
    criado_por: inf.criadoPor,
  };

  // Novos campos estruturados
  row.slug_base = inf.slugBase;
  row.sufixo_vendas = inf.sufixoVendas;
  row.slug_vendas_customizado = inf.slugVendasCustomizado || null;
  row.eh_conta_interna = Boolean(inf.ehContaInterna);
  row.nome_exibicao = nome;

  return row;
}

// ─────────────────────────────────────────────
// CRUD — REMOTE (SUPABASE)
// ─────────────────────────────────────────────

export async function fetchInfluenciadoresFromSupabase(): Promise<Influenciador[]> {
  try {
    const { data, error } = await supabase
      .from("influenciadores")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[CDI WARN] Falha ao buscar influenciadores remotos:", error.message);
      return getStoredInfluenciadores();
    }

    if (data && data.length > 0) {
      const remote = data.map(mapSupabaseRowToInfluenciador);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        } catch (e) {}
      }
      return remote;
    }
  } catch (e) {
    console.error("[CDI ERROR] Exceção ao buscar influenciadores:", e);
  }
  return getStoredInfluenciadores();
}

export async function fetchInfluenciadorByToken(token: string): Promise<Influenciador | null> {
  try {
    const { data, error } = await supabase
      .from("influenciadores")
      .select("*")
      .eq("token_acesso_rapido", token)
      .eq("ativo", true)
      .single();

    if (error || !data) return null;
    return mapSupabaseRowToInfluenciador(data);
  } catch (e) {
    console.error("[CDI ERROR] Exceção ao buscar influenciador por token:", e);
    return null;
  }
}

export async function saveInfluenciadorToSupabase(inf: Influenciador): Promise<boolean> {
  try {
    const row = mapInfluenciadorToSupabaseRow(inf);
    
    // Tenta salvar com todos os campos (incluindo novos)
    let { error } = await supabase
      .from("influenciadores")
      .upsert(row, { onConflict: "id" });

    // Se o banco ainda não tiver as novas colunas DDL criadas, salva com os campos base para não travar a aplicação
    if (error && error.message?.includes("column")) {
      console.warn("[CDI WARN] Coluna nova ausente no Supabase, salvando em modo compatibilidade:", error.message);
      const rowLegado = { ...row };
      delete rowLegado.slug_base;
      delete rowLegado.sufixo_vendas;
      delete rowLegado.slug_vendas_customizado;
      delete rowLegado.eh_conta_interna;
      delete rowLegado.nome_exibicao;

      const { error: errLegado } = await supabase
        .from("influenciadores")
        .upsert(rowLegado, { onConflict: "id" });
      
      if (errLegado) {
        console.error("[CDI ERROR] Falha no fallback legado:", errLegado.message);
      }
    } else if (error) {
      console.error("[CDI ERROR] Falha ao salvar influenciador:", error.message);
    }
  } catch (e) {
    console.error("[CDI ERROR] Exceção ao salvar influenciador:", e);
  }

  // Atualiza cache local
  const current = getStoredInfluenciadores();
  const updated = [inf, ...current.filter((i) => i.id !== inf.id)];
  saveStoredInfluenciadores(updated);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_influenciadores_updated"));
    notifyRealtimeChange("influenciadores", inf);
  }
  return true;
}

export async function deleteInfluenciadorFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("influenciadores")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[CDI ERROR] Falha ao deletar influenciador:", error.message);
    }
  } catch (e) {
    console.error("[CDI ERROR] Exceção ao deletar influenciador:", e);
  }

  const current = getStoredInfluenciadores();
  saveStoredInfluenciadores(current.filter((i) => i.id !== id));

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_influenciadores_updated"));
    notifyRealtimeChange("influenciadores", { id });
  }
  return true;
}

// ─────────────────────────────────────────────
// CRUD — LOCAL (LOCALSTORAGE)
// ─────────────────────────────────────────────

export function getStoredInfluenciadores(): Influenciador[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list.map(mapSupabaseRowToInfluenciador);
      }
    }
  } catch (e) {
    console.error("[CDI] Erro ao ler influenciadores do cache:", e);
  }
  return [];
}

export function saveStoredInfluenciadores(list: Influenciador[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("[CDI] Erro ao salvar influenciadores no cache:", e);
  }
}

// ─────────────────────────────────────────────
// HELPERS DE LINKS DE CHECKOUT
// ─────────────────────────────────────────────

export function addLinkCheckout(
  inf: Influenciador,
  link: Omit<LinkCheckout, "id">
): Influenciador {
  const novo: LinkCheckout = {
    ...link,
    id: "lc-" + Date.now(),
  };
  return { ...inf, linksCheckout: [...inf.linksCheckout, novo] };
}

export function updateLinkCheckout(
  inf: Influenciador,
  linkId: string,
  updates: Partial<Omit<LinkCheckout, "id">>
): Influenciador {
  return {
    ...inf,
    linksCheckout: inf.linksCheckout.map((l) =>
      l.id === linkId ? { ...l, ...updates } : l
    ),
  };
}

export function removeLinkCheckout(inf: Influenciador, linkId: string): Influenciador {
  return {
    ...inf,
    linksCheckout: inf.linksCheckout.filter((l) => l.id !== linkId),
  };
}

export function upsertLinkCheckoutCategoria(
  inf: Influenciador,
  categoriaId: string,
  subItemId: string,
  nome: string,
  url: string
): Influenciador {
  const current = inf.linksCheckout;
  const index = current.findIndex(
    (l) => l.categoriaId === categoriaId && l.subItemId === subItemId
  );

  let updatedLinks: LinkCheckout[];

  if (index >= 0) {
    if (!url.trim()) {
      // Se URL for vazia, remove o link
      updatedLinks = current.filter((_, i) => i !== index);
    } else {
      updatedLinks = [...current];
      updatedLinks[index] = {
        ...updatedLinks[index],
        nome: nome.trim(),
        url: url.trim(),
        ativo: true,
      };
    }
  } else {
    if (!url.trim()) return inf;
    const novo: LinkCheckout = {
      id: `lc_${categoriaId}_${subItemId}_${Date.now()}`,
      categoriaId,
      subItemId,
      nome: nome.trim(),
      url: url.trim(),
      ativo: true,
    };
    updatedLinks = [...current, novo];
  }

  return { ...inf, linksCheckout: updatedLinks };
}
