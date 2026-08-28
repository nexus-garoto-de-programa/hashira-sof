/**
 * Seed: Importação em massa de 22 influenciadores e 170 links de checkout
 * Extraídos da planilha hashiralinkscheckout.xlsx
 *
 * Uso: node scripts/seed-influenciadores.mjs
 *
 * Idempotente — pode ser reexecutado sem duplicar registros.
 * Usa slug_bio (= nomeIdentificador) como chave de deduplicação.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://smzfetgrxmejhzvxuovv.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtemZldGdyeG1lamh6dnh1b3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAzODMzNiwiZXhwIjoyMTAxNjE0MzM2fQ.ra-nUAtb-hK5FG7bCB8736IODUCf0qxw7AqogTjC1Ug";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Converte nome de produto da planilha para categoriaId do sistema */
function produtoToCategoriaId(produto) {
  const map = {
    "Platina": "platina",
    "VIP": "vip",
    "Pack Completo": "pack_completo",
    "Sensi Permanente": "sensi_permanente",
    "Sensi Personalizada": "sensi_personalizada",
    "Super Otimização Emulador": "super_otimizacao_emulador",
    "Super Otimização Mobile": "super_otimizacao_mobile",
  };
  return map[produto] || produto.toLowerCase().replace(/\s+/g, "_");
}

/** Converte nome de dispositivo da planilha para subItemId do sistema */
function dispositivoToSubItemId(dispositivo) {
  const map = {
    "Android": "android",
    "iPhone": "iphone",
    "Emulador": "emulador",
    "Link único": "link_unico",
  };
  return map[dispositivo] || dispositivo.toLowerCase().replace(/\s+/g, "_");
}

/** Gera UUID v4 simples */
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─────────────────────────────────────────────
// SEED DATA — 22 influenciadores, 170 links
// URLs exatamente como na planilha, sem alterações
// ─────────────────────────────────────────────

