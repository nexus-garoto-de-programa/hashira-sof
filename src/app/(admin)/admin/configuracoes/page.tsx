"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Users,
  Layers,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  Check,
  X,
  Sparkles,
  Settings,
  User,
  Shield,
  Eye,
  CheckCircle2,
  Lock,
  Unlock,
} from "lucide-react";
import {
  getActiveUser,
  getStoredUsers,
  saveStoredUsers,
  getAdminSimulatedRole,
  setAdminSimulatedRole,
  fetchUsersFromSupabase,
  saveUserToSupabase,
  deleteUserFromSupabase,
  UserAccount,
  UserPermissions,
  DEFAULT_COLLABORATOR_PERMISSIONS,
  ADMIN_PERMISSIONS,
} from "@/lib/authPermissions";
import {
  HASHIRAS_SEED,
  SetorHashira,
  getStoredSetores,
  saveStoredSetores,
} from "@/lib/demands";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type ConfigTab = "acessos" | "equipe" | "setores" | "visualizacao";

function AdminConfiguracoesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as ConfigTab) || "acessos";

  const [activeTab, setActiveTab] = useState<ConfigTab>(initialTab);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [simulatedRole, setSimulatedRole] = useState<"administrador" | "colaborador">("administrador");
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [setores, setSetores] = useState<SetorHashira[]>([]);
  const [userChecked, setUserChecked] = useState(false);

  // Estados para busca e modais
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddSetorModal, setShowAddSetorModal] = useState(false);

  // Form Novo Colaborador
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoSetor, setNovoSetor] = useState(HASHIRAS_SEED[0].nome);
  const [novoPapel, setNovoPapel] = useState<"colaborador" | "administrador">("colaborador");

  // Form Novo Setor
  const [novoSetorNome, setNovoSetorNome] = useState("");
  const [novoSetorCor, setNovoSetorCor] = useState("#5B50E5");
  const [novoSetorDescricao, setNovoSetorDescricao] = useState("");

  useEffect(() => {
    const user = getActiveUser();
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.papel !== "administrador" && user.email !== "mhvzbusiness@gmail.com") {
      toast.error("Acesso restrito a Administradores.");
      router.push("/dashboard");
      return;
    }
    setCurrentUser(user);
    setSimulatedRole(getAdminSimulatedRole());
    setUserChecked(true);

    const reloadData = async () => {
      const remoteUsers = await fetchUsersFromSupabase();
      setUsers(remoteUsers);
      setSetores(getStoredSetores());
    };

    reloadData();

    const channel = supabase
      .channel("admin-config-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "usuarios" }, () => {
        reloadData();
      })
      .subscribe();

    window.addEventListener("hashira_users_updated", reloadData);
    window.addEventListener("storage", reloadData);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("hashira_users_updated", reloadData);
      window.removeEventListener("storage", reloadData);
    };
  }, [router]);

  if (!userChecked || !currentUser) return null;

  // 1. ALTERNAR MODO DE VISUALIZAÇÃO
  const handleToggleSimulatedRole = (role: "administrador" | "colaborador") => {
    setSimulatedRole(role);
    setAdminSimulatedRole(role);
    if (role === "colaborador") {
      toast.success("Visão alterada para modo COLABORADOR 👤");
    } else {
      toast.success("Visão alterada para modo ADMINISTRADOR 👑");
    }
  };

  // 2. TOGGLE DE PERMISSÕES
  const handleTogglePermission = async (userId: string, key: keyof UserPermissions) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const currentVal = target.permissoes[key];
    const updatedUser: UserAccount = {
      ...target,
      permissoes: {
        ...target.permissoes,
        [key]: !currentVal,
      },
    };

    const updatedList = users.map((u) => (u.id === userId ? updatedUser : u));
    setUsers(updatedList);
    saveStoredUsers(updatedList);
    await saveUserToSupabase(updatedUser);
    toast.success("Permissão atualizada com sucesso!");
  };

  // 3. ADICIONAR NOVO USUÁRIO
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novoEmail.trim()) {
      toast.error("Preencha nome e e-mail");
      return;
    }

    const initials = novoNome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const novoUser: UserAccount = {
      id: "usr-" + Date.now(),
      nome: novoNome.trim(),
      email: novoEmail.trim().toLowerCase(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(novoNome)}`,
      setorNome: novoSetor,
      setoresNomes: [novoSetor],
      papel: novoPapel,
      permissoes:
        novoPapel === "administrador" ? ADMIN_PERMISSIONS : DEFAULT_COLLABORATOR_PERMISSIONS,
    };

    const updated = [novoUser, ...users];
    setUsers(updated);
    saveStoredUsers(updated);
    await saveUserToSupabase(novoUser);
    toast.success(`Membro ${novoNome} cadastrado com sucesso!`);

    setNovoNome("");
    setNovoEmail("");
    setShowAddUserModal(false);
  };

  // 4. EXCLUIR USUÁRIO
  const handleDeleteUser = async (userId: string, userNome: string) => {
    if (userId === currentUser.id) {
      toast.error("Você não pode excluir sua própria conta de administrador.");
      return;
    }
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    saveStoredUsers(updated);
    await deleteUserFromSupabase(userId);
    toast.success(`Colaborador "${userNome}" removido com sucesso.`);
  };

  // 5. ADICIONAR SETOR
  const handleCreateSetor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoSetorNome.trim()) {
      toast.error("Informe o nome do setor");
      return;
    }

    const novo: SetorHashira = {
      id: "sec-" + Date.now(),
      nome: novoSetorNome.trim(),
      slug: novoSetorNome.toLowerCase().replace(/\s+/g, "-"),
      membrosReferencia: [],
      cor: novoSetorCor,
      badgeBg: novoSetorCor + "20",
      badgeText: novoSetorCor,
      icone: "Layers",
      descricao: novoSetorDescricao.trim() || "Departamento operacional Hashira",
    };

    const atualizados = [...setores, novo];
    setSetores(atualizados);
    saveStoredSetores(atualizados);
    toast.success("Novo setor cadastrado com sucesso!");

    setNovoSetorNome("");
    setNovoSetorDescricao("");
    setShowAddSetorModal(false);
  };

  // Filtro de usuários
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.nome.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.setorNome?.toLowerCase().includes(q) ||
        u.comoQuerSerChamado?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const tabs = [
    { id: "acessos" as ConfigTab, label: "Gestão de Acessos", icon: ShieldCheck },
    { id: "equipe" as ConfigTab, label: "Equipe & Membros", icon: Users },
    { id: "setores" as ConfigTab, label: "Setores (Hashiras)", icon: Layers },
    { id: "visualizacao" as ConfigTab, label: "Modo de Visualização", icon: RefreshCw },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Fixa */}
      <AppSidebar />

      {/* Conteúdo Principal */}
      <div className="flex-1 min-w-0 p-8 space-y-8">
        
        {/* Banner Superior Coursue */}
        <section
          className="relative overflow-hidden rounded-[32px] p-8 md:p-10 shadow-xl"
          style={{
            background: "radial-gradient(circle at top right, rgba(91, 80, 229, 0.25), transparent 60%), linear-gradient(135deg, #0F0E17 0%, #1A1829 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold mb-3 bg-white/10 text-[#C7C2F5]">
                <Settings className="w-3.5 h-3.5" />
                Painel Unificado de Configurações
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                Configurações do Sistema
              </h1>
              <p className="mt-2 text-sm text-white/80 max-w-2xl">
                Centralize permissões, colaboradores, departamentos Hashira e alterne a visão operacional entre Administrador e Colaborador.
              </p>
            </div>

            {/* Quick Switcher no Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="text-xs">
                <span className="block text-[10px] uppercase tracking-wider text-white/60 font-bold">
                  Modo de Visualização
                </span>
                <span className="font-extrabold text-white">
                  {simulatedRole === "administrador" ? "👑 Administrador" : "👤 Colaborador"}
                </span>
              </div>
              <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => handleToggleSimulatedRole("administrador")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    simulatedRole === "administrador"
                      ? "bg-[#5B50E5] text-white shadow-md"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSimulatedRole("colaborador")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    simulatedRole === "colaborador"
                      ? "bg-[#5B50E5] text-white shadow-md"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Colaborador
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Navegação por Abas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#5B50E5] text-white shadow-lg shadow-[#5B50E5]/25"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800/60"
                }`}
                style={{
                  color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── ABA 1: GESTÃO DE ACESSOS ── */}
        {activeTab === "acessos" && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                  Gestão de Acessos & Permissões
                </h2>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Defina o que cada membro pode visualizar e operar na plataforma.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar por membro ou setor..."
                  className="coursue-input pl-10 text-xs py-2.5"
                />
              </div>
            </div>

            <div className="coursue-card rounded-[24px] overflow-hidden shadow-sm border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead style={{ backgroundColor: "var(--surface-alt)", borderBottom: "1px solid var(--border)" }}>
                    <tr>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400">Colaborador</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400">Setor & Papel</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 text-center">Dashboard</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 text-center">Operações</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 text-center">Kanban Tarefas</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 text-center">Admin Panorama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((u) => {
                      const isAdm = u.papel === "administrador" || u.email === "mhvzbusiness@gmail.com";
                      return (
                        <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatarUrl}
                                alt={u.nome}
                                className="h-9 w-9 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                              />
                              <div>
                                <span className="font-extrabold block" style={{ color: "var(--text-primary)" }}>
                                  {u.comoQuerSerChamado || u.nickname || u.nome}
                                </span>
                                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-semibold block" style={{ color: "var(--text-primary)" }}>
                              {u.setorNome}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                                isAdm ? "bg-[#5B50E5]/15 text-[#5B50E5]" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {u.papel}
                            </span>
                          </td>

                          {/* Toggles de Permissão */}
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleTogglePermission(u.id, "acessoDashboard")}
                              className={`p-2 rounded-xl transition-all ${
                                u.permissoes.acessoDashboard
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                              }`}
                              title={u.permissoes.acessoDashboard ? "Acesso liberado" : "Acesso bloqueado"}
                            >
                              {u.permissoes.acessoDashboard ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleTogglePermission(u.id, "acessoOperacoes")}
                              className={`p-2 rounded-xl transition-all ${
                                u.permissoes.acessoOperacoes
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                              }`}
                              title={u.permissoes.acessoOperacoes ? "Acesso liberado" : "Acesso bloqueado"}
                            >
                              {u.permissoes.acessoOperacoes ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleTogglePermission(u.id, "acessoTarefasTab")}
                              className={`p-2 rounded-xl transition-all ${
                                u.permissoes.acessoTarefasTab
                                  ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                              }`}
                              title={u.permissoes.acessoTarefasTab ? "Acesso liberado" : "Acesso bloqueado"}
                            >
                              {u.permissoes.acessoTarefasTab ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleTogglePermission(u.id, "acessoAdminPanorama")}
                              className={`p-2 rounded-xl transition-all ${
                                u.permissoes.acessoAdminPanorama
                                  ? "bg-[#5B50E5]/15 text-[#5B50E5]"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                              }`}
                              title={u.permissoes.acessoAdminPanorama ? "Acesso liberado ao Panorama Admin" : "Sem permissão para o Panorama Admin"}
                            >
                              {u.permissoes.acessoAdminPanorama ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── ABA 2: EQUIPE & COLABORADORES ── */}
        {activeTab === "equipe" && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                  Membros da Equipe ({users.length})
                </h2>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Cadastre, visualize e gerencie todos os colaboradores vinculados aos setores.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="coursue-btn-primary py-2.5 px-5 text-xs shadow-lg shadow-[#5B50E5]/25 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Novo Colaborador
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {users.map((u) => {
                const isAdm = u.papel === "administrador" || u.email === "mhvzbusiness@gmail.com";
                return (
                  <div
                    key={u.id}
                    className="coursue-card p-6 rounded-[24px] border border-border shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={u.avatarUrl}
                          alt={u.nome}
                          className="h-12 w-12 rounded-full object-cover shrink-0 ring-2 ring-[#5B50E5]/30"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold font-['Plus_Jakarta_Sans'] truncate" style={{ color: "var(--text-primary)" }}>
                            {u.comoQuerSerChamado || u.nickname || u.nome}
                          </h4>
                          <span className="text-[11px] block truncate" style={{ color: "var(--text-secondary)" }}>
                            {u.email}
                          </span>
                        </div>
                      </div>

                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.nome)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors opacity-60 group-hover:opacity-100"
                          title="Remover Colaborador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                      <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {u.setorNome}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          isAdm ? "bg-[#5B50E5]/15 text-[#5B50E5]" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {u.papel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── ABA 3: SETORES HASHIRA ── */}
        {activeTab === "setores" && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                  Setores & Departamentos Hashira ({setores.length})
                </h2>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Estrutura hierárquica dos departamentos operacionais da organização.
                </p>
              </div>

              <button
                onClick={() => setShowAddSetorModal(true)}
                className="coursue-btn-primary py-2.5 px-5 text-xs shadow-lg shadow-[#5B50E5]/25 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Novo Departamento
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {setores.map((s) => {
                const membrosSetor = users.filter((u) => u.setorNome === s.nome || u.setoresNomes?.includes(s.nome));
                return (
                  <div
                    key={s.id}
                    className="coursue-card p-6 rounded-[24px] border border-border shadow-sm space-y-4 hover:shadow-md transition-all relative overflow-hidden group"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: s.cor || "#5B50E5" }}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-3 rounded-2xl text-white shadow-md"
                          style={{ backgroundColor: s.cor || "#5B50E5" }}
                        >
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                            {s.nome}
                          </h4>
                          <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                            {membrosSetor.length} membro(s) vinculados
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                      {s.descricao || "Departamento operacional Hashira."}
                    </p>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                      <div className="flex items-center -space-x-2 py-0.5">
                        {membrosSetor.slice(0, 4).map((m) => (
                          <img
                            key={m.id}
                            src={m.avatarUrl}
                            alt={m.nome}
                            className="w-7 h-7 rounded-full object-cover shrink-0 aspect-square ring-2 ring-white dark:ring-gray-900 shadow-xs"
                            title={m.nome}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md" style={{ backgroundColor: (s.cor || "#5B50E5") + "20", color: s.cor || "#5B50E5" }}>
                        Ativo
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── ABA 4: MODO DE VISUALIZAÇÃO (ADMIN / COLABORADOR) ── */}
        {activeTab === "visualizacao" && (
          <section className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                Modo de Visualização & Simulação de Papel
              </h2>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Alterne entre a visão completa de Administrador e a visão restrita de Colaborador para auditar a interface.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Admin */}
              <div
                onClick={() => handleToggleSimulatedRole("administrador")}
                className={`p-6 rounded-[28px] border-2 cursor-pointer transition-all space-y-4 relative ${
                  simulatedRole === "administrador"
                    ? "border-[#5B50E5] shadow-xl shadow-[#5B50E5]/15"
                    : "border-border hover:border-gray-400 opacity-75"
                }`}
                style={{
                  backgroundColor: simulatedRole === "administrador" ? "var(--brand-light)" : "var(--surface)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-[#5B50E5] text-white shadow-lg">
                    <Shield className="w-6 h-6" />
                  </div>
                  {simulatedRole === "administrador" && (
                    <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-[#5B50E5] text-white flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                    Modo Administrador 👑
                  </h3>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Acesso irrestrito a todas as métricas financeiras, gráficos executivos, gestão de equipe, permissões, criação e exclusão global de demandas.
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50 text-[11px] font-semibold flex items-center gap-2 text-[#5B50E5]">
                  <Unlock className="w-3.5 h-3.5" /> Acesso total aos menus e ferramentas
                </div>
              </div>

              {/* Card Colaborador */}
              <div
                onClick={() => handleToggleSimulatedRole("colaborador")}
                className={`p-6 rounded-[28px] border-2 cursor-pointer transition-all space-y-4 relative ${
                  simulatedRole === "colaborador"
                    ? "border-[#5B50E5] shadow-xl shadow-[#5B50E5]/15"
                    : "border-border hover:border-gray-400 opacity-75"
                }`}
                style={{
                  backgroundColor: simulatedRole === "colaborador" ? "var(--brand-light)" : "var(--surface)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg">
                    <User className="w-6 h-6" />
                  </div>
                  {simulatedRole === "colaborador" && (
                    <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-[#5B50E5] text-white flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                    Modo Colaborador 👤
                  </h3>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Visão operacional focada nas demandas atribuídas ao usuário, métricas pessoais de entrega e Central de Operações conforme permissão.
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50 text-[11px] font-semibold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Lock className="w-3.5 h-3.5" /> Menus administrativos ocultados
                </div>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* ── MODAL: ADICIONAR NOVO COLABORADOR ── */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowAddUserModal(false)}
            className="fixed inset-0 backdrop-blur-md"
            style={{ backgroundColor: "var(--modal-overlay)" }}
          />
          <div
            className="relative w-full max-w-md rounded-[28px] p-6 shadow-2xl z-10 space-y-4 border border-border"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                Novo Colaborador
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--text-primary)" }}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="coursue-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--text-primary)" }}>
                  E-mail de Acesso *
                </label>
                <input
                  type="email"
                  required
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="carlos@hashira.com"
                  className="coursue-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--text-primary)" }}>
                    Departamento
                  </label>
                  <select
                    value={novoSetor}
                    onChange={(e) => setNovoSetor(e.target.value)}
                    className="coursue-input text-xs cursor-pointer"
                  >
                    {HASHIRAS_SEED.map((h) => (
                      <option key={h.id} value={h.nome}>
                        {h.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--text-primary)" }}>
                    Papel
                  </label>
                  <select
                    value={novoPapel}
                    onChange={(e) => setNovoPapel(e.target.value as "colaborador" | "administrador")}
                    className="coursue-input text-xs cursor-pointer"
                  >
                    <option value="colaborador">Colaborador</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="coursue-btn-secondary text-xs py-2 px-4"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="coursue-btn-primary text-xs py-2 px-5 shadow-lg shadow-[#5B50E5]/25"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADICIONAR NOVO SETOR ── */}
      {showAddSetorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowAddSetorModal(false)}
            className="fixed inset-0 backdrop-blur-md"
            style={{ backgroundColor: "var(--modal-overlay)" }}
          />
          <div
            className="relative w-full max-w-md rounded-[28px] p-6 shadow-2xl z-10 space-y-4 border border-border"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                Novo Departamento Hashira
              </h3>
              <button onClick={() => setShowAddSetorModal(false)} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSetor} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--text-primary)" }}>
                  Nome do Setor *
                </label>
                <input
                  type="text"
                  required
                  value={novoSetorNome}
                  onChange={(e) => setNovoSetorNome(e.target.value)}
                  placeholder="Ex: Tráfego Pago & Performance"
                  className="coursue-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--text-primary)" }}>
                  Cor Temática
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={novoSetorCor}
                    onChange={(e) => setNovoSetorCor(e.target.value)}
                    className="h-9 w-12 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={novoSetorCor}
                    onChange={(e) => setNovoSetorCor(e.target.value)}
                    className="coursue-input text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--text-primary)" }}>
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={novoSetorDescricao}
                  onChange={(e) => setNovoSetorDescricao(e.target.value)}
                  placeholder="Responsabilidades e escopo deste setor..."
                  className="w-full rounded-2xl p-3 text-xs outline-none"
                  style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddSetorModal(false)}
                  className="coursue-btn-secondary text-xs py-2 px-4"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="coursue-btn-primary text-xs py-2 px-5 shadow-lg shadow-[#5B50E5]/25"
                >
                  Criar Setor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminConfiguracoesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-[#5B50E5]">Carregando configurações...</div>}>
      <AdminConfiguracoesContent />
    </Suspense>
  );
}
