import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const SLUGS = [
  "astorga-new",
  "drey-new",
  "extryze-new",
  "faewl-new",
  "ldzinn-new",
  "manomax-new",
  "mazoti-vendas",
  "mendes-new",
  "nawt-new",
  "play-vendas",
  "venas-new",
  "wyus-new",
  "xnapp-new",
  "dak-new",
  "deusa-new",
  "guardian-new",
  "xarada-new",
  "miguel-new",
  "laraxmvp-new",
  "fenix-new",
  "morais-new",
  "danone-new",
  "nunex-new",
  "madu-new"
];

function cleanUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const af = url.searchParams.get("af");
    url.search = "";
    if (af) {
      url.searchParams.set("af", af);
    }
    return url.toString();
  } catch (e) {
    return rawUrl;
  }
}

async function scrapeSlug(context, slug) {
  const url = `https://hashirasensix.com.br/${slug}`;
  const page = await context.newPage();
  const results = [];

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    const rawLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a[href]")).filter((a) => {
        const href = a.getAttribute("href") || "";
        return /lastlink\.com|zouti\.com\.br|checkout/i.test(href);
      });

      return anchors.map((a) => {
        const rawHref = a.getAttribute("href") || "";

        let p = a;
        let cardEl = null;
        while (p.parentElement) {
          p = p.parentElement;
          const txt = (p.innerText || "").trim();
          if (txt.length >= 30 && txt.length <= 1500) {
            cardEl = p;
            break;
          }
        }

        const rawText = cardEl ? cardEl.innerText : "";
        const lines = rawText
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && !/eu quero/i.test(l));

        return {
          href: rawHref,
          lines: lines.slice(0, 6),
          fullText: rawText,
        };
      });
    });

    const seenCleanLinks = new Set();

    for (const item of rawLinks) {
      const cleaned = cleanUrl(item.href);
      if (seenCleanLinks.has(cleaned)) continue;
      seenCleanLinks.add(cleaned);

      const firstLinesText = item.lines.slice(0, 3).join(" ").toLowerCase();
      const firstLine = (item.lines[0] || "").toLowerCase();

      // Determina o dispositivo
      let dispositivo = "Link único";
      if (/\bandroid\b/i.test(firstLine) || (/\bandroid\b/i.test(firstLinesText) && !item.lines.slice(0, 2).some(l => /iphone|emulador/i.test(l)))) {
        dispositivo = "Android";
      } else if (/\biphone\b/i.test(firstLine) || (/\biphone\b/i.test(firstLinesText) && !item.lines.slice(0, 2).some(l => /android|emulador/i.test(l)))) {
        dispositivo = "iPhone";
      } else if (/\bemulador\b/i.test(firstLine) || (/\bemulador\b/i.test(firstLinesText) && !item.lines.slice(0, 2).some(l => /android|iphone/i.test(l)))) {
        dispositivo = "Emulador";
      }

      // Determina o produto baseado estritamente nas primeiras linhas do card específico
      const cardHeaderUpper = item.lines.slice(0, 4).join(" ").toUpperCase();
      let produto = "";

      if (dispositivo !== "Link único" && ["android", "iphone", "emulador"].includes(firstLine)) {
        produto = `(card "${dispositivo.toLowerCase()}")`;
      } else if (cardHeaderUpper.includes("PACK COMPLETO") || cardHeaderUpper.includes("MELHOR PACK")) {
        produto = "PACK COMPLETO";
      } else if (cardHeaderUpper.includes("SENSI PERMANENTE") || cardHeaderUpper.includes("SENSI SEMPRE ATUALIZADA") || cardHeaderUpper.includes("SENSI SEMPRE")) {
        produto = "SENSI permanente";
      } else if (cardHeaderUpper.includes("SENSI PERSONALIZADA")) {
        produto = "SENSI personalizada";
      } else if (cardHeaderUpper.includes("SUPER OTIMIZAÇÃO EMULADOR")) {
        produto = "Super Otimização Emulador";
      } else if (cardHeaderUpper.includes("SUPER OTIMIZAÇÃO MOBILE")) {
        produto = "Super Otimização Mobile";
      } else if (cardHeaderUpper.includes("SUPER OTIMIZAÇÃO")) {
        produto = "Super Otimização";
      } else if (cardHeaderUpper.includes("PLATINA")) {
        produto = "Platina";
      } else if (cardHeaderUpper.includes("VIP")) {
        produto = "VIP";
      } else {
        produto = dispositivo !== "Link único" ? `(card "${dispositivo.toLowerCase()}")` : "Oferta";
      }

      results.push({
        influenciador: slug,
        produto,
        dispositivo,
        link: cleaned,
      });
    }

    return { slug, success: true, links: results, count: results.length };
  } catch (err) {
    return { slug, success: false, error: err.message, links: [], count: 0 };
  } finally {
    await page.close();
  }
}

async function run(slugListFilter = null, concurrencyLimit = 6) {
  const targetSlugs = slugListFilter || SLUGS;
  console.log(`🚀 Iniciando extração de checkout links para ${targetSlugs.length} slugs...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });

  const allResults = [];
  const errors = [];
  let completed = 0;

  const queue = [...targetSlugs];
  const workers = Array(Math.min(concurrencyLimit, targetSlugs.length))
    .fill(0)
    .map(async () => {
      while (queue.length > 0) {
        const slug = queue.shift();
        if (!slug) break;

        const res = await scrapeSlug(context, slug);
        completed++;

        if (res.success) {
          allResults.push(...res.links);
          console.log(`[${completed}/${targetSlugs.length}] ✅ ${slug} — ${res.count} links extraídos`);
        } else {
          errors.push({ slug, error: res.error });
          console.error(`[${completed}/${targetSlugs.length}] ❌ ${slug} — Erro: ${res.error}`);
        }
      }
    });

  await Promise.all(workers);
  await browser.close();

  // Exportação para CSV
  const csvLines = ["Influenciador,Produto,Dispositivo,Link de checkout"];
  for (const r of allResults) {
    const safeInf = `"${r.influenciador.replace(/"/g, '""')}"`;
    const safeProd = `"${r.produto.replace(/"/g, '""')}"`;
    const safeDisp = `"${r.dispositivo.replace(/"/g, '""')}"`;
    const safeLink = `"${r.link.replace(/"/g, '""')}"`;
    csvLines.push(`${safeInf},${safeProd},${safeDisp},${safeLink}`);
  }

  const csvContent = csvLines.join("\n");
  const outputPath = path.join(process.cwd(), "checkout_links_extracted.csv");
  fs.writeFileSync(outputPath, csvContent, "utf-8");

  console.log("\n==================================================");
  console.log("📊 RESUMO DA EXTRAÇÃO");
  console.log("==================================================");
  console.log(`✅ Processados com sucesso: ${targetSlugs.length - errors.length}/${targetSlugs.length}`);
  console.log(`❌ Páginas com erro: ${errors.length}`);
  console.log(`🔗 Total de links extraídos: ${allResults.length}`);
  console.log(`📁 Arquivo CSV salvo em: ${outputPath}`);

  if (errors.length > 0) {
    console.log("\n⚠️ Páginas não processadas / Erros:");
    errors.forEach((e) => console.log(`  - ${e.slug}: ${e.error}`));
  }

  return { allResults, errors, csvContent, outputPath };
}

const args = process.argv.slice(2);
const singleSlugArg = args.find((a) => a.startsWith("--slug="));

if (singleSlugArg) {
  const slugVal = singleSlugArg.split("=")[1];
  run([slugVal], 1);
} else {
  run(null, 6);
}
