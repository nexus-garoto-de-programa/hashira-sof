"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Layers } from "lucide-react";
import { HASHIRAS_SEED, SetorHashira, getStoredSetores, saveStoredSetores } from "@/lib/demands";
import { getActiveUser, getStoredUsers, UserAccount } from "@/lib/authPermissions";
import { AppSidebar } from "@/components/AppSidebar";
import { toast } from "sonner";

export default function AdminSetoresPage() {
  const router = useRouter();
  const [setores, setSetores] = useState<SetorHashira[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userChecked, setUserChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#5B50E5");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    const user = getActiveUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUserChecked(true);
    setSetores(getStoredSetores());
    setUsers(getStoredUsers());
  }, [router]);

  if (!userChecked) return null;

  const handleCreateSetor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome do setor");
      return;
    }

    const novo: SetorHashira = {
      id: "sec-" + Date.now(),
      nome: nome.trim(),
      slug: nome.toLowerCase().replace(/\s+/g, "-"),
      membrosReferencia: [],
      cor,
      badgeBg: "#EBE8FF",
      badgeText: cor,
      icone: "Layers",
      descricao: descricao.trim() || "Departamento operacional Hashira",
    };

    const atualizados = [...setores, novo];
    setSetores(atualizados);
    saveStoredSetores(atualizados);
    toast.success("Novo setor cadastrado com sucesso!");

    setNome("");
    setDescricao("");
    setShowModal(false);
  };

  const handleDeleteSetor = (id: string) => {
    const atualizados = setores.filter((s) => s.id !== id);
    setSetores(atualizados);
    saveStoredSetores(atualizados);
    toast.success("Setor removido");
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar userRole="administrador" userName="Administrador Central" />

      <div className="flex-1 min-w-0 p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
              Gestão de Departamentos (Hashiras)
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Cadastre e gerencie os 6 departamentos oficiais da empresa
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="coursue-btn-primary py-2.5 px-5 text-xs shadow-lg shadow-[#5B50E5]/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Novo Setor
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {setores.map((s) => {
            const realMembers = users
              .filter((u) => u.setorNome === s.nome || u.setoresNomes?.includes(s.nome))
              .map((u) => u.comoQuerSerChamado || u.nickname || u.nome);

            return (
              <div
                key={s.id}
                className="coursue-card p-6 rounded-[24px] shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg"
                      style={{ background: s.badgeBg, color: s.badgeText }}
                    >
                      {s.nome}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>/{s.slug}</span>
                  </div>
                  
                  {realMembers.length > 0 && (
                    <div className="mb-3 text-[11px] font-semibold text-[#5B50E5]">
                      Membros Cadastrados: {realMembers.join(", ")}
                    </div>
                  )}

                  <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>{s.descricao}</p>
                </div>

              <div className="pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-[11px] font-semibold text-emerald-600">Ativo no Cadastro</span>
                <button
                  onClick={() => handleDeleteSetor(s.id)}
                  className="p-2 rounded-xl text-rose-500 transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--rose-hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Excluir Setor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

        {/* Modal Novo Setor */}
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
                Cadastrar Novo Setor
              </h3>

              <form onSubmit={handleCreateSetor} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-primary)' }}>
                    Nome do Setor
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Recursos Humanos"
                    className="coursue-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-primary)' }}>
                    Cor de Identificação
                  </label>
                  <input
                    type="color"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    className="h-10 w-full rounded-xl cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-primary)' }}>
                    Descrição
                  </label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Finalidade operacional do setor…"
                    rows={3}
                    className="w-full rounded-xl p-3 text-xs outline-none focus:border-[#5B50E5]"
                    style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
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
                    Salvar Setor
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
