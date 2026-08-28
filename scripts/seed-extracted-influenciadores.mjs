/**
 * Script para popular/atualizar a base de dados do Supabase (tabela `influenciadores`)
 * garantindo que TODOS os 24 influenciadores tenham as 3 categorias 100% preenchidas:
 * 1. VIP (subItems: Android, iPhone, Emulador)
 * 2. Pack Completo (subItem: Link único)
 * 3. Sensi Permanente (subItem: Link único)
 *
 * Uso: node scripts/seed-extracted-influenciadores.mjs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = "https://smzfetgrxmejhzvxuovv.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtemZldGdyeG1lamh6dnh1b3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAzODMzNiwiZXhwIjoyMTAxNjE0MzM2fQ.ra-nUAtb-hK5FG7bCB8736IODUCf0qxw7AqogTjC1Ug";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Links de backup da planilha caso a página em lote venha com botão duplicado no Framer
const BACKUP_LINKS = {
  "venas-new": {
    "vip:iphone": "https://lastlink.com/p/CBF2FE58C/checkout-payment?af=A35FEC49F",
  },
};

/** Converte nome de produto extraído para categoriaId */
function produtoToCatSub(produto, dispositivo) {
  const p = (produto || "").toLowerCase().trim();
  const d = (dispositivo || "").toLowerCase().trim();

  if (p.includes("sensi permanente") || p.includes("sensi sempre") || p.includes("permanente")) {
    return { cat: "sensi_permanente", sub: "link_unico" };
  }
  if (p.includes("pack completo") || p.includes("pack")) {
    return { cat: "pack_completo", sub: "link_unico" };
  }

  if (d === "android") return { cat: "vip", sub: "android" };
  if (d === "iphone") return { cat: "vip", sub: "iphone" };
  if (d === "emulador") return { cat: "vip", sub: "emulador" };

  return { cat: "pack_completo", sub: "link_unico" };
}

