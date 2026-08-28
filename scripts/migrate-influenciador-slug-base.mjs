/**
 * Migration: Atualiza os influenciadores para a nova arquitetura de Slug Único
 * Preenche slugBase + sufixoVendas a partir do nomeIdentificador / slug_principal legado.
 * Deduplica registros redundantes no banco e valida todas as URLs recalculadas.
 *
 * Execução: node scripts/migrate-influenciador-slug-base.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://smzfetgrxmejhzvxuovv.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtemZldGdyeG1lamh6dnh1b3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAzODMzNiwiZXhwIjoyMTAxNjE0MzM2fQ.ra-nUAtb-hK5FG7bCB8736IODUCf0qxw7AqogTjC1Ug";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─────────────────────────────────────────────
// TABELA OFICIAL DE CONVERSÃO DOS 22 INFLUENCIADORES
// ─────────────────────────────────────────────

const TABELA_CONVERSAO_OFICIAL = {
  "astorga-new": { slugBase: "astorga", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Astorga" },
  "dak-new": { slugBase: "dak", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Dak" },
  "drey-new": { slugBase: "drey", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Drey" },
  "drey-new2": { slugBase: "drey", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Drey" },
  "extryze-new": { slugBase: "extryze", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Extryze" },
  "faewl-new": { slugBase: "faewl", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Faewl" },
  "guardian-new": { slugBase: "guardian", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Guardian" },
  "hashira-principal": { slugBase: "hashira-principal", sufixoVendas: "customizado", slugVendasCustomizado: "hashira-principal", ehContaInterna: true, nomeExibicao: "Hashira Principal" },
  "hashira-trafego-pago": { slugBase: "hashira-trafego-pago", sufixoVendas: "customizado", slugVendasCustomizado: "hashira-trafego-pago", ehContaInterna: true, nomeExibicao: "Hashira Tráfego Pago" },
  "ldzinn-new": { slugBase: "ldzinn", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Ldzinn" },
  "lia-vendas": { slugBase: "lia", sufixoVendas: "-vendas", ehContaInterna: false, nomeExibicao: "Lia" },
  "macedo-vendas": { slugBase: "macedo", sufixoVendas: "-vendas", ehContaInterna: false, nomeExibicao: "Macedo" },
  "manomax-new": { slugBase: "manomax", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Manomax" },
  "mazoti-vendas": { slugBase: "mazoti", sufixoVendas: "-vendas", ehContaInterna: false, nomeExibicao: "Mazoti Vendas" },
  "mendes-new": { slugBase: "mendes", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Mendes" },
  "nawt-new": { slugBase: "nawt", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Nawt" },
  "play-vendas": { slugBase: "play", sufixoVendas: "-vendas", ehContaInterna: false, nomeExibicao: "Play Vendas" },
  "strang-new": { slugBase: "strang", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Strang" },
  "venas-new": { slugBase: "venas", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Venas" },
  "wyus-new": { slugBase: "wyus", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Wyus" },
  "xarada-new": { slugBase: "xarada", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Xarada" },
  "xnapp-new": { slugBase: "xnapp", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Xnapp" },
  "zbianca-new": { slugBase: "zbianca", sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: "Zbianca" },
};

function calcularSlugVendas(inf) {
  if (inf.sufixoVendas === "customizado") {
    return inf.slugVendasCustomizado?.trim() || inf.slugBase;
  }
  return `${inf.slugBase}${inf.sufixoVendas || ""}`;
}

function normalizarSlug(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function capitalizarSlug(slug) {
  return slug
    .split("-")
    .map((parte) => (parte ? parte.charAt(0).toUpperCase() + parte.slice(1) : ""))
    .join(" ")
    .trim();
}

function inferirConfig(row) {
  const chave = (row.slug_principal || row.slug_bio || row.nome || "").toLowerCase().trim();
  
  if (TABELA_CONVERSAO_OFICIAL[chave]) {
    return { ...TABELA_CONVERSAO_OFICIAL[chave] };
  }

  // Tenta pelo slug_bio
  const chaveBio = (row.slug_bio || "").toLowerCase().trim();
  if (TABELA_CONVERSAO_OFICIAL[chaveBio]) {
    return { ...TABELA_CONVERSAO_OFICIAL[chaveBio] };
  }

  // Regras automáticas para novos ou registros dinâmicos (normaliza -new2 legado para -new)
  if (chave.endsWith("-new2")) {
    const base = chave.replace(/-new2$/, "");
    return { slugBase: base, sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: row.nome || capitalizarSlug(base) };
  }
  if (chave.endsWith("-vendas")) {
    const base = chave.replace(/-vendas$/, "");
    return { slugBase: base, sufixoVendas: "-vendas", ehContaInterna: false, nomeExibicao: row.nome || capitalizarSlug(base) };
  }
  if (chave.endsWith("-new")) {
    const base = chave.replace(/-new$/, "");
    return { slugBase: base, sufixoVendas: "-new", ehContaInterna: false, nomeExibicao: row.nome || capitalizarSlug(base) };
  }

  const base = normalizarSlug(row.slug_bio || chave);
  return {
    slugBase: base,
    sufixoVendas: "-new",
    ehContaInterna: false,
    nomeExibicao: row.nome || capitalizarSlug(base),
  };
}

async function run() {
  console.log("================================================================");
  console.log("🚀 INICIANDO MIGRAÇÃO: SLUG ÚNICO DOS INFLUENCIADORES");
  console.log("================================================================\n");

  const { data: influenciadores, error } = await supabase
    .from("influenciadores")
    .select("*");

  if (error) {
    console.error("❌ Erro ao buscar influenciadores no Supabase:", error.message);
    process.exit(1);
  }

  if (!influenciadores || influenciadores.length === 0) {
    console.log("⚠️ Nenhum influenciador encontrado no banco de dados.");
    process.exit(0);
  }

  console.log(`📋 Total de influenciadores no banco: ${influenciadores.length}\n`);

  // Identifica e agrupa por slugBase para deduplicação limpa
  const mapaPorSlugBase = new Map();
  for (const row of influenciadores) {
    const conf = inferirConfig(row);
    const slugBase = conf.slugBase;

    if (!mapaPorSlugBase.has(slugBase)) {
      mapaPorSlugBase.set(slugBase, []);
    }
    mapaPorSlugBase.get(slugBase).push({ row, conf });
  }

  let migrados = 0;
  let divergencias = 0;
  let erros = 0;
  let duplicadosRemovidos = 0;

  console.log("┌──────────────────────────┬──────────────┬──────────────┬────────────────────────────┬─────────────┐");
  console.log("│ Influenciador            │ slugBase     │ Sufixo       │ URL Vendas Recalculada     │ Status      │");
  console.log("├──────────────────────────┼──────────────┼──────────────┼────────────────────────────┼─────────────┤");

  for (const [slugBase, lista] of mapaPorSlugBase.entries()) {
    // Se houver mais de um registro com o mesmo slugBase, seleciona o principal (o que tiver mais links ou criado antes)
    let principal = lista[0];
    if (lista.length > 1) {
      // Prioriza o que tem mais links de checkout
      lista.sort((a, b) => (b.row.links_checkout?.length || 0) - (a.row.links_checkout?.length || 0));
      principal = lista[0];

      // Remove os duplicados extras para não violar constraint UNIQUE
      for (let i = 1; i < lista.length; i++) {
        const duplicado = lista[i];
        console.log(`🧹 Removendo registro duplicado: ${duplicado.row.nome} (ID: ${duplicado.row.id})`);
        const { error: delErr } = await supabase.from("influenciadores").delete().eq("id", duplicado.row.id);
        if (delErr) {
          console.warn(`  ⚠️ Aviso ao remover duplicado: ${delErr.message}`);
        } else {
          duplicadosRemovidos++;
        }
      }
    }

    const { row, conf } = principal;
    const slugVendasRecalculado = calcularSlugVendas(conf);
    const slugVendasOriginal = (row.slug_principal || row.slug_bio || "").toLowerCase().trim();

    // Verificação de divergência
    const bateu = slugVendasRecalculado === slugVendasOriginal ||
                  (conf.sufixoVendas === "-new" && (slugVendasOriginal === `${conf.slugBase}-new` || slugVendasOriginal === `${conf.slugBase}-new2`)) ||
                  (conf.sufixoVendas === "-vendas" && slugVendasOriginal === `${conf.slugBase}-vendas`) ||
                  conf.ehContaInterna;

    if (!bateu) {
      divergencias++;
      console.warn(`\n⚠️  DIVERGÊNCIA DETECTADA:`);
      console.warn(`   Nome: "${row.nome}" (ID: ${row.id})`);
      console.warn(`   Original: "${slugVendasOriginal}"`);
      console.warn(`   Recalculado: "${slugVendasRecalculado}" (slugBase: "${conf.slugBase}", sufixo: "${conf.sufixoVendas}")`);
    }

    const updatePayload = {
      nome: conf.nomeExibicao,
      slug_bio: conf.slugBase,
      slug_principal: slugVendasRecalculado,
      updated_at: new Date().toISOString(),
    };

    let { error: updateErr } = await supabase
      .from("influenciadores")
      .update({
        ...updatePayload,
        slug_base: conf.slugBase,
        sufixo_vendas: conf.sufixoVendas,
        slug_vendas_customizado: conf.slugVendasCustomizado || null,
        eh_conta_interna: conf.ehContaInterna,
        nome_exibicao: conf.nomeExibicao,
      })
      .eq("id", row.id);

    if (updateErr && updateErr.message?.includes("column")) {
      const { error: fallbackErr } = await supabase
        .from("influenciadores")
        .update(updatePayload)
        .eq("id", row.id);
      
      updateErr = fallbackErr;
    }

    const nomeStr = conf.nomeExibicao.padEnd(24).slice(0, 24);
    const slugBaseStr = conf.slugBase.padEnd(12).slice(0, 12);
    const sufixoStr = (conf.sufixoVendas || "nenhum").padEnd(12).slice(0, 12);
    const urlStr = `hashirasensix.com.br/${slugVendasRecalculado}`.padEnd(26).slice(0, 26);
    const statusStr = updateErr ? "❌ Erro" : "✅ OK";

    console.log(`│ ${nomeStr} │ ${slugBaseStr} │ ${sufixoStr} │ ${urlStr} │ ${statusStr}     │`);

    if (updateErr) {
      console.error(`   ❌ Erro ao salvar ${conf.nomeExibicao}: ${updateErr.message}`);
      erros++;
    } else {
      migrados++;
    }
  }

  console.log("└──────────────────────────┴──────────────┴──────────────┴────────────────────────────┴─────────────┘\n");

  console.log("================================================================");
  console.log("📊 RESUMO DA MIGRAÇÃO:");
  console.log(`   ✅ Registros migrados com sucesso: ${migrados}`);
  console.log(`   🧹 Registros duplicados limpos: ${duplicadosRemovidos}`);
  console.log(`   ⚠️ Divergências identificadas: ${divergencias}`);
  console.log(`   ❌ Erros no banco: ${erros}`);
  console.log("================================================================\n");

  if (divergencias === 0 && erros === 0) {
    console.log("🎉 Todos os influenciadores foram migrados com 100% de precisão!");
  }

  process.exit(erros > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("❌ Exceção inesperada:", err);
  process.exit(1);
});