const SEED_DATA = [
  {
    "nomeIdentificador": "astorga-new",
    "nomeExibicao": "Astorga",
    "totalLinks": 6,
    "checkoutLinks": [
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/CDEB5F687/checkout-payment?af=A616661AC" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C822EEB7E/checkout-payment?af=A1E21E7CB" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CA32DFE66/checkout-payment?af=A4C96436F" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/CBE451EA7/checkout-payment?af=A23040B60" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CFDEAD457/checkout-payment?af=A366850AB" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CAA571D8E/checkout-payment?af=A9E11C1DB" }
    ]
  },
  {
    "nomeIdentificador": "dak-new",
    "nomeExibicao": "Dak",
    "totalLinks": 7,
    "checkoutLinks": [
      { "produto": "Pack Completo", "dispositivo": "Link único", "link": "https://lastlink.com/p/C54BD4934/checkout-payment?af=A8435042C" },
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C3E5ADD88?af=A111274D3" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C93D76C9C?af=AEABF4EE6" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CF18A3654?af=AFCC2D434" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C06E3273A?af=A486254D7" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CCE8F4AFE?af=AAEFD2241" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C44E91C36?af=AB4EA6F03" }
    ]
  },
  {
    "nomeIdentificador": "drey-new",
    "nomeExibicao": "Drey",
    "totalLinks": 6,
    "checkoutLinks": [
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/CC17BD99B/checkout-payment?af=A366BF7E9" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C9B71DD20/checkout-payment?af=AAC9F2519" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CB7781912/checkout-payment?af=AF8CB1509" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/CB3A7098C/checkout-payment?af=AB4D65643" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CAB88112A/checkout-payment?af=A9FA1D35D" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CC7F13D7F/checkout-payment?af=ADC886819" }
    ]
  },
  {
    "nomeIdentificador": "extryze-new",
    "nomeExibicao": "Extryze",
    "totalLinks": 6,
    "checkoutLinks": [
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C5AA78D0A/checkout-payment?af=A13A2359B" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CC4A7FC12/checkout-payment?af=ABEB2F500" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C46237463/checkout-payment?af=AF928FFF2" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C5103DF16/checkout-payment?af=A7F57176C" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CA5F2E95F/checkout-payment?af=A41FD5E75" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C5222CB0B/checkout-payment?af=A9B3AFF59" }
    ]
  },
  {
    "nomeIdentificador": "faewl-new",
    "nomeExibicao": "Faewl",
    "totalLinks": 6,
    "checkoutLinks": [
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C4DE0BBEE/checkout-payment?af=A69FEE0D2" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CB88C6E7F/checkout-payment?af=AD9CC7770" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C11CE182E/checkout-payment?af=AC57C3449" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C774224C2/checkout-payment?af=A343AEE66" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CA0E9D791/checkout-payment?af=A6B479148" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C89B9BB47/checkout-payment?af=A515E466D" }
    ]
  },
  {
    "nomeIdentificador": "guardian-new",
    "nomeExibicao": "Guardian",
    "totalLinks": 6,
    "checkoutLinks": [
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C1CD405BE/checkout-payment/" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C2BA1EA7E/checkout-payment/" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C76C85203/checkout-payment/" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/CCD24E1AD/checkout-payment/" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C915AC544/checkout-payment/" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C2A74CB39/checkout-payment/" }
    ]
  },
  {
    "nomeIdentificador": "hashira-principal",
    "nomeExibicao": "Hashira Principal",
    "totalLinks": 11,
    "checkoutLinks": [
      { "produto": "Super Otimização Emulador", "dispositivo": "Link único", "link": "https://lastlink.com/p/CE7149994/checkout-payment" },
      { "produto": "Super Otimização Mobile", "dispositivo": "Link único", "link": "https://lastlink.com/p/CD38F63CA/checkout-payment" },
      { "produto": "Pack Completo", "dispositivo": "Link único", "link": "https://lastlink.com/p/C25E963F9/checkout-payment" },
      { "produto": "Sensi Permanente", "dispositivo": "Link único", "link": "https://lastlink.com/p/C55267AC7/checkout-payment" },
      { "produto": "Sensi Personalizada", "dispositivo": "Link único", "link": "https://lastlink.com/p/C00847792/checkout-payment" },
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C0F33F68D/checkout-payment" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C04D6D62E/checkout-payment" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C2EB8F191/checkout-payment" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/CF0609F54/checkout-payment" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CB2651927/checkout-payment" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C9D78132C/checkout-payment" }
    ]
  },
  {
    "nomeIdentificador": "hashira-trafego-pago",
    "nomeExibicao": "Hashira Trafego Pago",
    "totalLinks": 11,
    "checkoutLinks": [
      { "produto": "Super Otimização Emulador", "dispositivo": "Link único", "link": "https://lastlink.com/p/C59581DFE/checkout-payment" },
      { "produto": "Super Otimização Mobile", "dispositivo": "Link único", "link": "https://lastlink.com/p/CC280FA64/checkout-payment" },
      { "produto": "Pack Completo", "dispositivo": "Link único", "link": "https://lastlink.com/p/C46757DB0/checkout-payment" },
      { "produto": "Sensi Permanente", "dispositivo": "Link único", "link": "https://lastlink.com/p/C1E634DF6/checkout-payment" },
      { "produto": "Sensi Personalizada", "dispositivo": "Link único", "link": "https://lastlink.com/p/CDFCD4981/checkout-payment" },
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C93583C83/checkout-payment" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C6933AC34/checkout-payment" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C18D89A02/checkout-payment" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C59ED51E0/checkout-payment" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CF1D6CA9C/checkout-payment" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C63000FD5/checkout-payment" }
    ]
  },
  {
    "nomeIdentificador": "ldzinn-new",
    "nomeExibicao": "Ldzinn",
    "totalLinks": 6,
    "checkoutLinks": [
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C6DC31D48/checkout-payment?af=A0F027387" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CBD4F9E94/checkout-payment?af=AD63BC386" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C893964C3/checkout-payment?af=AB7C2B0AE" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C0D8A7268/checkout-payment?af=A6F786517" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C9BD699A5/checkout-payment?af=AC7325BA6" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CCDF3E1E5/checkout-payment?af=A5F6F89D8" }
    ]
  },
  {
    "nomeIdentificador": "lia-vendas",
    "nomeExibicao": "Lia Vendas",
    "totalLinks": 10,
    "checkoutLinks": [
      { "produto": "Super Otimização Emulador", "dispositivo": "Link único", "link": "https://lastlink.com/p/CF50BF937/checkout-payment?af=AFF6BBCD4" },
      { "produto": "Pack Completo", "dispositivo": "Link único", "link": "https://lastlink.com/p/C9153003B?af=AE67CEA22" },
      { "produto": "Sensi Permanente", "dispositivo": "Link único", "link": "https://lastlink.com/p/C44EDDBA9/checkout-payment?af=A1745F2D7" },
      { "produto": "Sensi Personalizada", "dispositivo": "Link único", "link": "https://lastlink.com/p/C67B0C55E/checkout-payment?af=A35A32446" },
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/CA1A685BB/checkout-payment?af=AB1C7D03D" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C5E236551/checkout-payment?af=A137C3587" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C812B28E2/checkout-payment?af=A9D867F4E" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C32D8088F/checkout-payment?af=ADF5F1182" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C14628870/checkout-payment?af=AE7554661" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C238617BD/checkout-payment?af=AE66B9D90" }
    ]
  },
  {
    "nomeIdentificador": "macedo-vendas",
    "nomeExibicao": "Macedo Vendas",
    "totalLinks": 11,
    "checkoutLinks": [
      { "produto": "Super Otimização Emulador", "dispositivo": "Link único", "link": "https://pay.zouti.com.br/checkout?poi=prod_offer_jnd1imuj1p5vxnh2cbqn1q" },
      { "produto": "Super Otimização Mobile", "dispositivo": "Link único", "link": "https://lastlink.com/p/CF50BF937/checkout-payment?af=A840F87B0" },
      { "produto": "Pack Completo", "dispositivo": "Link único", "link": "https://lastlink.com/p/C7F888A81/checkout-payment" },
      { "produto": "Sensi Permanente", "dispositivo": "Link único", "link": "https://lastlink.com/p/C72289D66/checkout-payment?af=A8FB3E7A9" },
      { "produto": "Sensi Personalizada", "dispositivo": "Link único", "link": "https://lastlink.com/p/C67B0C55E/checkout-payment?af=A58E48157" },
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/CE28F3D50/checkout-payment?af=AC7AD0E83" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C50E87A47/checkout-payment?af=AD490176D" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C8BCF5853/checkout-payment?af=A0D96B2B9" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C0A103FBF/checkout-payment?af=ADEE8031D" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CBEC72C1E/checkout-payment?af=A1CC9584E" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C19D1793D/checkout-payment?af=AA1F5CD3F" }
    ]
  },
  {
    "nomeIdentificador": "manomax-new",
    "nomeExibicao": "Manomax",
    "totalLinks": 6,
    "checkoutLinks": [
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/CD638E2BD/checkout-payment?af=AD2E7D582" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CB1FCD46C/checkout-payment?af=A3D00146F" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C77227C3C/checkout-payment?af=AA12147C3" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/CDFA080F3/checkout-payment?af=A81853074" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C067C6DB7/checkout-payment?af=AFF5778F9" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C8AB55390/checkout-payment?af=AEF2A4687" }
    ]
  },
  {
    "nomeIdentificador": "mazoti-vendas",
    "nomeExibicao": "Mazoti Vendas",
    "totalLinks": 11,
    "checkoutLinks": [
      { "produto": "Super Otimização Emulador", "dispositivo": "Link único", "link": "https://pay.zouti.com.br/checkout?poi=prod_offer_jnd1imuj1p5vxnh2cbqn1q" },
      { "produto": "Super Otimização Mobile", "dispositivo": "Link único", "link": "https://lastlink.com/p/CF50BF937/checkout-payment?af=AA085A344" },
      { "produto": "Pack Completo", "dispositivo": "Link único", "link": "https://lastlink.com/p/C25E963F9?af=AFE515E7E" },
      { "produto": "Sensi Permanente", "dispositivo": "Link único", "link": "https://lastlink.com/p/C36F98178/checkout-payment?af=AE0FE973F" },
      { "produto": "Sensi Personalizada", "dispositivo": "Link único", "link": "https://lastlink.com/p/C85A7D4A5/" },
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/CDAEE6B03/checkout-payment?af=AE7E4EC63" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C28092889/checkout-payment?af=A7F497F90" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C5F273B18/checkout-payment?af=AAB383629" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C8262C0AE/checkout-payment?af=A5FE8B59E" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C30857846/checkout-payment?af=AEE4BADEC" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CEA311D4F/checkout-payment?af=AC17386FD" }
    ]
  },
  {
    "nomeIdentificador": "mendes-new",
    "nomeExibicao": "Mendes",
    "totalLinks": 6,
    "checkoutLinks": [
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/CAFE30D60/checkout-payment?af=AE820E610" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CD90E218E/checkout-payment?af=A09F7EB6B" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C0EAACE68/checkout-payment?af=AA3E784BD" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C99CA5C3F/checkout-payment?af=A1B016B28" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C92FD8972/checkout-payment?af=A7128BDD7" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C210A51D4/checkout-payment?af=A9F893F1B" }
    ]
  },
  {
    "nomeIdentificador": "nawt-new",
    "nomeExibicao": "Nawt",
    "totalLinks": 6,
    "checkoutLinks": [
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C6180729C/checkout-payment?af=A60F59ACE" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CE4267D69/checkout-payment?af=A63A2CB95" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CC15E32D3/checkout-payment?af=A1ED22F74" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/CCB5B6342/checkout-payment?af=A4D681125" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CB1081595/checkout-payment?af=A12A6D7A3" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CCB9A6331/checkout-payment?af=A9F2CDED0" }
    ]
  },
  {
    "nomeIdentificador": "play-vendas",
    "nomeExibicao": "Play Vendas",
    "totalLinks": 10,
    "checkoutLinks": [
      { "produto": "Super Otimização Emulador", "dispositivo": "Link único", "link": "https://pay.zouti.com.br/checkout?poi=prod_offer_jnd1imuj1p5vxnh2cbqn1q" },
      { "produto": "Pack Completo", "dispositivo": "Link único", "link": "https://lastlink.com/p/C04FFC02C/checkout-payment?af=ABBC40805" },
      { "produto": "Sensi Permanente", "dispositivo": "Link único", "link": "https://lastlink.com/p/C588F78D7/checkout-payment?af=AA511D2BF" },
      { "produto": "Sensi Personalizada", "dispositivo": "Link único", "link": "https://lastlink.com/p/C67B0C55E/checkout-payment?af=A4892EDB5" },
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/CB8C3AA81/checkout-payment?af=A75237BCE" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C1087F0A6/checkout-payment?af=AB888F8FA" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C19C28D31/checkout-payment?af=AE0B712F5" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/CE0F30EAA/checkout-payment?af=AC66EE9A9" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CDB277158/checkout-payment?af=A3A5C7908" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C12E95650/checkout-payment?af=AD54CB472" }
    ]
  },
  {
    "nomeIdentificador": "strang-new",
    "nomeExibicao": "Strang",
    "totalLinks": 6,
    "checkoutLinks": [
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C16F8731B/checkout-payment?af=AE4391789" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C57A12052/checkout-payment?af=AC321EFE0" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C42B55B24/checkout-payment?af=A3CF3F938" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C5A8BF37E/checkout-payment?af=A72EB06F4" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C8E8FDB4B/checkout-payment?af=A3B66BE40" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C4035F961/checkout-payment?af=AC3BFFE46" }
    ]
  },
  {
    "nomeIdentificador": "venas-new",
    "nomeExibicao": "Venas",
    "totalLinks": 6,
    "checkoutLinks": [
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C8DDA0D69/checkout-payment?af=A7E905326" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C71A260A1/checkout-payment?af=AB5C2ACBB" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C59B8C710/checkout-payment?af=AC61C3361" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C757C2D0D/checkout-payment?af=A70A4EBCC" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CE468D6BA/checkout-payment?af=A02206565" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CBF2FE58C/checkout-payment?af=A35FEC49F" }
    ]
  },
  {
    "nomeIdentificador": "wyus-new",
    "nomeExibicao": "Wyus",
    "totalLinks": 9,
    "checkoutLinks": [
      { "produto": "Super Otimização Emulador", "dispositivo": "Link único", "link": "https://pay.zouti.com.br/checkout?poi=prod_offer_jnd1imuj1p5vxnh2cbqn1q" },
      { "produto": "Sensi Permanente", "dispositivo": "Link único", "link": "https://lastlink.com/p/CB2B26056/checkout-payment?af=A3435A8C5" },
      { "produto": "Sensi Personalizada", "dispositivo": "Link único", "link": "https://lastlink.com/p/C85A7D4A5/" },
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C14E08290/checkout-payment?af=AE582358A" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C407CA51B/checkout-payment?af=A44580204" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CC309E9E7/checkout-payment?af=AEA517D8B" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C2ADAC427/checkout-payment?af=A967719DC" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C9333BB44/checkout-payment?af=A3E1755EF" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C4282F86D/checkout-payment?af=AD81007F7" }
    ]
  },
  {
    "nomeIdentificador": "xarada-new",
    "nomeExibicao": "Xarada",
    "totalLinks": 6,
    "checkoutLinks": [
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C60B26F46/checkout-payment?af=A616E5B42" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CE739F288/checkout-payment?af=AC06A7278" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CD0432E2F/checkout-payment?af=A86F406B2" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C3E33CDEA/checkout-payment?af=A06118B88" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C2C9E1B0B/checkout-payment?af=A93642331" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CAF465B9A/checkout-payment?af=A61039698" }
    ]
  },
  {
    "nomeIdentificador": "xnapp-new",
    "nomeExibicao": "Xnapp",
    "totalLinks": 8,
    "checkoutLinks": [
      { "produto": "Pack Completo", "dispositivo": "Link único", "link": "https://lastlink.com/p/CD4D693C2/checkout-payment?af=AF251A655" },
      { "produto": "Sensi Permanente", "dispositivo": "Link único", "link": "https://lastlink.com/p/C8D58FC29/checkout-payment?af=A22BC4F16" },
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C6208EA12/checkout-payment?af=AF9C2BC1B" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CA83676CB/checkout-payment?af=A533601AE" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C9F68AE16/checkout-payment?af=AB5D785EA" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/C6A394BD0/checkout-payment?af=ACF10089D" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C2B89DCD2/checkout-payment?af=A99370475" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C9C7AEF00/checkout-payment?af=AC77C5C6E" }
    ]
  },
  {
    "nomeIdentificador": "zbianca-new",
    "nomeExibicao": "Zbianca",
    "totalLinks": 10,
    "checkoutLinks": [
      { "produto": "Super Otimização Emulador", "dispositivo": "Link único", "link": "https://pay.zouti.com.br/checkout?poi=prod_offer_jnd1imuj1p5vxnh2cbqn1q" },
      { "produto": "Super Otimização Mobile", "dispositivo": "Link único", "link": "https://lastlink.com/p/CF50BF937/checkout-payment?af=AEA4AAE43" },
      { "produto": "Sensi Permanente", "dispositivo": "Link único", "link": "https://lastlink.com/p/C667199AF/checkout-payment?af=A158CB536" },
      { "produto": "Sensi Personalizada", "dispositivo": "Link único", "link": "https://lastlink.com/p/C67B0C55E/checkout-payment?af=AC4FC6E9B" },
      { "produto": "Platina", "dispositivo": "Android", "link": "https://lastlink.com/p/C67B1E205/checkout-payment?af=A33537E31" },
      { "produto": "Platina", "dispositivo": "Emulador", "link": "https://lastlink.com/p/CAAF07216/checkout-payment?af=A4048D591" },
      { "produto": "Platina", "dispositivo": "iPhone", "link": "https://lastlink.com/p/CBDCF639B/checkout-payment?af=A230A2771" },
      { "produto": "VIP", "dispositivo": "Android", "link": "https://lastlink.com/p/CE149B969/checkout-payment?af=ACCDF109C" },
      { "produto": "VIP", "dispositivo": "Emulador", "link": "https://lastlink.com/p/C9EE62AE6/checkout-payment?af=A0EB51EB9" },
      { "produto": "VIP", "dispositivo": "iPhone", "link": "https://lastlink.com/p/C65986112/checkout-payment?af=A7A002CD2" }
    ]
  }
];

