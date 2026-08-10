"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Layers,
  Users,
  LogOut,
  Command,
  ShieldCheck,
  User,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import {
  getActiveUser,
  getAdminSimulatedRole,
  setAdminSimulatedRole,
  UserAccount,
  USERS_SEED,
} from "@/lib/authPermissions";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "sonner";

interface AppSidebarProps {
  userRole?: "colaborador" | "administrador";
  userName?: string;
  userEmail?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  userRole,
  userName,
  userEmail,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => USERS_SEED[0]);
  const [simulatedRole, setSimulatedRole] = useState<"administrador" | "colaborador">("administrador");

  useEffect(() => {
    setCurrentUser(getActiveUser());
    setSimulatedRole(getAdminSimulatedRole());
  }, [pathname]);

  const handleSignOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success("Sessão encerrada");
    router.push("/login");
  };

  const handleToggleAdminRole = () => {
    const nextRole = simulatedRole === "administrador" ? "colaborador" : "administrador";
    setSimulatedRole(nextRole);
    setAdminSimulatedRole(nextRole);

    if (nextRole === "colaborador") {
      toast.success("Visão alterada para modo COLABORADOR 👤");
    } else {
      toast.success("Visão alterada para modo ADMINISTRADOR 👑");
    }
  };

  const isAdminAccount = currentUser.email === "mhvzbusiness@gmail.com" || currentUser.papel === "administrador";
  const activeRoleView = isAdminAccount ? simulatedRole : "colaborador";

  const displayName = userName || currentUser.comoQuerSerChamado || currentUser.nickname || currentUser.nome;
  const displayEmail = userEmail || currentUser.email;
  const avatar = currentUser.avatarUrl;
  const userInitial = displayName.charAt(0).toUpperCase();

  // Dynamic Navigation Items filtered by Active Permissions & Simulated Role
  const navItems = [
    ...(currentUser.permissoes.acessoDashboard
      ? [{ href: "/dashboard", label: "Meu Painel", icon: Home }]
      : []),
    { href: "/perfil", label: "Meu Perfil", icon: User },
    ...(currentUser.permissoes.acessoOperacoes
      ? [{ href: "/operacoes", label: "Central de Operações", icon: Command }]
      : []),
    ...(activeRoleView === "administrador"
      ? [
          { href: "/admin/dashboard", label: "Painel Admin", icon: LayoutDashboard },
          { href: "/admin/setores", label: "Setores (Hashiras)", icon: Layers },
          { href: "/admin/colaboradores", label: "Equipe", icon: Users },
          { href: "/admin/permissoes", label: "Gestão de Acessos", icon: ShieldCheck },
        ]
      : []),
  ];

  return (
    <aside
      className="w-[260px] shrink-0 flex flex-col justify-between h-screen sticky top-0 z-30"
      style={{
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        boxShadow: '1px 0 0 var(--border)',
      }}
    >
      {/* Brand Header */}
      <div>
        <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <img
              src="/hashira-logo-vertical.png"
              alt="HASHIRA OFICIAL"
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div>
              <span className="font-extrabold text-xs uppercase tracking-widest text-[#5B50E5] block">
                Gestão Cascata
              </span>
              <span className="text-[10px] block" style={{ color: 'var(--text-secondary)' }}>Central Hashira</span>
            </div>
          </Link>
        </div>

        {/* Navigation Group */}
        <div className="p-4 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Menu Principal
          </p>
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: active ? 'var(--active-nav-bg)' : 'transparent',
                  color: active ? 'var(--active-nav-text)' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-nav-bg)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Profile & Role Switcher next to LogOut */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className="p-3 rounded-2xl transition-all flex items-center justify-between gap-2 group"
          style={{
            backgroundColor: 'var(--surface-alt)',
            border: '1px solid var(--border)',
          }}
        >
          <Link href="/perfil" className="flex items-center gap-2.5 min-w-0 flex-1">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="h-8 w-8 rounded-full object-cover shrink-0"
                style={{ border: '1px solid var(--border)' }}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#5B50E5] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {userInitial}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate leading-tight transition-colors" style={{ color: 'var(--text-primary)' }}>
                {displayName}
              </span>
              <span className="text-[10px] block truncate" style={{ color: 'var(--text-muted)' }}>
                {displayEmail}
              </span>
            </div>
          </Link>

          {/* Action Buttons: Theme Toggle + Role Switcher + Log Out */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
              }}
              className="p-1.5 rounded-lg transition-colors"
              style={{
                color: theme === 'dark' ? '#FBBF24' : 'var(--text-secondary)',
                backgroundColor: theme === 'dark' ? 'rgba(251,191,36,0.15)' : 'transparent',
              }}
              title={theme === 'dark' ? 'Mudar para tema claro ☀️' : 'Mudar para tema escuro 🌙'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAdminAccount && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleAdminRole();
                }}
                className={`p-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 shadow-sm ${
                  activeRoleView === "administrador"
                    ? "bg-[#1E1B4B] text-white hover:bg-[#3730A3]"
                    : "bg-[#5B50E5] text-white hover:bg-[#483EA8]"
                }`}
                title={`Alternar perfil (Atual: ${activeRoleView === "administrador" ? "Modo Admin 👑" : "Modo Colaborador 👤"})`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">
                  {activeRoleView === "administrador" ? "👑 Admin" : "👤 Colab"}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-rose-500 transition-colors"
              style={{ }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--rose-hover-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
