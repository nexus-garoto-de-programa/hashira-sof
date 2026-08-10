"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  User,
  Paperclip,
  ExternalLink,
  MessageSquare,
  Send,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { Demanda, StatusDemanda, HASHIRAS_SEED } from "@/lib/demands";
import { toast } from "sonner";

interface DemandDetailModalProps {
  demanda: Demanda | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus?: (demandaId: string, newStatus: StatusDemanda, comentario?: string) => void;
}

export const DemandDetailModal: React.FC<DemandDetailModalProps> = ({
  demanda,
  open,
  onClose,
  onUpdateStatus,
}) => {
  if (!open || !demanda) return null;

  const [currentStatus, setCurrentStatus] = useState<StatusDemanda>(demanda.status);
  const [newComment, setNewComment] = useState("");

  const setor = HASHIRAS_SEED.find((s) => s.id === demanda.setorId) || {
    badgeBg: "#EDE7F6",
    badgeText: "#5E35B1",
    nome: demanda.setorNome,
  };

  const handleStatusChange = (status: StatusDemanda) => {
    setCurrentStatus(status);
    if (onUpdateStatus) {
      onUpdateStatus(demanda.id, status, newComment.trim() || undefined);
    }
    toast.success(`Status da demanda alterado para ${status.replace("_", " ")}`);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (onUpdateStatus) {
      onUpdateStatus(demanda.id, currentStatus, newComment.trim());
    }
    toast.success("Comentário adicionado ao histórico");
    setNewComment("");
  };

  const formattedDate = new Date(demanda.prazo + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

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

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-3xl rounded-[28px] shadow-2xl overflow-hidden z-10 my-8"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {/* Header */}
          <div className="p-6 md:p-8 flex items-start justify-between gap-4" style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg"
                  style={{ background: setor.badgeBg, color: setor.badgeText }}
                >
                  {demanda.setorNome}
                </span>
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--brand-light)', color: '#5B50E5' }}>
                  Prioridade: {demanda.prioridade}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold font-['Plus_Jakarta_Sans'] leading-tight" style={{ color: 'var(--text-primary)' }}>
                {demanda.titulo}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-colors shrink-0"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Status Change Toolbar */}
            <div className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
              <div>
                <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Status Atual da Demanda
                </span>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#5B50E5] animate-ping" />
                  <span className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                    {currentStatus.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {(["pendente", "em_andamento", "concluida"] as StatusDemanda[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={{
                      backgroundColor: currentStatus === st ? '#1E1B4B' : 'var(--surface)',
                      color: currentStatus === st ? '#FFFFFF' : 'var(--text-secondary)',
                      border: currentStatus === st ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    {st === "pendente" && "Pendente"}
                    {st === "em_andamento" && "Em andamento"}
                    {st === "concluida" && "Concluída ✓"}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Descrição da Demanda
              </h4>
              <p className="text-sm leading-relaxed p-4 rounded-2xl" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                {demanda.descricao}
              </p>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl flex items-center gap-3" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--brand-light)', color: '#5B50E5' }}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase block" style={{ color: 'var(--text-muted)' }}>
                    Prazo Limite
                  </span>
                  <span className="text-xs font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
                    {formattedDate}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl flex items-center gap-3" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                <div className="p-2.5 rounded-xl bg-[#E0F7FA] text-[#00838F]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase block" style={{ color: 'var(--text-muted)' }}>
                    Responsável Designado
                  </span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {demanda.colaboradorNome || "Departamento Hashira"}
                  </span>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            {demanda.anexos.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Paperclip className="w-4 h-4 text-[#5B50E5]" />
                  Anexos e Mídias ({demanda.anexos.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {demanda.anexos.map((anexo) => (
                    <div
                      key={anexo.id}
                      className="p-3.5 rounded-2xl transition-all flex items-center justify-between gap-3 group"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--surface-raised)', color: '#5B50E5' }}>
                          {anexo.tipo === "imagem" && <ImageIcon className="w-4 h-4" />}
                          {anexo.tipo === "video" && <Video className="w-4 h-4" />}
                          {anexo.tipo === "link" && <ExternalLink className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block truncate" style={{ color: 'var(--text-primary)' }}>
                            {anexo.titulo}
                          </span>
                          <span className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>
                            {anexo.tipo}
                          </span>
                        </div>
                      </div>
                      <a
                        href={anexo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: 'var(--brand-light)', color: '#5B50E5' }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline / History */}
            <div className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <MessageSquare className="w-4 h-4 text-[#5B50E5]" />
                Histórico de Observações
              </h4>

              <div className="space-y-3 pl-2">
                {demanda.historico.map((item) => (
                  <div key={item.id} className="relative pl-6 pb-3 last:pb-0" style={{ borderLeft: '2px solid var(--brand-light)' }}>
                    <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-[#5B50E5]" />
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{item.usuarioNome}</span>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.data}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.acao}</p>
                    {item.comentario && (
                      <p className="mt-1 text-xs italic p-2.5 rounded-xl" style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                        &quot;{item.comentario}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="pt-3 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escrever observação ou atualizar equipe…"
                  className="coursue-input flex-1 text-xs"
                />
                <button
                  type="submit"
                  className="coursue-btn-primary px-5 py-2 text-xs rounded-full"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 flex justify-end" style={{ backgroundColor: 'var(--surface-alt)', borderTop: '1px solid var(--border)' }}>
            <button onClick={onClose} className="coursue-btn-primary px-6 py-2.5 text-xs">
              Concluir e Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
