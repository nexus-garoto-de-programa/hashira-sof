export interface UserPermissions {
  acessoDashboard: boolean;
  acessoOperacoes: boolean;
  acessoSetoresTab: boolean;
  acessoTarefasTab: boolean;
  acessoProjetosTab: boolean;
  acessoPerformanceTab: boolean;
  acessoCalendarioTab: boolean;
  acessoDriveDesignTab: boolean;
  acessoAdminPanorama: boolean;
  acessoCDI: boolean;
  acessoInfluenciadoresTab: boolean;
}

export interface UserAccount {
  id: string;
  nome: string;
  nickname?: string;
  comoQuerSerChamado?: string;
  cargo?: string;
  bio?: string;
  email: string;
  senha?: string;
  papel: "colaborador" | "administrador";
  setorNome: string;
  setoresNomes?: string[];
  avatarUrl: string;
  permissoes: UserPermissions;
}

export const DEFAULT_COLLABORATOR_PERMISSIONS: UserPermissions = {
  acessoDashboard: true,
  acessoOperacoes: true,
  acessoSetoresTab: true,
  acessoTarefasTab: true,
  acessoProjetosTab: true,
  acessoPerformanceTab: true,
  acessoCalendarioTab: true,
  acessoDriveDesignTab: true,
  acessoAdminPanorama: false,
  acessoCDI: false,
  acessoInfluenciadoresTab: false,
};

export const ADMIN_PERMISSIONS: UserPermissions = {
  acessoDashboard: true,
  acessoOperacoes: true,
  acessoSetoresTab: true,
  acessoTarefasTab: true,
  acessoProjetosTab: true,
  acessoPerformanceTab: true,
  acessoCalendarioTab: true,
  acessoDriveDesignTab: true,
  acessoAdminPanorama: true,
  acessoCDI: true,
  acessoInfluenciadoresTab: true,
};

export const USERS_SEED: UserAccount[] = [
  {
    id: "usr-admin-01",
    nome: "Matheus (Admin)",
    nickname: "Matheus (Admin)",
    comoQuerSerChamado: "Matheus (Admin)",
    email: "mhvzbusiness@gmail.com",
    senha: "1978Henrique*",
    papel: "administrador",
    setorNome: "Gestão Geral",
    setoresNomes: ["Gestão Geral"],
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    permissoes: ADMIN_PERMISSIONS,
  },
  {
    id: "usr-1787345418660",
    nome: "Guardian",
    nickname: "Guardian",
    comoQuerSerChamado: "Guardian",
    cargo: "Founder",
    bio: "nada a declarar...",
    email: "www.guardiantv@gmail.com",
    senha: "Dan3528@",
    papel: "administrador",
    setorNome: "Marketing",
    setoresNomes: ["Marketing", "Estrutura de Funil", "Pós-venda, Suporte e Atendimento ao Cliente", "Serviços", "Produtos", "Discord"],
    avatarUrl: "https://smzfetgrxmejhzvxuovv.supabase.co/storage/v1/object/public/hashira-media/avatars/1787345407015-gfqgpyv.png",
    permissoes: ADMIN_PERMISSIONS,
  },
  {
    id: "usr-1787173965086",
    nome: "LUIZ FELIPE DA SILVA BRITO",
    nickname: "FELIPE BRITO",
    comoQuerSerChamado: "FELIPE BRITO",
    cargo: "Administrador",
    bio: "PROPOSITO",
    email: "felipepiu2011@gmail.com",
    senha: "310798@Hashira",
    papel: "administrador",
    setorNome: "Marketing",
    setoresNomes: ["Marketing"],
    avatarUrl: "https://smzfetgrxmejhzvxuovv.supabase.co/storage/v1/object/public/hashira-media/avatars/1787174018308-4pwjr01.jpg",
    permissoes: ADMIN_PERMISSIONS,
  },
  {
    id: "usr-01",
    nome: "Matheus Ramos",
    nickname: "Matheus Ramos",
    comoQuerSerChamado: "Matheus Ramos",
    email: "matheus@hashira.com",
    papel: "colaborador",
    setorNome: "Estrutura de Funil",
    setoresNomes: ["Estrutura de Funil"],
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    permissoes: DEFAULT_COLLABORATOR_PERMISSIONS,
  },
  {
    id: "usr-02",
    nome: "Henrique Silva",
    nickname: "Henrique",
    comoQuerSerChamado: "Henrique Silva",
    email: "henrique@hashira.com",
    papel: "colaborador",
    setorNome: "Marketing",
    setoresNomes: ["Marketing"],
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    permissoes: DEFAULT_COLLABORATOR_PERMISSIONS,
  },
  {
    id: "usr-03",
    nome: "Debora Santos",
    nickname: "Debora",
    comoQuerSerChamado: "Debora Santos",
    email: "debora@hashira.com",
    papel: "colaborador",
    setorNome: "Pós-venda, Suporte e Atendimento ao Cliente",
    setoresNomes: ["Pós-venda, Suporte e Atendimento ao Cliente"],
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    permissoes: DEFAULT_COLLABORATOR_PERMISSIONS,
  },
];

