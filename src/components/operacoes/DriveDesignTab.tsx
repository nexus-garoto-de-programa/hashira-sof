"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Plus, ExternalLink, Pencil, Trash2, Search, ImageIcon } from "lucide-react";
import {
  DriveDesignBlock,
  fetchDriveDesignBlocksFromSupabase,
  getStoredDriveDesignBlocks,
  saveDriveDesignBlockToSupabase,
  deleteDriveDesignBlockFromSupabase,
} from "@/lib/driveDesignData";
import { DriveDesignBlockModal } from "@/components/operacoes/DriveDesignBlockModal";
import { useRealtimeSubscription } from "@/lib/realtimeSync";
import { UserAccount } from "@/lib/authPermissions";
import { toast } from "sonner";

interface DriveDesignTabProps {
  currentUser: UserAccount;
}

export function DriveDesignTab({ currentUser }: DriveDesignTabProps) {
  const [blocks, setBlocks] = useState<DriveDesignBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<DriveDesignBlock | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const cached = getStoredDriveDesignBlocks();
      if (cached.length > 0) setBlocks(cached);

      const remote = await fetchDriveDesignBlocksFromSupabase();
      setBlocks(remote);
    } catch {
      setBlocks(getStoredDriveDesignBlocks());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  useRealtimeSubscription({
    topics: ["drive-design", "drive_design_blocks"],
    onUpdate: carregarDados,
  });

  const handleSaveBlock = async (block: DriveDesignBlock) => {
    await saveDriveDesignBlockToSupabase(block);
    toast.success(`Bloco "${block.titulo}" salvo com sucesso!`);
    carregarDados();
  };

  const handleDeleteBlock = async (id: string, titulo: string) => {
    if (!confirm(`Tem certeza que deseja excluir o bloco "${titulo}"?`)) return;
    await deleteDriveDesignBlockFromSupabase(id);
    toast.success(`Bloco "${titulo}" removido.`);
    carregarDados();
  };

  const filtrados = blocks.filter((b) => {
    const q = searchQuery.toLowerCase();
    return b.titulo.toLowerCase().includes(q) || b.descricao.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header da Aba */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#5B50E5]/15 flex items-center justify-center shrink-0">
            <Folder className="w-6 h-6 text-[#5B50E5]" />
          </div>
          <div>
            <h2
              className="text-xl font-extrabold font-['Plus_Jakarta_Sans']"
              style={{ color: "var(--text-primary)" }}
            >
              Drive de Design
            </h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Central de links rápidos para capas, mídias e materiais da equipe
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingBlock(null);
            setShowModal(true);
          }}
          className="coursue-btn-primary py-2.5 px-5 text-xs shadow-lg shadow-[#5B50E5]/25 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Bloco
        </button>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por título ou descrição..."
          className="coursue-input pl-10 text-xs py-2.5 w-full"
        />
      </div>

      {/* Grid de Cards */}
      {loading && blocks.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl animate-pulse"
              style={{ backgroundColor: "var(--surface)" }}
            />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 space-y-3 rounded-3xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#5B50E5]/10 flex items-center justify-center">
            <Folder className="w-8 h-8 text-[#5B50E5]/40" />
          </div>
          <p className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
            {searchQuery ? "Nenhum bloco de design encontrado" : "Nenhum bloco cadastrado no Drive de Design"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                setEditingBlock(null);
                setShowModal(true);
              }}
              className="coursue-btn-primary py-2 px-5 text-xs mx-auto"
            >
              Cadastrar Primeiro Bloco
            </button>
          )}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtrados.map((block) => (
              <motion.div
                key={block.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl overflow-hidden flex flex-col justify-between transition-all group"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(91,80,229,0.5)";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(91,80,229,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                {/* Banner Header */}
                <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                  {block.bannerUrl ? (
                    <img
                      src={block.bannerUrl}
                      alt={block.titulo}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1F1B3E] to-[#0F0E1A] text-gray-500">
                      <ImageIcon className="w-10 h-10 text-[#5B50E5]/40 mb-1" />
                      <span className="text-[11px] font-mono text-gray-500">Sem imagem</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Ações (Lápis e Lixeira) no topo do banner */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => {
                        setEditingBlock(block);
                        setShowModal(true);
                      }}
                      title="Editar bloco"
                      className="p-2 rounded-xl transition-colors backdrop-blur-md"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.6)",
                        color: "#ffffff",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block.id, block.titulo)}
                      title="Excluir bloco"
                      className="p-2 rounded-xl transition-colors backdrop-blur-md text-rose-400"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.6)",
                        border: "1px solid rgba(244,63,94,0.3)",
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3
                      className="text-base font-extrabold font-['Plus_Jakarta_Sans'] uppercase tracking-wider line-clamp-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {block.titulo}
                    </h3>
                    {block.descricao && (
                      <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {block.descricao}
                      </p>
                    )}
                  </div>

                  {/* Botão de Ação: Abrir Drive (Estilo Âmbar / Dourado) */}
                  <a
                    href={block.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
                    style={{
                      backgroundColor: "rgba(245, 158, 11, 0.12)",
                      color: "#F59E0B",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#F59E0B";
                      e.currentTarget.style.color = "#000000";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.12)";
                      e.currentTarget.style.color = "#F59E0B";
                    }}
                  >
                    <span>Abrir Drive</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal de Criação / Edição */}
      <AnimatePresence>
        {showModal && (
          <DriveDesignBlockModal
            block={editingBlock}
            criadoPor={currentUser.email}
            onClose={() => {
              setShowModal(false);
              setEditingBlock(null);
            }}
            onSave={handleSaveBlock}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
