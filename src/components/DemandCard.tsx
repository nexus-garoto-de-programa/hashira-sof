"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, ArrowRight, Paperclip } from "lucide-react";
import { Demanda, HASHIRAS_SEED } from "@/lib/demands";

interface DemandCardProps {
  demanda: Demanda;
  onOpenDetails: (demanda: Demanda) => void;
  layoutMode?: "carousel" | "list";
}

export const DemandCard: React.FC<DemandCardProps> = ({
  demanda,
  onOpenDetails,
  layoutMode = "carousel",
}) => {
  const setor = HASHIRAS_SEED.find((s) => s.id === demanda.setorId) || {
    badgeBg: "#EDE7F6",
    badgeText: "#5E35B1",
    nome: demanda.setorNome,
  };

  const statusBadge = {
    pendente: { bg: "#FEF3C7", text: "#D97706", label: "Pendente" },
    em_andamento: { bg: "#E0F2FE", text: "#0369A1", label: "Em andamento" },
    concluida: { bg: "#DCFCE7", text: "#15803D", label: "Concluída" },
    atrasada: { bg: "#FEE2E2", text: "#DC2626", label: "Atrasada" },
  }[demanda.status];

  const formattedDate = new Date(demanda.prazo + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`coursue-card flex flex-col justify-between p-5 rounded-[20px] shadow-sm hover:shadow-md transition-all ${
        layoutMode === "carousel" ? "w-[300px] shrink-0" : "w-full"
      }`}
    >
      <div>
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg"
            style={{ background: setor.badgeBg, color: setor.badgeText }}
          >
            {demanda.setorNome}
          </span>
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase"
            style={{ background: statusBadge.bg, color: statusBadge.text }}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-[15px] line-clamp-2 mb-2 leading-snug font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
          {demanda.titulo}
        </h3>

        {/* Description */}
        <p className="text-xs line-clamp-2 mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {demanda.descricao}
        </p>
      </div>

      <div>
        {/* Progress Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
            <span>Progresso</span>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{demanda.progresso}%</span>
          </div>
          <div className="progress-bar-track h-1.5 rounded-full overflow-hidden">
            <motion.div
              className="progress-bar-fill h-full rounded-full"
              style={{
                background:
                  demanda.status === "concluida"
                    ? "linear-gradient(90deg, #16A34A, #22C55E)"
                    : "linear-gradient(90deg, #5B50E5, #8B7CF8)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${demanda.progresso}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Meta Info Footer */}
        <div className="pt-3 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
              <Clock className="w-3.5 h-3.5 text-[#5B50E5]" />
              {formattedDate}
            </span>
            {demanda.anexos.length > 0 && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <Paperclip className="w-3 h-3" />
                {demanda.anexos.length}
              </span>
            )}
          </div>

          <button
            onClick={() => onOpenDetails(demanda)}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#5B50E5] hover:text-[#483EA8] hover:underline"
          >
            <span>Ver detalhes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