import { supabase } from "@/lib/supabase";
import { notifyRealtimeChange } from "@/lib/realtimeSync";

const STORAGE_KEY_USERS = "central_hashira_users_v2";
const STORAGE_KEY_ACTIVE_USER = "central_hashira_active_user_v2";
const STORAGE_KEY_DELETED_USERS = "central_hashira_deleted_users_v2";

export function mapSupabaseRowToUserAccount(row: any): UserAccount {
  return normalizeUserAccount({
    id: row.id,
    nome: row.nome,
    nickname: row.nickname,
    comoQuerSerChamado: row.como_quer_ser_chamado || row.comoQuerSerChamado,
    cargo: row.cargo,
    bio: row.bio,
    email: row.email,
    senha: row.senha,
    papel: row.papel,
    setorNome: row.setor_nome || row.setorNome,
    setoresNomes: row.setores_nomes || row.setoresNomes,
    avatarUrl: row.avatar_url || row.avatarUrl,
    permissoes: row.permissoes,
  });
}

export function mapUserAccountToSupabaseRow(user: UserAccount) {
  const norm = normalizeUserAccount(user);
  return {
    id: norm.id,
    nome: norm.nome,
    nickname: norm.nickname,
    como_quer_ser_chamado: norm.comoQuerSerChamado,
    cargo: norm.cargo,
    bio: norm.bio,
    email: norm.email.toLowerCase().trim(),
    senha: norm.senha,
    papel: norm.papel,
    setor_nome: norm.setorNome,
    setores_nomes: norm.setoresNomes,
    avatar_url: norm.avatarUrl,
    permissoes: norm.permissoes,
  };
}

export async function fetchUsersFromSupabase(): Promise<UserAccount[]> {
  try {
    const { data, error } = await supabase.from("usuarios").select("*");
    if (error) {
      console.warn("[SUPABASE WARN] Falha ao ler usuários remotos, usando fallback:", error.message);
      return getStoredUsers();
    }
    if (data && data.length > 0) {
      const remoteUsers = data.map(mapSupabaseRowToUserAccount);
      // Salva no localStorage local para renderização instantânea offline/fallback
      if (typeof window !== "undefined") {
        try {
          const map = new Map<string, UserAccount>();
          USERS_SEED.forEach((u) => map.set(u.email.toLowerCase().trim(), u));
          remoteUsers.forEach((u) => map.set(u.email.toLowerCase().trim(), u));
          const merged = Array.from(map.values());
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(merged));
        } catch (e) {}
      }
      return remoteUsers;
    }
  } catch (e) {
    console.error("[SUPABASE ERROR] Exceção ao buscar usuários:", e);
  }
  return getStoredUsers();
}

export async function saveUserToSupabase(user: UserAccount): Promise<boolean> {
  try {
    const row = mapUserAccountToSupabaseRow(user);
    const { error } = await supabase.from("usuarios").upsert(row, { onConflict: "email" });
    if (error) {
      console.error("[SUPABASE ERROR] Falha ao salvar usuário no banco remoto:", error.message);
    }
  } catch (e) {
    console.error("[SUPABASE ERROR] Exceção ao salvar usuário no Supabase:", e);
  }
  saveStoredUsers([user]);
  return true;
}

export async function deleteUserFromSupabase(identifier: string): Promise<boolean> {
  const cleanIdent = identifier.toLowerCase().trim();
  try {
    const { error } = await supabase
      .from("usuarios")
      .delete()
      .or(`id.eq.${cleanIdent},email.eq.${cleanIdent}`);
    if (error) {
      console.error("[SUPABASE ERROR] Falha ao deletar usuário remoto:", error.message);
    }
  } catch (e) {
    console.error("[SUPABASE ERROR] Exceção ao deletar usuário remoto:", e);
  }
  deleteStoredUser(cleanIdent);
  return true;
}

export function getDeletedUsersList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).toLowerCase().trim());
    }
  } catch (e) {
    console.error("Erro ao ler lista de deletados", e);
  }
  return [];
}

export function addDeletedUserRecord(identifier: string) {
  if (typeof window === "undefined") return;
  try {
    const list = getDeletedUsersList();
    const clean = identifier.toLowerCase().trim();
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem(STORAGE_KEY_DELETED_USERS, JSON.stringify(list));
    }
  } catch (e) {
    console.error("Erro ao salvar registro de usuário deletado", e);
  }
}

