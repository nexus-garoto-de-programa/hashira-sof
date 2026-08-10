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
    email: "mhvzbusiness@gmail.com",
    papel: "administrador",
    setorNome: "Gestão Geral",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    permissoes: ADMIN_PERMISSIONS,
  },
  {
    id: "usr-01",
    nome: "Matheus Ramos",
    email: "matheus@hashira.com",
    papel: "colaborador",
    setorNome: "Estrutura de Funil",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    permissoes: DEFAULT_COLLABORATOR_PERMISSIONS,
  },
  {
    id: "usr-02",
    nome: "Henrique Silva",
    email: "henrique@hashira.com",
    papel: "colaborador",
    setorNome: "Marketing",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    permissoes: DEFAULT_COLLABORATOR_PERMISSIONS,
  },
  {
    id: "usr-03",
    nome: "Debora Santos",
    email: "debora@hashira.com",
    papel: "colaborador",
    setorNome: "Pós-venda, Suporte e Atendimento ao Cliente",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    permissoes: DEFAULT_COLLABORATOR_PERMISSIONS,
  },
];

const STORAGE_KEY_USERS = "central_hashira_users_v1";
const STORAGE_KEY_ACTIVE_USER = "central_hashira_active_user_v1";

export function getStoredUsers(): UserAccount[] {
  if (typeof window === "undefined") return USERS_SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao carregar usuários de auth", e);
  }
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(USERS_SEED));
  return USERS_SEED;
}

export function saveStoredUsers(users: UserAccount[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {
    console.error("Erro ao salvar usuários de auth", e);
  }
}

export function getActiveUser(): UserAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao carregar usuário ativo", e);
  }
  return null;
}

export function setActiveUser(user: UserAccount) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(user));
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
  const updatedUser: UserAccount = {
    ...current,
    ...updates,
  };
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
