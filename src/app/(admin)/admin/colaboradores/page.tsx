"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, User } from "lucide-react";
import { HASHIRAS_SEED } from "@/lib/demands";
import { getActiveUser } from "@/lib/authPermissions";
import { AppSidebar } from "@/components/AppSidebar";
import { toast } from "sonner";

interface Colaborador {
  id: string;
  nome: string;
  email: string;
  setorNome: string;
  papel: "colaborador" | "administrador";
  entregas: number;
  avatar: string;
}

const COLABORADORES_SEED: Colaborador[] = [
  {
    id: "usr-01",
    nome: "Matheus Ramos",
    email: "matheus@hashira.com",
    setorNome: "Estrutura de Funil",
    papel: "colaborador",
    entregas: 18,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "usr-02",
    nome: "Henrique Silva",
    email: "henrique@hashira.com",
    setorNome: "Marketing",
    papel: "colaborador",
    entregas: 14,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "usr-03",
    nome: "Debora Santos",
    email: "debora@hashira.com",
    setorNome: "Pós-venda, Suporte e Atendimento ao Cliente",
    papel: "colaborador",
    entregas: 11,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "usr-04",
    nome: "Guardião",
    email: "guardiao@hashira.com",
    setorNome: "Produtos",
    papel: "colaborador",
    entregas: 9,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  },
];

export default function AdminColaboradoresPage() {
  const router = useRouter();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(COLABORADORES_SEED);
  const [showModal, setShowModal] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    const user = getActiveUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUserChecked(true);
  }, [router]);

  if (!userChecked) return null;

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [setorNome, setSetorNome] = useState(HASHIRAS_SEED[0].nome);
  const [papel, setPapel] = useState<"colaborador" | "administrador">("colaborador");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      toast.error("Preencha nome e e-mail");
      return;
    }

    const novo: Colaborador = {
      id: "usr-" + Date.now(),
      nome: nome.trim(),
      email: email.trim(),
      setorNome,
      papel,
      entregas: 0,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    };

    setColaboradores([...colaboradores, novo]);
    toast.success("Colaborador convidado!");
    setNome("");
    setEmail("");
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setColaboradores(colaboradores.filter((c) => c.id !== id));
    toast.success("Colaborador removido");
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar userRole="administrador" userName="Administrador Central" />

      <div className="flex-1 min-w-0 p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
              Gestão de Colaboradores Auto-Cadastrados
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Monitore a equipe vinculada aos 6 Departamentos Hashiras
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="coursue-btn-primary py-2.5 px-5 text-xs shadow-lg shadow-[#5B50E5]/20"
          >
            <Plus className="w-4 h-4" /> Convidar Colaborador
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {colaboradores.map((c) => (
            <div
              key={c.id}
              className="coursue-card p-6 rounded-[24px] shadow-sm space-y-4"
            >
              <div className="flex items-center gap-4">
                <img src={c.avatar} alt={c.nome} className="w-14 h-14 rounded-2xl object-cover" style={{ border: '2px solid var(--border)' }} />
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base font-['Plus_Jakarta_Sans'] truncate" style={{ color: 'var(--text-primary)' }}>
                    {c.nome}
                  </h3>
                  <span className="text-xs block truncate" style={{ color: 'var(--text-secondary)' }}>
                    {c.email}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="px-2.5 py-1 rounded-lg font-bold uppercase text-[#5B50E5] text-[10px]" style={{ backgroundColor: 'var(--brand-light)' }}>
                  {c.setorNome}
                </span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {c.entregas} entregas
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--text-secondary)' }}>
                  {c.papel}
                </span>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg text-rose-500 transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--rose-hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
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
              <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                Convidar Colaborador
              </h3>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-primary)' }}>
                    Nome Completo
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
                    E-mail
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
                    Departamento Hashira
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

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="coursue-btn-secondary py-2 text-xs"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="coursue-btn-primary py-2 text-xs">
                    Enviar Convite
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
