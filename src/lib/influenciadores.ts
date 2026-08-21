import { supabase } from "@/lib/supabase";
import { notifyRealtimeChange } from "@/lib/realtimeSync";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface LinkCheckout {
  id: string;
  nome: string;   // ex: "Produto X - Oferta Principal"
  url: string;    // link Lastlink
  ativo: boolean;
}

export interface Influenciador {
  id: string;
  nome: string;
  slugBio: string;          // slug usado na árvore biohashira.com.br/{slugBio}
  slugPrincipal: string;    // slug para utm_content
  fotoUrl: string;
  urlBase: string;          // domínio base do site de vendas (ex: "hashirasensix.com.br")
  urlArvore: string;        // domínio da árvore de links (padrão: "biohashira.com.br")
  utmSourcePadrao: string;  // padrão: "beacons"
  linksCheckout: LinkCheckout[];
  tokenAcessoRapido: string;
  ativo: boolean;
  criadoPor: string;
  criadoEm: string;
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

// ─────────────────────────────────────────────
// HELPERS DE GERAÇÃO
// ─────────────────────────────────────────────

/** Gera um slug a partir do nome (minúsculo, sem espaços, sem acentos) */
export function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  return PLATAFORMAS.map((p) => {
    const params = new URLSearchParams({
      utm_source: inf.utmSourcePadrao || "beacons",
      utm_medium: p.utm_medium,
      utm_content: inf.slugPrincipal,
    });
    const base = inf.urlBase.replace(/\/$/, "");
    const slug = inf.slugPrincipal;
    return {
      plataforma: p.id,
      label: p.label,
      icone: p.icone,
      utmSource: inf.utmSourcePadrao || "beacons",
      utmMedium: p.utm_medium,
      utmContent: inf.slugPrincipal,
      urlCompleta: `https://${base}/${slug}?${params.toString()}`,
    };
  });
}

/** Gera a árvore de links biohashira */
export function generateArvoreLinks(inf: Influenciador): ArvoreLink[] {
  const arvore = (inf.urlArvore || "biohashira.com.br").replace(/\/$/, "");
  const slug = inf.slugBio;
  return PLATAFORMAS.map((p) => ({
    plataforma: p.id,
    label: p.label,
    sufixo: p.sufixo,
    urlCompleta: `https://${arvore}/${slug}/${p.sufixo}`,
  }));
}

/** URL raiz da árvore */
export function getArvoreRaiz(inf: Influenciador): string {
  const arvore = (inf.urlArvore || "biohashira.com.br").replace(/\/$/, "");
  return `https://${arvore}/${inf.slugBio}`;
}

// ─────────────────────────────────────────────
// MAPEAMENTOS
// ─────────────────────────────────────────────

export function mapSupabaseRowToInfluenciador(row: any): Influenciador {
  return {
    id: String(row.id),
    nome: row.nome || "",
    slugBio: row.slug_bio || row.slugBio || "",
    slugPrincipal: row.slug_principal || row.slugPrincipal || "",
    fotoUrl: row.foto_url || row.fotoUrl || "",
    urlBase: row.url_base || row.urlBase || "hashirasensix.com.br",
    urlArvore: row.url_arvore || row.urlArvore || "biohashira.com.br",
    utmSourcePadrao: row.utm_source_padrao || row.utmSourcePadrao || "beacons",
    linksCheckout: Array.isArray(row.links_checkout) ? row.links_checkout : [],
    tokenAcessoRapido: row.token_acesso_rapido || row.tokenAcessoRapido || "",
    ativo: row.ativo ?? true,
    criadoPor: row.criado_por || row.criadoPor || "",
    criadoEm: row.created_at || row.criado_em || new Date().toISOString(),
  };
}

export function mapInfluenciadorToSupabaseRow(inf: Influenciador) {
  return {
    id: inf.id,
    nome: inf.nome,
    slug_bio: inf.slugBio,
    slug_principal: inf.slugPrincipal,
    foto_url: inf.fotoUrl,
    url_base: inf.urlBase,
    url_arvore: inf.urlArvore,
    utm_source_padrao: inf.utmSourcePadrao,
    links_checkout: inf.linksCheckout,
    token_acesso_rapido: inf.tokenAcessoRapido,
    ativo: inf.ativo,
    criado_por: inf.criadoPor,
  };
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
    const { error } = await supabase
      .from("influenciadores")
      .upsert(row, { onConflict: "id" });

    if (error) {
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
    if (raw) return JSON.parse(raw) as Influenciador[];
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