// ─────────────────────────────────────────────
// EXECUÇÃO PRINCIPAL
// ─────────────────────────────────────────────

const TABELA_CONVERSAO = {
  "astorga-new": { slugBase: "astorga", sufixoVendas: "-new", ehContaInterna: false },
  "dak-new": { slugBase: "dak", sufixoVendas: "-new", ehContaInterna: false },
  "drey-new": { slugBase: "drey", sufixoVendas: "-new", ehContaInterna: false },
  "drey-new2": { slugBase: "drey", sufixoVendas: "-new", ehContaInterna: false },
  "extryze-new": { slugBase: "extryze", sufixoVendas: "-new", ehContaInterna: false },
  "faewl-new": { slugBase: "faewl", sufixoVendas: "-new", ehContaInterna: false },
  "guardian-new": { slugBase: "guardian", sufixoVendas: "-new", ehContaInterna: false },
  "hashira-principal": { slugBase: "hashira-principal", sufixoVendas: "customizado", slugVendasCustomizado: "hashira-principal", ehContaInterna: true },
  "hashira-trafego-pago": { slugBase: "hashira-trafego-pago", sufixoVendas: "customizado", slugVendasCustomizado: "hashira-trafego-pago", ehContaInterna: true },
  "ldzinn-new": { slugBase: "ldzinn", sufixoVendas: "-new", ehContaInterna: false },
  "lia-vendas": { slugBase: "lia", sufixoVendas: "-vendas", ehContaInterna: false },
  "macedo-vendas": { slugBase: "macedo", sufixoVendas: "-vendas", ehContaInterna: false },
  "manomax-new": { slugBase: "manomax", sufixoVendas: "-new", ehContaInterna: false },
  "mazoti-vendas": { slugBase: "mazoti", sufixoVendas: "-vendas", ehContaInterna: false },
  "mendes-new": { slugBase: "mendes", sufixoVendas: "-new", ehContaInterna: false },
  "nawt-new": { slugBase: "nawt", sufixoVendas: "-new", ehContaInterna: false },
  "play-vendas": { slugBase: "play", sufixoVendas: "-vendas", ehContaInterna: false },
  "strang-new": { slugBase: "strang", sufixoVendas: "-new", ehContaInterna: false },
  "venas-new": { slugBase: "venas", sufixoVendas: "-new", ehContaInterna: false },
  "wyus-new": { slugBase: "wyus", sufixoVendas: "-new", ehContaInterna: false },
  "xarada-new": { slugBase: "xarada", sufixoVendas: "-new", ehContaInterna: false },
  "xnapp-new": { slugBase: "xnapp", sufixoVendas: "-new", ehContaInterna: false },
  "zbianca-new": { slugBase: "zbianca", sufixoVendas: "-new", ehContaInterna: false },
};