export function normalizeUserAccount(raw: any): UserAccount {
  if (!raw || typeof raw !== "object") return USERS_SEED[0];
  const email = String(raw.email || "usuario@hashira.com");
  const nome = String(raw.nome || email.split("@")[0] || "Colaborador");
  const papel =
    raw.papel === "administrador" ||
    email.toLowerCase() === "mhvzbusiness@gmail.com" ||
    email.toLowerCase() === "www.guardiantv@gmail.com"
      ? "administrador"
      : "colaborador";
  const setorNome = String(raw.setorNome || "Estrutura de Funil");
  const setoresNomes = Array.isArray(raw.setoresNomes) && raw.setoresNomes.length > 0
    ? raw.setoresNomes.map(String)
    : [setorNome];

  const nickname = raw.nickname ? String(raw.nickname) : nome;
  const comoQuerSerChamado = raw.comoQuerSerChamado ? String(raw.comoQuerSerChamado) : nickname;

  let avatarUrl = String(raw.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");
  if (avatarUrl.startsWith("data:image")) {
    avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
  }

  return {
    id: String(raw.id || "usr-" + Date.now()),
    nome,
    nickname,
    comoQuerSerChamado,
    cargo: raw.cargo ? String(raw.cargo) : (papel === "administrador" ? "Administrador Geral" : "Operador de Demandas"),
    bio: raw.bio ? String(raw.bio) : "Integrante da equipe Hashira.",
    email,
    senha: raw.senha ? String(raw.senha) : undefined,
    papel,
    setorNome,
    setoresNomes,
    avatarUrl,
    permissoes: {
      acessoDashboard: raw.permissoes?.acessoDashboard ?? true,
      acessoOperacoes: raw.permissoes?.acessoOperacoes ?? true,
      acessoSetoresTab: raw.permissoes?.acessoSetoresTab ?? true,
      acessoTarefasTab: raw.permissoes?.acessoTarefasTab ?? true,
      acessoProjetosTab: raw.permissoes?.acessoProjetosTab ?? true,
      acessoPerformanceTab: raw.permissoes?.acessoPerformanceTab ?? true,
      acessoCalendarioTab: raw.permissoes?.acessoCalendarioTab ?? true,
      acessoDriveDesignTab: raw.permissoes?.acessoDriveDesignTab ?? true,
      acessoAdminPanorama: raw.permissoes?.acessoAdminPanorama ?? (papel === "administrador"),
      acessoCDI: raw.permissoes?.acessoCDI ?? (papel === "administrador"),
      acessoInfluenciadoresTab: raw.permissoes?.acessoInfluenciadoresTab ?? (papel === "administrador"),
    },
  };
}

export function getStoredUsers(): UserAccount[] {
  if (typeof window === "undefined") return USERS_SEED;
  try {
    const deletedList = getDeletedUsersList();
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    let list: UserAccount[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed.map(normalizeUserAccount);
      }
    }

    const map = new Map<string, UserAccount>();
    USERS_SEED.forEach((u) => {
      const cleanEmail = u.email.toLowerCase().trim();
      const cleanId = u.id.toLowerCase().trim();
      if (!deletedList.includes(cleanEmail) && !deletedList.includes(cleanId)) {
        map.set(cleanEmail, u);
      }
    });

    list.forEach((u) => {
      const cleanEmail = u.email.toLowerCase().trim();
      const cleanId = u.id.toLowerCase().trim();
      if (!deletedList.includes(cleanEmail) && !deletedList.includes(cleanId)) {
        map.set(cleanEmail, u);
      }
    });

    const merged = Array.from(map.values());
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(merged));
    }
    return merged;
  } catch (e) {
    console.error("Erro ao carregar usuários de auth", e);
  }
  return USERS_SEED;
}

