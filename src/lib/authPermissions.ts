export interface UserPermissions {
  acessoDashboard: boolean;
  acessoOperacoes: boolean;
  acessoSetoresTab: boolean;
  acessoTarefasTab: boolean;
  acessoProjetosTab: boolean;
  acessoPerformanceTab: boolean;
  acessoCalendarioTab: boolean;
  acessoAdminPanorama: boolean;
}

export interface UserAccount {
  id: string;
  nome: string;
  nickname?: string;
  comoQuerSerChamado?: string;
  cargo?: string;
  bio?: string;
  email: string;
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
  acessoAdminPanorama: false,
};

export const ADMIN_PERMISSIONS: UserPermissions = {
  acessoDashboard: true,
  acessoOperacoes: true,
  acessoSetoresTab: true,
  acessoTarefasTab: true,
  acessoProjetosTab: true,
  acessoPerformanceTab: true,
  acessoCalendarioTab: true,
  acessoAdminPanorama: true,
};

export const USERS_SEED: UserAccount[] = [
  {
    id: "usr-admin-01",
    nome: "Matheus (Admin)",
    nickname: "Matheus (Admin)",
    comoQuerSerChamado: "Matheus (Admin)",
    email: "mhvzbusiness@gmail.com",
    papel: "administrador",
    setorNome: "Gestão Geral",
    setoresNomes: ["Gestão Geral"],
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
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

const STORAGE_KEY_USERS = "central_hashira_users_v2";
const STORAGE_KEY_ACTIVE_USER = "central_hashira_active_user_v2";

export function normalizeUserAccount(raw: any): UserAccount {
  if (!raw || typeof raw !== "object") return USERS_SEED[0];
  const email = String(raw.email || "usuario@hashira.com");
  const nome = String(raw.nome || email.split("@")[0] || "Colaborador");
  const papel = raw.papel === "administrador" || email.toLowerCase() === "mhvzbusiness@gmail.com" ? "administrador" : "colaborador";
  const setorNome = String(raw.setorNome || "Estrutura de Funil");
  const setoresNomes = Array.isArray(raw.setoresNomes) && raw.setoresNomes.length > 0
    ? raw.setoresNomes.map(String)
    : [setorNome];

  const nickname = raw.nickname ? String(raw.nickname) : nome;
  const comoQuerSerChamado = raw.comoQuerSerChamado ? String(raw.comoQuerSerChamado) : nickname;

  return {
    id: String(raw.id || "usr-" + Date.now()),
    nome,
    nickname,
    comoQuerSerChamado,
    cargo: raw.cargo ? String(raw.cargo) : (papel === "administrador" ? "Administrador Geral" : "Operador de Demandas"),
    bio: raw.bio ? String(raw.bio) : "Integrante da equipe Hashira.",
    email,
    papel,
    setorNome,
    setoresNomes,
    avatarUrl: String(raw.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"),
    permissoes: {
      acessoDashboard: raw.permissoes?.acessoDashboard ?? true,
      acessoOperacoes: raw.permissoes?.acessoOperacoes ?? true,
      acessoSetoresTab: raw.permissoes?.acessoSetoresTab ?? true,
      acessoTarefasTab: raw.permissoes?.acessoTarefasTab ?? true,
      acessoProjetosTab: raw.permissoes?.acessoProjetosTab ?? true,
      acessoPerformanceTab: raw.permissoes?.acessoPerformanceTab ?? true,
      acessoCalendarioTab: raw.permissoes?.acessoCalendarioTab ?? true,
      acessoAdminPanorama: raw.permissoes?.acessoAdminPanorama ?? (papel === "administrador"),
    },
  };
}

export function getStoredUsers(): UserAccount[] {
  if (typeof window === "undefined") return USERS_SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeUserAccount);
      }
    }
  } catch (e) {
    console.error("Erro ao carregar usuários de auth", e);
  }
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(USERS_SEED));
  return USERS_SEED;
}

export function saveStoredUsers(users: UserAccount[]) {
  if (typeof window === "undefined") return;
  try {
    const map = new Map<string, UserAccount>();
    users.forEach((u) => {
      const normalized = normalizeUserAccount(u);
      map.set(normalized.email.toLowerCase().trim(), normalized);
    });
    const deduplicated = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(deduplicated));
  } catch (e) {
    console.error("Erro ao salvar usuários de auth", e);
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

  // Synchronize in users list
  const allUsers = getStoredUsers();
  const updatedList = allUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u));
  saveStoredUsers(updatedList);

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
