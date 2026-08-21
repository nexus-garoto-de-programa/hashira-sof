/**
 * Migration: adiciona coluna colaborador_email na tabela demandas
 * Executa via supabase-js com service_role key (bypassa RLS)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://smzfetgrxmejhzvxuovv.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtemZldGdyeG1lamh6dnh1b3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAzODMzNiwiZXhwIjoyMTAxNjE0MzM2fQ.ra-nUAtb-hK5FG7bCB8736IODUCf0qxw7AqogTjC1Ug";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function run() {
  console.log("🔍 Verificando se a coluna colaborador_email já existe...");

  // Testa se a coluna já existe fazendo um select com ela
  const { error: checkError } = await supabase
    .from("demandas")
    .select("colaborador_email")
    .limit(1);

  if (!checkError) {
    console.log("✅ Coluna colaborador_email já existe! Nada a fazer.");
    process.exit(0);
  }

  console.log("➕ Coluna não existe. Tentando criar via RPC exec_sql...");

  // Tenta chamar uma função exec_sql se existir no banco
  const { error: rpcError } = await supabase.rpc("exec_sql", {
    sql: "ALTER TABLE demandas ADD COLUMN IF NOT EXISTS colaborador_email TEXT;",
  });

  if (!rpcError) {
    console.log("✅ Migration executada via RPC exec_sql com sucesso!");
    process.exit(0);
  }

  console.warn("⚠️  RPC exec_sql não encontrado:", rpcError.message);
  console.log("🔧 Criando função exec_sql e executando migration...");

  // Último recurso: tenta criar a função exec_sql no banco
  // (service_role tem permissão de criar funções)
  const createFnSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;

  const { error: createFnError } = await supabase.rpc("exec_sql", {
    sql: createFnSql,
  });

  if (createFnError) {
    console.error(
      "❌ Não foi possível criar a função exec_sql:",
      createFnError.message
    );
    console.log("\n──────────────────────────────────────────────");
    console.log("📋 Execute manualmente no SQL Editor do Supabase:");
    console.log(
      "   https://supabase.com/dashboard/project/smzfetgrxmejhzvxuovv/sql/new"
    );
    console.log("──────────────────────────────────────────────");
    console.log(
      "ALTER TABLE demandas ADD COLUMN IF NOT EXISTS colaborador_email TEXT;"
    );
    console.log("──────────────────────────────────────────────\n");
    process.exit(1);
  }

  // Tenta novamente com a função recém criada
  const { error: retryError } = await supabase.rpc("exec_sql", {
    sql: "ALTER TABLE demandas ADD COLUMN IF NOT EXISTS colaborador_email TEXT;",
  });

  if (retryError) {
    console.error("❌ Migration falhou:", retryError.message);
    process.exit(1);
  }

  console.log("✅ Migration executada com sucesso!");
  process.exit(0);
}

run().catch((e) => {
  console.error("Erro inesperado:", e);
  process.exit(1);
});
