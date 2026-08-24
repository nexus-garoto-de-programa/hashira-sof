/**
 * Script para popular/atualizar a base de dados do Supabase (tabela `influenciadores`)
 * utilizando os 125 links extraídos de 24 influenciadores via Playwright scraper.
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

/** Converte nome de produto extraído para categoriaId */
function produtoToCategoriaId(produto, dispositivo) {
  const p = (produto || "").toLowerCase().trim();
  if (p.includes("platina")) return "platina";
  if (p.includes("vip")) return "vip";

  // Se o card for por dispositivo (ex: card "android"), usa "vip" por padrão
  if (dispositivo === "Android" || dispositivo === "iPhone" || dispositivo === "Emulador") {
    return "vip";
  }
  return "pack_completo";
}

/** Converte dispositivo para subItemId */
function dispositivoToSubItemId(dispositivo) {
  const d = (dispositivo || "").toLowerCase().trim();
  if (d === "android") return "android";
  if (d === "iphone") return "iphone";
  if (d === "emulador") return "emulador";
  return "link_unico";
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
  console.log("🏯 Central Hashira — Alimentando Supabase com links extraídos\n");

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

  // Agrupa os links por slug do influenciador
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

  let totalInfluenciadores = 0;
  let totalLinks = 0;
  let erros = 0;

  for (const [slug, extractedLinks] of influenciadoresMap.entries()) {
    const nome = slugToNomeExibicao(slug);

    // Mapeia cada link para o formato LinkCheckout[] da aplicação
    const linksCheckout = extractedLinks.map((item, idx) => {
      const categoriaId = produtoToCategoriaId(item.produto, item.dispositivo);
      const subItemId = dispositivoToSubItemId(item.dispositivo);

      return {
        id: `lc_${categoriaId}_${subItemId}_${Date.now()}_${idx}`,
        categoriaId,
        subItemId,
        nome: item.dispositivo.toUpperCase(),
        url: item.link,
        ativo: true,
      };
    });

    // Busca influenciador existente no Supabase pelo slug_bio
    const { data: existing } = await supabase
      .from("influenciadores")
      .select("id, foto_url")
      .eq("slug_bio", slug)
      .maybeSingle();

    const id = existing?.id || generateUUID();
    const fotoUrl = existing?.foto_url || "";

    const row = {
      id,
      nome,
      slug_bio: slug,
      slug_principal: slug,
      foto_url: fotoUrl,
      url_base: "hashirasensix.com.br",
      url_arvore: "biohashira.com.br",
      utm_source_padrao: "beacons",
      links_checkout: linksCheckout,
      token_acesso_rapido: generateUUID(),
      ativo: true,
      criado_por: "playwright-scraper-seed",
    };

    const { error } = await supabase
      .from("influenciadores")
      .upsert(row, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ ${nome} (${slug}): ${error.message}`);
      erros++;
    } else {
      console.log(`  ✅ ${nome} (${slug}) — ${linksCheckout.length} links inseridos/atualizados`);
      totalInfluenciadores++;
      totalLinks += linksCheckout.length;
    }
  }

  console.log("\n==================================================");
  console.log("📊 RESUMO DO POVOAMENTO DO BANCO DE DADOS");
  console.log("==================================================");
  console.log(`✅ Influenciadores salvos no Supabase: ${totalInfluenciadores}`);
  console.log(`🔗 Total de links de checkout atualizados: ${totalLinks}`);
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
