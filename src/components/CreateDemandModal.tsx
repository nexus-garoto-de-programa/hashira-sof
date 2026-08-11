"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Paperclip, Sparkles, CheckCircle2, User as UserIcon } from "lucide-react";
import { Demanda, Prioridade, HASHIRAS_SEED, Anexo } from "@/lib/demands";
import { getStoredUsers, fetchUsersFromSupabase, UserAccount } from "@/lib/authPermissions";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface CreateDemandModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (novaDemanda: Omit<Demanda, "id" | "criadoEm">) => void;
}

export const CreateDemandModal: React.FC<CreateDemandModalProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [setorId, setSetorId] = useState(HASHIRAS_SEED[0].id);

  // Lista dinâmica de colaboradores registrados
  const [availableUsers, setAvailableUsers] = useState<UserAccount[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  const [prazo, setPrazo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });
  const [prioridade, setPrioridade] = useState<Prioridade>("alta");
  const [anexos, setAnexos] = useState<Anexo[]>([]);

  const [anexoTitulo, setAnexoTitulo] = useState("");
  const [anexoUrl, setAnexoUrl] = useState("");
  const [anexoTipo, setAnexoTipo] = useState<"imagem" | "video" | "link">("link");

  useEffect(() => {
    if (!open) return;

    const reloadUsers = async () => {
      const users = await fetchUsersFromSupabase();
      setAvailableUsers(users);
      if (users.length > 0) {
        setSelectedUser((prev) => (prev && users.some((u) => u.id === prev.id) ? prev : users[0]));
      }
    };

    reloadUsers();

    const channel = supabase
      .channel("create-demand-modal-users")
      .on("postgres_changes", { event: "*", schema: "public", table: "usuarios" }, () => {
        reloadUsers();
      })
      .subscribe();

    window.addEventListener("hashira_users_updated", reloadUsers);
    window.addEventListener("storage", reloadUsers);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("hashira_users_updated", reloadUsers);
      window.removeEventListener("storage", reloadUsers);
    };
  }, [open]);

  if (!open) return null;

  const handleAddAnexo = () => {
    if (!anexoTitulo.trim() || !anexoUrl.trim()) {
      toast.error("Informe o título e a URL do anexo");
      return;
    }
    const novoAnexo: Anexo = {
      id: "att-" + Date.now(),
      tipo: anexoTipo,
      titulo: anexoTitulo.trim(),
      url: anexoUrl.trim(),
    };
    setAnexos([...anexos, novoAnexo]);
    setAnexoTitulo("");
    setAnexoUrl("");
    toast.success("Anexo adicionado");
  };

  const handleRemoveAnexo = (id: string) => {
    setAnexos(anexos.filter((a) => a.id !== id));
  };

  const handleSubmit = (statusInicial: "pendente" | "em_andamento") => {
    if (!titulo.trim()) {
      toast.error("Preencha o título da demanda");
      return;
    }
    if (!descricao.trim()) {
      toast.error("Preencha a descrição detalhada");
      return;
    }

    if (!selectedUser) {
      toast.error("Selecione um colaborador na lista para designar a demanda");
      return;
    }

    const setorObj = HASHIRAS_SEED.find((s) => s.id === setorId) || HASHIRAS_SEED[0];
    const colabNomeFinal = selectedUser.comoQuerSerChamado || selectedUser.nickname || selectedUser.nome;

    onSave({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      setorId: setorObj.id,
      setorNome: setorObj.nome,
      criadoPor: "Administrador Central",
      colaboradorId: selectedUser.id,
      colaboradorNome: colabNomeFinal,
      colaboradorAvatar: selectedUser.avatarUrl,
      prazo,
      prioridade,
      status: statusInicial,
      progresso: 0,
      anexos,
      historico: [
        {
          id: "h-" + Date.now(),
          usuarioNome: "Administrador Central",
          acao: `Demanda criada e atribuída a ${colabNomeFinal}`,
          data: new Date().toISOString().slice(0, 16).replace("T", " "),
        },
      ],
    });

    toast.success(`Nova demanda atribuída a ${colabNomeFinal} cadastrada com sucesso!`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 backdrop-blur-md"
          style={{ backgroundColor: 'var(--modal-overlay)' }}
        />

        {/* Dialog Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden z-10 my-8"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {/* Header */}
          <div className="p-6 flex items-center justify-between" style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#5B50E5] text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                  Criar Nova Demanda
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Selecione o colaborador responsável, departamento e prazo da entrega
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            
            {/* Título */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                Título da Demanda *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Implementar fluxo de checkout rápido com Pix"
                className="coursue-input text-xs"
              />
            </div>

            {/* SELETOR INTERATIVO POR CLIQUE: Designar Colaborador */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold uppercase tracking-wider block flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                <span className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[#5B50E5]" />
                  Clique para Selecionar o Colaborador Responsável *
                </span>
                {selectedUser && (
                  <span className="text-[11px] font-semibold text-[#5B50E5]">
                    Selecionado: <strong>{selectedUser.comoQuerSerChamado || selectedUser.nickname || selectedUser.nome}</strong>
                  </span>
                )}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                {availableUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  const displayName = u.comoQuerSerChamado || u.nickname || u.nome;
                  const userSectors = u.setoresNomes?.join(", ") || u.setorNome;

                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 group"
                      style={{
                        backgroundColor: isSelected ? 'var(--brand-light)' : 'var(--surface-alt)',
                        borderColor: isSelected ? '#5B50E5' : 'var(--border)',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={u.avatarUrl}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                          style={{ border: '2px solid var(--border)' }}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold block truncate" style={{ color: isSelected ? '#5B50E5' : 'var(--text-primary)' }}>
                            {displayName}
                          </span>
                          <span className="text-[10px] block truncate" style={{ color: 'var(--text-secondary)' }}>
                            {u.email} ({userSectors})
                          </span>
                        </div>
                      </div>

                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[#5B50E5] border-[#5B50E5] text-white" : "border-[#9CA3AF]"
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Setor e Prioridade Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                  Departamento Hashira
                </label>
                <select
                  value={setorId}
                  onChange={(e) => setSetorId(e.target.value)}
                  className="coursue-input text-xs cursor-pointer"
                >
                  {HASHIRAS_SEED.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                  Prioridade
                </label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as Prioridade)}
                  className="coursue-input text-xs cursor-pointer"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente 🔥</option>
                </select>
              </div>
            </div>

            {/* Prazo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                Prazo Limite (Entrega)
              </label>
              <input
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className="coursue-input text-xs cursor-pointer"
              />
            </div>

            {/* Descricao */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                Descrição Detalhada *
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                placeholder="Explique o objetivo, especificações técnicas e requisitos da demanda…"
                className="w-full rounded-2xl p-4 text-xs outline-none transition-all"
                style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Anexos Section */}
            <div className="space-y-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Paperclip className="w-4 h-4 text-[#5B50E5]" />
                Anexar Links, Imagens ou Vídeos
              </label>

              {anexos.length > 0 && (
                <div className="space-y-2">
                  {anexos.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl flex items-center justify-between text-xs"
                      style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}
                    >
                      <div>
                        <span className="font-semibold block" style={{ color: 'var(--text-primary)' }}>{a.titulo}</span>
                        <span className="text-[10px] truncate block max-w-md" style={{ color: 'var(--text-muted)' }}>{a.url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAnexo(a.id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 rounded-2xl space-y-3" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={anexoTipo}
                    onChange={(e) => setAnexoTipo(e.target.value as any)}
                    className="coursue-input text-xs"
                  >
                    <option value="link">Link Externo</option>
                    <option value="imagem">Imagem (URL)</option>
                    <option value="video">Vídeo (URL)</option>
                  </select>
                  <input
                    type="text"
                    value={anexoTitulo}
                    onChange={(e) => setAnexoTitulo(e.target.value)}
                    placeholder="Título do anexo"
                    className="coursue-input text-xs"
                  />
                  <input
                    type="url"
                    value={anexoUrl}
                    onChange={(e) => setAnexoUrl(e.target.value)}
                    placeholder="https://..."
                    className="coursue-input text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAnexo}
                  className="coursue-btn-secondary w-full text-xs py-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Anexo
                </button>
              </div>
            </div>
          </div>

          {/* Footer CTAs */}
          <div className="p-4 flex items-center justify-end gap-3" style={{ backgroundColor: 'var(--surface-alt)', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => handleSubmit("pendente")}
              className="coursue-btn-secondary px-5 py-2.5 text-xs"
            >
              Salvar como Rascunho
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("em_andamento")}
              className="coursue-btn-primary px-6 py-2.5 text-xs"
            >
              Publicar Demanda →
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
