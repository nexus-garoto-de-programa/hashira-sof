"use client";

import React, { useState } from "react";
import { ShieldCheck, UserCheck, Check, X, Search, Sparkles } from "lucide-react";
import {
  getStoredUsers,
  saveStoredUsers,
  UserAccount,
  UserPermissions,
} from "@/lib/authPermissions";
import { AppSidebar } from "@/components/AppSidebar";
import { toast } from "sonner";

export default function AdminPermissoesPage() {
  const [users, setUsers] = useState<UserAccount[]>(getStoredUsers);
  const [searchQuery, setSearchQuery] = useState("");

  const updateUsersState = (newUsers: UserAccount[]) => {
    setUsers(newUsers);
    saveStoredUsers(newUsers);
  };

  const handleTogglePermission = (userId: string, key: keyof UserPermissions) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        const currentVal = u.permissoes[key];
        return {
          ...u,
          permissoes: {
            ...u.permissoes,
            [key]: !currentVal,
          },
        };
      }
      return u;
    });

    updateUsersState(updated);
    toast.success("Permissão de acesso atualizada com sucesso!");
  };

  const filteredUsers = users.filter((u) =>
    u.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.setorNome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const permissionLabels: { key: keyof UserPermissions; label: string; desc: string }[] = [
    { key: "acessoDashboard", label: "Meu Painel", desc: "Visão pessoal do colaborador (/dashboard)" },
    { key: "acessoOperacoes", label: "Central de Operações", desc: "Acesso geral à Central de Operações (/operacoes)" },
    { key: "acessoSetoresTab", label: "Aba Setores", desc: "Visualização de capas e estatísticas por setor" },
    { key: "acessoTarefasTab", label: "Quadro Kanban", desc: "Visualização das 4 colunas de tarefas" },
    { key: "acessoProjetosTab", label: "Projetos (Etiquetas)", desc: "Gestão e visualização de etiquetas" },
    { key: "acessoPerformanceTab", label: "Aba Performance", desc: "Métricas de entregas e log da equipe" },
    { key: "acessoCalendarioTab", label: "Aba Calendário", desc: "Grade de calendário mensal" },
    { key: "acessoAdminPanorama", label: "Painel Admin", desc: "Visão panorâmica geral de todos os setores" },
  ];

  return (
    <div className="flex min-h-screen">
      <AppSidebar userRole="administrador" userName="Administrador Central" />

      <div className="flex-1 min-w-0 p-8 space-y-8">
        
        {/* Banner */}
        <section
          className="coursue-banner relative p-8 md:p-10 shadow-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 100%)" }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold mb-3 bg-white/10 text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Gestão Exclusiva do Administrador
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                Controle de Permissões de Usuários
              </h1>
              <p className="mt-2 text-sm text-white/80 max-w-2xl">
                Defina exatamente a quais seções da plataforma cada colaborador tem autorização para acessar. Desative acessos com apenas 1 clique.
              </p>
            </div>
          </div>
        </section>

        {/* Search */}
        <div className="flex items-center justify-between gap-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
              Matriz de Controle por Colaborador
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Exibindo <strong style={{ color: 'var(--text-primary)' }}>{filteredUsers.length} usuários</strong> no sistema
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar colaborador ou e-mail…"
              className="coursue-input pl-11 text-xs"
            />
          </div>
        </div>

        {/* Users Permission Cards */}
        <div className="space-y-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="coursue-card p-6 rounded-[24px] shadow-sm space-y-6"
            >
              {/* User Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-4">
                  <img
                    src={user.avatarUrl}
                    alt={user.nome}
                    className="w-12 h-12 rounded-2xl object-cover"
                    style={{ border: '2px solid var(--border)' }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                        {user.nome}
                      </h3>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          user.papel === "administrador"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-[#EBE8FF] text-[#5B50E5]"
                        }`}
                      >
                        {user.papel}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user.email}</span>
                  </div>
                </div>

                <div className="text-xs font-semibold px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  Departamento: <strong style={{ color: 'var(--text-primary)' }}>{user.setorNome}</strong>
                </div>
              </div>

              {/* Permissions Switches Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {permissionLabels.map((perm) => {
                  const isEnabled = user.permissoes[perm.key];
                  return (
                    <div
                      key={perm.key}
                      onClick={() => handleTogglePermission(user.id, perm.key)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isEnabled
                          ? "shadow-sm"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: isEnabled ? 'var(--surface-alt)' : 'var(--surface-raised)',
                        borderColor: isEnabled ? 'rgba(91,80,229,0.4)' : 'var(--border)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                          {perm.label}
                        </span>
                        
                        {/* Switch toggle */}
                        <div
                          className={`w-10 h-6 rounded-full p-1 transition-colors flex items-center ${
                            isEnabled ? "bg-[#5B50E5] justify-end" : "bg-gray-400 justify-start"
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                        </div>
                      </div>

                      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {perm.desc}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-[10px] font-bold" style={{ borderTop: '1px solid var(--border)' }}>
                        <span className={isEnabled ? "text-emerald-600" : "text-rose-600"}>
                          {isEnabled ? "● Acesso Permitido" : "○ Acesso Bloqueado"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
