import { supabase } from "@/lib/supabase";
import { notifyRealtimeChange } from "@/lib/realtimeSync";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface DriveDesignBlock {
  id: string;
  titulo: string;      // ex: "CAPAS DE PRODUTO"
  descricao: string;   // ex: "Visíveis no painel interno da lastlink..."
  bannerUrl: string;   // imagem do card (upload via Supabase Storage, bucket "hashira-media", pasta "drive-design/")
  driveUrl: string;    // link externo do Google Drive
  ordem: number;       // ordenação manual dos blocos
  criadoPor: string;
  criadoEm: string;
}

const STORAGE_KEY = "hashira_drive_design_blocks_v1";

// ─────────────────────────────────────────────
// MAPEAMENTOS
// ─────────────────────────────────────────────

export function mapSupabaseRowToDriveDesignBlock(row: any): DriveDesignBlock {
  return {
    id: String(row.id),
    titulo: row.titulo || "",
    descricao: row.descricao || "",
    bannerUrl: row.banner_url || row.bannerUrl || "",
    driveUrl: row.drive_url || row.driveUrl || "",
    ordem: Number(row.ordem ?? 0),
    criadoPor: row.criado_por || row.criadoPor || "",
    criadoEm: row.criado_em || row.created_at || new Date().toISOString(),
  };
}

export function mapDriveDesignBlockToSupabaseRow(block: DriveDesignBlock) {
  return {
    id: block.id,
    titulo: block.titulo,
    descricao: block.descricao,
    banner_url: block.bannerUrl,
    drive_url: block.driveUrl,
    ordem: block.ordem,
    criado_por: block.criadoPor,
  };
}

// ─────────────────────────────────────────────
// CRUD — REMOTE (SUPABASE)
// ─────────────────────────────────────────────

export async function fetchDriveDesignBlocksFromSupabase(): Promise<DriveDesignBlock[]> {
  try {
    const { data, error } = await supabase
      .from("drive_design_blocks")
      .select("*")
      .order("ordem", { ascending: true })
      .order("criado_em", { ascending: false });

    if (error) {
      console.warn("[DRIVE DESIGN WARN] Falha ao buscar blocos remotos:", error.message);
      return getStoredDriveDesignBlocks();
    }

    if (data) {
      const remote = data.map(mapSupabaseRowToDriveDesignBlock);
      saveStoredDriveDesignBlocks(remote);
      return remote;
    }
  } catch (e) {
    console.error("[DRIVE DESIGN ERROR] Exceção ao buscar blocos:", e);
  }
  return getStoredDriveDesignBlocks();
}

export async function saveDriveDesignBlockToSupabase(block: DriveDesignBlock): Promise<boolean> {
  try {
    const row = mapDriveDesignBlockToSupabaseRow(block);
    const { error } = await supabase
      .from("drive_design_blocks")
      .upsert(row, { onConflict: "id" });

    if (error) {
      console.error("[DRIVE DESIGN ERROR] Falha ao salvar bloco:", error.message);
    }
  } catch (e) {
    console.error("[DRIVE DESIGN ERROR] Exceção ao salvar bloco:", e);
  }

  // Atualiza cache local
  const current = getStoredDriveDesignBlocks();
  const updated = [block, ...current.filter((b) => b.id !== block.id)].sort(
    (a, b) => a.ordem - b.ordem
  );
  saveStoredDriveDesignBlocks(updated);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_drive_design_updated"));
    notifyRealtimeChange("drive_design_blocks", block);
  }
  return true;
}

export async function deleteDriveDesignBlockFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("drive_design_blocks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[DRIVE DESIGN ERROR] Falha ao deletar bloco:", error.message);
    }
  } catch (e) {
    console.error("[DRIVE DESIGN ERROR] Exceção ao deletar bloco:", e);
  }

  const current = getStoredDriveDesignBlocks();
  saveStoredDriveDesignBlocks(current.filter((b) => b.id !== id));

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hashira_drive_design_updated"));
    notifyRealtimeChange("drive_design_blocks", { id });
  }
  return true;
}

// ─────────────────────────────────────────────
// CRUD — LOCAL (LOCALSTORAGE)
// ─────────────────────────────────────────────

export function getStoredDriveDesignBlocks(): DriveDesignBlock[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DriveDesignBlock[];
  } catch (e) {
    console.error("[DRIVE DESIGN] Erro ao ler blocos do cache:", e);
  }
  return [];
}

export function saveStoredDriveDesignBlocks(list: DriveDesignBlock[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("[DRIVE DESIGN] Erro ao salvar blocos no cache:", e);
  }
}
