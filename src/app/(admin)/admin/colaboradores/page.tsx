"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, User, Sparkles } from "lucide-react";
import { HASHIRAS_SEED, getStoredDemandas, saveStoredUsuario, Usuario } from "@/lib/demands";
import {
  getActiveUser,
  getStoredUsers,
  saveStoredUsers,
  deleteStoredUser,
  UserAccount,
  DEFAULT_COLLABORATOR_PERMISSIONS,
  ADMIN_PERMISSIONS,
} from "@/lib/authPermissions";
import { AppSidebar } from "@/components/AppSidebar";
import { toast } from "sonner";

export default function AdminColaboradoresPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    const active = getActiveUser();
    if (!active) {
      router.push("/login");
      return;
    }
    if (active.papel !== "administrador" && active.email !== "mhvzbusiness@gmail.com") {
      toast.error("Acesso restrito a Administradores.");
      router.push("/dashboard");
      return;
    }
    setUserChecked(true);

    const reloadUsers = () => {
      setUsers(getStoredUsers());
    };

    reloadUsers();

    window.addEventListener("hashira_users_updated", reloadUsers);
    window.addEventListener("storage", reloadUsers);

    return () => {
      window.removeEventListener("hashira_users_updated", reloadUsers);
      window.removeEventListener("storage", reloadUsers);
    };
  }, [router]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [setorNome, setSetorNome] = useState(HASHIRAS_SEED[0].nome);
  const [papel, setPapel] = useState<"colaborador" | "administrador">("colaborador");

  const demandasList = useMemo(() => getStoredDemandas(), []);

  if (!userChecked) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      toast.error("Preencha nome e e-mail");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (existing) {
      toast.error("Este e-mail já pertence a um colaborador cadastrado!");
      return;
    }

    const userId = "usr-" + Date.now();
    const displayName = nome.trim();
    const nickname = displayName.split(" ")[0];

    const novoUser: UserAccount = {
      id: userId,
      nome: displayName,
      nickname,
      comoQuerSerChamado: displayName,
      cargo: papel === "administrador" ? "Administrador Geral" : "Operador de Demandas",
      bio: "Colaborador adicionado pelo Administrador Central.",
      email: cleanEmail,
      papel,
      setorNome,
      setoresNomes: [setorNome],
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      permissoes: papel === "administrador" ? ADMIN_PERMISSIONS : DEFAULT_COLLABORATOR_PERMISSIONS,
    };

    const novoUsuarioDemandas: Usuario = {
      id: userId,
      nome: displayName,
      email: cleanEmail,
      papel,
      setorId: HASHIRAS_SEED.find((s) => s.nome === setorNome)?.id || HASHIRAS_SEED[0].id,
      setorNome,
      statusConta: "ativo",
      avatarUrl: novoUser.avatarUrl,
      criadoEm: new Date().toISOString(),
    };

    saveStoredUsuario(novoUsuarioDemandas);
    saveStoredUsers([novoUser]);

    toast.success(`Colaborador ${displayName} convidado e cadastrado com sucesso!`);
    setNome("");
    setEmail("");
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteStoredUser(id);
    toast.success("Colaborador removido do sistema");
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar userRole="administrador" userName="Administrador Central" />

      <div className="flex-1 min-w-0 p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
              Gestão de Colaboradores Cadastrados
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Monitore a equipe registrada e vinculada aos 6 Departamentos Hashiras ({users.length} membros)
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="coursue-btn-primary py-2.5 px-5 text-xs shadow-lg shadow-[#5B50E5]/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Convidar / Adicionar Colaborador
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((c) => {
            const entregasCount = demandasList.filter(
              (d) =>
                d.status === "concluida" &&
                ((d.colaboradorId && d.colaboradorId === c.id) ||
                  (d.colaboradorNome && d.colaboradorNome.toLowerCase() === c.nome.toLowerCase()))
            ).length;

            const userSectors = c.setoresNomes?.join(", ") || c.setorNome;
            const displayName = c.comoQuerSerChamado || c.nickname || c.nome;

            return (
              <div
                key={c.id}
                className="coursue-card p-6 rounded-[24px] shadow-sm space-y-4"
              >
                <div className="flex items-center gap-4">
                  <img src={c.avatarUrl} alt={displayName} className="w-14 h-14 rounded-2xl object-cover" style={{ border: '2px solid var(--border)' }} />
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-base font-['Plus_Jakarta_Sans'] truncate" style={{ color: 'var(--text-primary)' }}>
                      {displayName}
                    </h3>
                    <span className="text-xs block truncate" style={{ color: 'var(--text-secondary)' }}>
                      {c.email}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="px-2.5 py-1 rounded-lg font-bold uppercase text-[#5B50E5] text-[10px] truncate max-w-[170px]" style={{ backgroundColor: 'var(--brand-light)' }} title={userSectors}>
                    {userSectors}
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {entregasCount} entregas
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      c.papel === "administrador" ? "bg-amber-100 text-amber-800" : "bg-[#EBE8FF] text-[#5B50E5]"
                    }`}
                  >
                    {c.papel}
                  </span>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-lg text-rose-500 transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--rose-hover-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Remover Colaborador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Convidar Colaborador */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 backdrop-blur-md"
              style={{ backgroundColor: 'var(--modal-overlay)' }}
              onClick={() => setShowModal(false)}
            />
            <div
              className="relative w-full max-w-md rounded-[28px] p-6 shadow-2xl z-10 space-y-4"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                  Convidar Novo Colaborador
                </h3>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-primary)' }}>
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do colaborador"
                    className="coursue-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-primary)' }}>
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colaborador@hashira.com"
                    className="coursue-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-primary)' }}>
                    Departamento Hashira Principal
                  </label>
                  <select
                    value={setorNome}
                    onChange={(e) => setSetorNome(e.target.value)}
                    className="coursue-input text-xs cursor-pointer"
                  >
                    {HASHIRAS_SEED.map((s) => (
                      <option key={s.id} value={s.nome}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-primary)' }}>
                    Papel / Perfil de Acesso
                  </label>
                  <select
                    value={papel}
                    onChange={(e) => setPapel(e.target.value as "colaborador" | "administrador")}
                    className="coursue-input text-xs cursor-pointer"
                  >
                    <option value="colaborador">Colaborador (Padrão)</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="coursue-btn-secondary py-2 text-xs px-4"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="coursue-btn-primary py-2 text-xs px-5">
                    Salvar & Convidar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