function inferirSlugInfo(nomeIdentificador) {
  const chave = (nomeIdentificador || "").toLowerCase().trim();
  if (TABELA_CONVERSAO[chave]) return TABELA_CONVERSAO[chave];
  // Normaliza -new2 legado para -new
  if (chave.endsWith("-new2")) return { slugBase: chave.replace(/-new2$/, ""), sufixoVendas: "-new", ehContaInterna: false };
  if (chave.endsWith("-vendas")) return { slugBase: chave.replace(/-vendas$/, ""), sufixoVendas: "-vendas", ehContaInterna: false };
  if (chave.endsWith("-new")) return { slugBase: chave.replace(/-new$/, ""), sufixoVendas: "-new", ehContaInterna: false };
  return { slugBase: chave, sufixoVendas: "", ehContaInterna: false };
}

async function run() {
  console.log("🏯 Central Hashira — Seed de Influenciadores");
  console.log(`📋 ${SEED_DATA.length} influenciadores para processar\n`);

  let totalInfluenciadores = 0;
  let totalLinks = 0;
  let erros = 0;

  for (const seed of SEED_DATA) {
    const rawIdentificador = seed.nomeIdentificador;
    const nome = seed.nomeExibicao;
    const { slugBase, sufixoVendas, slugVendasCustomizado, ehContaInterna } = inferirSlugInfo(rawIdentificador);
    const slugVendas = sufixoVendas === "customizado" ? (slugVendasCustomizado || slugBase) : `${slugBase}${sufixoVendas}`;

    // Converte checkoutLinks da planilha para o formato LinkCheckout[] do sistema
    const linksCheckout = seed.checkoutLinks.map((cl, idx) => {
      const categoriaId = produtoToCategoriaId(cl.produto);
      const subItemId = dispositivoToSubItemId(cl.dispositivo);
      return {
        id: `lc_${categoriaId}_${subItemId}_${Date.now()}_${idx}`,
        categoriaId,
        subItemId,
        nome: cl.dispositivo.toUpperCase(),
        url: cl.link, // URL exatamente como na planilha
        ativo: true,
      };
    });

    // Verifica se já existe pelo slugBase (slug_bio)
    const { data: existing } = await supabase
      .from("influenciadores")
      .select("id, foto_url")
      .or(`slug_bio.eq.${slugBase},slug_bio.eq.${rawIdentificador}`)
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
      slug_vendas_customizado: slugVendasCustomizado || null,
      eh_conta_interna: Boolean(ehContaInterna),
      nome_exibicao: nome,
      foto_url: fotoUrl,
      url_base: "hashirasensix.com.br",
      url_arvore: "biohashira.com.br",
      utm_source_padrao: "beacons",
      links_checkout: linksCheckout,
      token_acesso_rapido: generateUUID(),
      ativo: true,
      criado_por: "seed-script",
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
      console.error(`  ❌ ${nome} (${slugBase}): ${error.message}`);
      erros++;
    } else {
      console.log(`  ✅ ${nome} (${slugBase} | bio: /${slugBase} | vendas: /${slugVendas}) — ${linksCheckout.length} links`);
      totalInfluenciadores++;
      totalLinks += linksCheckout.length;
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📊 Resumo:`);
  console.log(`   ✅ ${totalInfluenciadores} influenciadores processados`);
  console.log(`   🔗 ${totalLinks} links de checkout inseridos`);
  if (erros > 0) {
    console.log(`   ❌ ${erros} erros`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  process.exit(erros > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("Erro inesperado:", e);
  process.exit(1);
});