export function saveStoredUsers(users: UserAccount[]) {
  if (typeof window === "undefined") return;
  try {
    const deletedList = getDeletedUsersList();
    const currentInStore = getStoredUsers();
    const map = new Map<string, UserAccount>();

    USERS_SEED.forEach((seed) => {
      const cleanEmail = seed.email.toLowerCase().trim();
      const cleanId = seed.id.toLowerCase().trim();
      if (!deletedList.includes(cleanEmail) && !deletedList.includes(cleanId)) {
        map.set(cleanEmail, seed);
      }
    });

    currentInStore.forEach((u) => {
      const cleanEmail = u.email.toLowerCase().trim();
      const cleanId = u.id.toLowerCase().trim();
      if (!deletedList.includes(cleanEmail) && !deletedList.includes(cleanId)) {
        map.set(cleanEmail, u);
      }
    });

    users.forEach((u) => {
      const normalized = normalizeUserAccount(u);
      const cleanEmail = normalized.email.toLowerCase().trim();
      const cleanId = normalized.id.toLowerCase().trim();
      if (!deletedList.includes(cleanEmail) && !deletedList.includes(cleanId)) {
        map.set(cleanEmail, normalized);
      }
    });

    const deduplicated = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(deduplicated));

    // Sincroniza também a chave de demandas "hashira_cascade_usuarios_v3"
    try {
      const demandasUsuariosFormat = deduplicated.map((u) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        papel: u.papel,
        setorId: "sec-funil",
        setorNome: u.setorNome || "Estrutura de Funil",
        statusConta: "ativo",
        avatarUrl: u.avatarUrl,
        criadoEm: new Date().toISOString(),
      }));
      localStorage.setItem("hashira_cascade_usuarios_v3", JSON.stringify(demandasUsuariosFormat));
    } catch (e) {
      console.error("Erro ao sincronizar hashira_cascade_usuarios_v3", e);
    }

    // Dispara evento customizado e nativo para atualização em tempo real no front-end
    window.dispatchEvent(new CustomEvent("hashira_users_updated"));
    notifyRealtimeChange("usuarios", deduplicated);
  } catch (e) {
    console.error("Erro ao salvar usuários de auth", e);
  }
}

export function deleteStoredUser(identifier: string) {
  if (typeof window === "undefined") return;
  try {
    const cleanIdent = identifier.toLowerCase().trim();
    addDeletedUserRecord(cleanIdent);

    const currentUsers = getStoredUsers();
    const targetUser = currentUsers.find(
      (u) => u.id.toLowerCase().trim() === cleanIdent || u.email.toLowerCase().trim() === cleanIdent
    );

    if (targetUser) {
      addDeletedUserRecord(targetUser.id);
      addDeletedUserRecord(targetUser.email);
    }

    const updatedUsers = currentUsers.filter(
      (u) => u.id.toLowerCase().trim() !== cleanIdent && u.email.toLowerCase().trim() !== cleanIdent
    );

    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));

    // Sincroniza a chave de demandas "hashira_cascade_usuarios_v3"
    try {
      const demandasUsuariosFormat = updatedUsers.map((u) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        papel: u.papel,
        setorId: "sec-funil",
        setorNome: u.setorNome || "Estrutura de Funil",
        statusConta: "ativo",
        avatarUrl: u.avatarUrl,
        criadoEm: new Date().toISOString(),
      }));
      localStorage.setItem("hashira_cascade_usuarios_v3", JSON.stringify(demandasUsuariosFormat));
    } catch (e) {
      console.error("Erro ao sincronizar hashira_cascade_usuarios_v3 na exclusao", e);
    }

    // Se o usuário ativo for o deletado, limpa a sessão
    const active = getActiveUser();
    if (active && (active.id.toLowerCase().trim() === cleanIdent || active.email.toLowerCase().trim() === cleanIdent)) {
      clearActiveUser();
    }

    // Dispara evento para atualização em tempo real no front-end
    window.dispatchEvent(new CustomEvent("hashira_users_updated"));
    notifyRealtimeChange("usuarios", { deletedId: cleanIdent });
  } catch (e) {
    console.error("Erro ao deletar usuário", e);
  }
}

export function getActiveUser(): UserAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return normalizeUserAccount(parsed);
      }
    }
  } catch (e) {
    console.error("Erro ao carregar usuário ativo", e);
  }
  return null;
}

export function setActiveUser(user: UserAccount) {
  if (typeof window === "undefined") return;
  try {
    const normalized = normalizeUserAccount(user);
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(normalized));
  } catch (e) {
    console.error("Erro ao salvar usuário ativo", e);
  }
}

export function clearActiveUser() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
  } catch (e) {
    console.error("Erro ao limpar sessão do usuário", e);
  }
}

export function updateActiveUserProfile(updates: Partial<UserAccount>): UserAccount | null {
  const current = getActiveUser();
  if (!current) return null;
  const updatedUser: UserAccount = normalizeUserAccount({
    ...current,
    ...updates,
  });
  setActiveUser(updatedUser);

  // Synchronize in users list locally and remotely on Supabase
  const allUsers = getStoredUsers();
  const updatedList = allUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u));
  saveStoredUsers(updatedList);
  saveUserToSupabase(updatedUser);

  return updatedUser;
}

export function getAdminSimulatedRole(): "administrador" | "colaborador" {
  if (typeof window === "undefined") return "administrador";
  try {
    const raw = localStorage.getItem("central_hashira_simulated_role_v1");
    if (raw === "colaborador" || raw === "administrador") return raw;
  } catch (e) {
    console.error("Erro ao ler modo simulado", e);
  }
  return "administrador";
}

export function setAdminSimulatedRole(role: "administrador" | "colaborador") {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("central_hashira_simulated_role_v1", role);
  } catch (e) {
    console.error("Erro ao salvar modo simulado", e);
  }
}