/** Formata o slug do influenciador para nome de exibição limpo */
function slugToNomeExibicao(slug) {
  const customNames = {
    "astorga-new": "Astorga",
    "dak-new": "Dak",
    "drey-new": "Drey",
    "extryze-new": "Extryze",
    "faewl-new": "Faewl",
    "guardian-new": "Guardian",
    "ldzinn-new": "Ldzinn",
    "lia-vendas": "Lia Vendas",
    "macedo-vendas": "Macedo Vendas",
    "manomax-new": "Manomax",
    "mazoti-vendas": "Mazoti Vendas",
    "mendes-new": "Mendes",
    "nawt-new": "Nawt",
    "play-vendas": "Play Vendas",
    "strang-new": "Strang",
    "venas-new": "Venas",
    "wyus-new": "Wyus",
    "xarada-new": "Xarada",
    "xnapp-new": "Xnapp",
    "zbianca-new": "Zbianca",
    "deusa-new": "Deusa",
    "miguel-new": "Miguel",
    "laraxmvp-new": "Lara X MVP",
    "fenix-new": "Fenix",
    "morais-new": "Morais",
    "danone-new": "Danone",
    "nunex-new": "Nunex",
    "madu-new": "Madu",
  };

  if (customNames[slug]) return customNames[slug];

  return slug
    .replace(/-new\d*$/i, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Gera UUID v4 */
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function run() {
  console.log("🏯 Central Hashira — Alimentando Supabase com 3 Categorias (VIP, Pack Completo, Sensi Permanente)\n");

  const csvPath = path.join(process.cwd(), "checkout_links_extracted.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("❌ Arquivo checkout_links_extracted.csv não encontrado. Execute o scraper primeiro.");
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const lines = fileContent.split("\n").map((l) => l.trim()).filter(Boolean);

  if (lines.length < 2) {
    console.error("❌ O arquivo CSV está vazio ou inválido.");
    process.exit(1);
  }

  const influenciadoresMap = new Map();

  for (let i = 1; i < lines.length; i++) {
    const parsed = parseCSVLine(lines[i]);
    if (parsed.length < 4) continue;

    const slug = parsed[0].trim();
    const produto = parsed[1].trim();
    const dispositivo = parsed[2].trim();
    const link = parsed[3].trim();

    if (!slug || !link) continue;

    if (!influenciadoresMap.has(slug)) {
      influenciadoresMap.set(slug, []);
    }

    influenciadoresMap.get(slug).push({ produto, dispositivo, link });
  }

  console.log(`📋 Encontrados ${influenciadoresMap.size} influenciadores com links no CSV.\n`);

  const REQUIRED_SLOTS = [
    { cat: "vip", sub: "android", nome: "ANDROID" },
    { cat: "vip", sub: "iphone", nome: "IPHONE" },
    { cat: "vip", sub: "emulador", nome: "EMULADOR" },
    { cat: "pack_completo", sub: "link_unico", nome: "LINK ÚNICO" },
    { cat: "sensi_permanente", sub: "link_unico", nome: "LINK ÚNICO" },
  ];

  let totalInfluenciadores = 0;
  let totalLinks = 0;
  let erros = 0;

  for (const [slug, extractedLinks] of influenciadoresMap.entries()) {
    const nome = slugToNomeExibicao(slug);

    // Mapeia links extraídos por chave cat:sub
    const slotMap = new Map();
    extractedLinks.forEach((item) => {
      const { cat, sub } = produtoToCatSub(item.produto, item.dispositivo);
      const key = `${cat}:${sub}`;
      if (!slotMap.has(key)) {
        slotMap.set(key, item.link);
      }
    });

    // Se algum slot faltar na extração ao vivo, tenta resgatar do backup
    REQUIRED_SLOTS.forEach((slot) => {
      const key = `${slot.cat}:${slot.sub}`;
      if (!slotMap.has(key) && BACKUP_LINKS[slug] && BACKUP_LINKS[slug][key]) {
        slotMap.set(key, BACKUP_LINKS[slug][key]);
      }
    });

    // Constrói array final de linksCheckout
    const linksCheckout = [];
    REQUIRED_SLOTS.forEach((slot, idx) => {
      const key = `${slot.cat}:${slot.sub}`;
      const url = slotMap.get(key) || "";

      if (url) {
        linksCheckout.push({
          id: `lc_${slot.cat}_${slot.sub}_${Date.now()}_${idx}`,
          categoriaId: slot.cat,
          subItemId: slot.sub,
          nome: slot.nome,
          url,
          ativo: true,
        });
      }
    });

    // Infere slugBase e sufixo de vendas
    const isInterna = slug === "hashira-principal" || slug === "hashira-trafego-pago";
    let slugBase = slug;
    let sufixoVendas = "-new";
    if (isInterna) {
      sufixoVendas = "customizado";
    } else if (slug.endsWith("-new2")) {
      slugBase = slug.replace(/-new2$/, "");
      sufixoVendas = "-new";
    } else if (slug.endsWith("-vendas")) {
      slugBase = slug.replace(/-vendas$/, "");
      sufixoVendas = "-vendas";
    } else if (slug.endsWith("-new")) {
      slugBase = slug.replace(/-new$/, "");
      sufixoVendas = "-new";
    }

    const slugVendas = isInterna ? slug : `${slugBase}${sufixoVendas}`;

    // Busca influenciador existente no Supabase pelo slugBase
    const { data: existing } = await supabase
      .from("influenciadores")
      .select("id, foto_url")
      .or(`slug_bio.eq.${slugBase},slug_bio.eq.${slug}`)
      .maybeSingle();

    const id = existing?.id || generateUUID();
    const fotoUrl = existing?.foto_url || "";

    const row = {
      id,
      nome,
      slug_bio: slugBase,
      slug_principal: slugVendas,
      slug_base: slugBase,
      sufixo_vendas: sufixoVendas,
      slug_vendas_customizado: isInterna ? slug : null,
      eh_conta_interna: isInterna,
      nome_exibicao: nome,
      foto_url: fotoUrl,
      url_base: "hashirasensix.com.br",
      url_arvore: "biohashira.com.br",
      utm_source_padrao: "beacons",
      links_checkout: linksCheckout,
      token_acesso_rapido: generateUUID(),
      ativo: true,
      criado_por: "playwright-scraper-seed",
    };

    let { error } = await supabase
      .from("influenciadores")
      .upsert(row, { onConflict: "id" });

    if (error && error.message?.includes("column")) {
      const rowLegado = { ...row };
      delete rowLegado.slug_base;
      delete rowLegado.sufixo_vendas;
      delete rowLegado.slug_vendas_customizado;
      delete rowLegado.eh_conta_interna;
      delete rowLegado.nome_exibicao;

      const { error: errLegado } = await supabase
        .from("influenciadores")
        .upsert(rowLegado, { onConflict: "id" });
      error = errLegado;
    }

    if (error) {
      console.error(`  ❌ ${nome} (${slug}): ${error.message}`);
      erros++;
    } else {
      const statusIcon = linksCheckout.length === 5 ? "✅" : "⚠️";
      console.log(`  ${statusIcon} ${nome} (${slug}) — ${linksCheckout.length}/5 categorias/sub-itens preenchidos`);
      totalInfluenciadores++;
      totalLinks += linksCheckout.length;
    }
  }

  console.log("\n==================================================");
  console.log("📊 RESUMO DO POVOAMENTO DO BANCO DE DADOS");
  console.log("==================================================");
  console.log(`✅ Influenciadores salvos no Supabase: ${totalInfluenciadores}`);
  console.log(`🔗 Total de links de checkout salvos: ${totalLinks}`);
  if (erros > 0) {
    console.log(`❌ Erros ao salvar: ${erros}`);
  }
  console.log("==================================================\n");

  process.exit(erros > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("Erro inesperado:", e);
  process.exit(1);
});
