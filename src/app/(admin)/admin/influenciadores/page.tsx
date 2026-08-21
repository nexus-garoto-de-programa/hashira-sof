"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserRoundPlus, Search, Users, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import {
  Influenciador,
  fetchInfluenciadoresFromSupabase,
  getStoredInfluenciadores,
  saveInfluenciadorToSupabase,
} from "@/lib/influenciadores";
import { AppSidebar } from "@/components/AppSidebar";
import { CreateInfluenciadorModal } from "@/components/influenciadores/CreateInfluenciadorModal";
import { useRealtimeSubscription } from "@/lib/realtimeSync";
import { getActiveUser } from "@/lib/authPermissions";
import { toast } from "sonner";

export default function InfluenciadoresListPage() {
  const router = useRouter();
  const [influenciadores, setInfluenciadores] = useState<Influenciador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Proteção de rota
  useEffect(() => {
    const user = getActiveUser();
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.papel !== "administrador" && !user.permissoes?.acessoCDI) {
      router.push("/dashboard");
      return;
    }
  }, [router]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Renderização instantânea com cache
      const cached = getStoredInfluenciadores();
      if (cached.length > 0) setInfluenciadores(cached);

      const remote = await fetchInfluenciadoresFromSupabase();
      setInfluenciadores(remote);
    } catch {
      setInfluenciadores(getStoredInfluenciadores());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  useRealtimeSubscription({
    topics: ["influenciadores"],
    onUpdate: carregarDados,
  });

  const handleSaveNovo = async (inf: Influenciador) => {
    await saveInfluenciadorToSupabase(inf);
    toast.success(`Influenciador "${inf.nome}" cadastrado com sucesso!`);
    carregarDados();
  };

  const filtrados = influenciadores.filter((inf) => {
    const q = searchQuery.toLowerCase();
    return (
      inf.nome.toLowerCase().includes(q) ||
      inf.slugBio.toLowerCase().includes(q) ||
      inf.slugPrincipal.toLowerCase().includes(q)
    );
  });

  const ativos = influenciadores.filter((i) => i.ativo).length;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-[#5B50E5]/15 flex items-center justify-center">
                  <UserRoundPlus className="w-5 h-5 text-[#5B50E5]" />
                </div>
                <h1
                  className="text-2xl font-extrabold font-['Plus_Jakarta_Sans']"
                  style={{ color: "var(--text-primary)" }}
                >
                  Cadastro de Influenciadores
                </h1>
              </div>
              <p className="text-sm ml-[52px]" style={{ color: "var(--text-secondary)" }}>
                {influenciadores.length} cadastrados · {ativos} ativos
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="coursue-btn-primary py-2.5 px-5 text-sm shadow-lg shadow-[#5B50E5]/25 flex items-center gap-2 shrink-0"
            >
              <UserRoundPlus className="w-4 h-4" />
              Cadastrar Influenciador
            </button>
          </div>

          {/* Busca */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou slug..."
              className="coursue-input pl-10 text-sm py-3 w-full"
            />
          </div>

          {/* Grid de Cards */}
          {loading && influenciadores.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-3xl animate-pulse"
                  style={{ backgroundColor: "var(--surface)" }}
                />
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#5B50E5]/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-[#5B50E5]/40" />
              </div>
              <p className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
                {searchQuery ? "Nenhum influenciador encontrado" : "Nenhum influenciador cadastrado ainda"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="coursue-btn-primary py-2 px-5 text-sm mx-auto"
                >
                  Cadastrar primeiro influenciador
                </button>
              )}
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              <AnimatePresence>
                {filtrados.map((inf) => (
                  <motion.div
                    key={inf.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => router.push(`/admin/influenciadores/${inf.id}`)}
                      className="w-full text-left rounded-3xl p-5 transition-all group hover:shadow-lg"
                      style={{
                        backgroundColor: "var(--surface)",
                        border: "1px solid var(--border)",
                        opacity: inf.ativo ? 1 : 0.65,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#5B50E5";
                        e.currentTarget.style.boxShadow = "0 4px 24px rgba(91,80,229,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.boxShadow = "";
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="shrink-0">
                          {inf.fotoUrl ? (
                            <img
                              src={inf.fotoUrl}
                              alt={inf.nome}
                              className="w-14 h-14 rounded-2xl object-cover ring-1 ring-white/10"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5B50E5] to-[#7C3AED] flex items-center justify-center text-white font-extrabold text-xl">
                              {inf.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p
                              className="font-extrabold text-sm truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {inf.nome}
                            </p>
                            {!inf.ativo && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 font-bold shrink-0">
                                Inativo
                              </span>
                            )}
                          </div>
                          <p
                            className="text-xs font-mono truncate"
                            style={{ color: "var(--text-muted)" }}
                          >
                            /{inf.slugBio}
                          </p>
                          <p
                            className="text-[11px] mt-1"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {inf.linksCheckout.length} link{inf.linksCheckout.length !== 1 ? "s" : ""} de checkout
                          </p>
                        </div>

                        <ChevronRight
                          className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                          style={{ color: "var(--text-muted)" }}
                        />
                      </div>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showCreateModal && (
          <CreateInfluenciadorModal
            onClose={() => setShowCreateModal(false)}
            onSave={handleSaveNovo}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
