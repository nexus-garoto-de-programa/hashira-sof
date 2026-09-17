"use client";

import React from "react";
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
    badgeBg: "rgba(91, 80, 229, 0.1)",
    badgeText: "#5B50E5",
    nome: demanda.setorNome,
  };

  const statusBadge = {
    pendente: {
      bg: "bg-amber-500/10 dark:bg-amber-500/15",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-500/20",
      label: "Pendente",
    },
    em_andamento: {
      bg: "bg-blue-500/10 dark:bg-blue-500/15",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-500/20",
      label: "Em andamento",
    },
    concluida: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-500/20",
      label: "Concluída",
    },
    atrasada: {
      bg: "bg-rose-500/10 dark:bg-rose-500/15",
      text: "text-rose-700 dark:text-rose-400",
      border: "border-rose-500/20",
      label: "Atrasada",
    },
  }[demanda.status] || {
    bg: "bg-zinc-500/10",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-500/20",
    label: demanda.status,
  };

  const formattedDate = new Date(demanda.prazo + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div
      onClick={() => onOpenDetails(demanda)}
      className={`coursue-card flex flex-col justify-between p-4 rounded-xl transition-all cursor-pointer group ${
        layoutMode === "carousel" ? "w-[290px] shrink-0" : "w-full"
      }`}
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md truncate max-w-[150px]"
            style={{ backgroundColor: setor.badgeBg, color: setor.badgeText }}
          >
            {demanda.setorNome}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* Título de 14px com contraste alto */}
        <h3
          className="font-semibold text-sm line-clamp-2 mb-1.5 leading-snug group-hover:text-[#5B50E5] transition-colors"
          style={{ color: "var(--text-primary)" }}
        >
          {demanda.titulo}
        </h3>

        {/* Descrição legível */}
        {demanda.descricao && (
          <p
            className="text-xs line-clamp-2 mb-3 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {demanda.descricao}
          </p>
        )}
      </div>

      <div className="mt-2 space-y-3">
        {/* Barra de Progresso Semântica */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
            <span>Progresso</span>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {demanda.progresso}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                demanda.status === "concluida" ? "bg-emerald-500" : "bg-[#5B50E5]"
              }`}
              style={{ width: `${demanda.progresso}%` }}
            />
          </div>
        </div>

        {/* Rodapé de Metadados e Ação */}
        <div
          className="pt-2.5 flex items-center justify-between text-[11px]"
          style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 font-medium" style={{ color: "var(--text-primary)" }}>
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              {formattedDate}
            </span>
            {demanda.anexos.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                <Paperclip className="w-3 h-3" />
                {demanda.anexos.length}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B50E5] group-hover:translate-x-0.5 transition-transform">
            <span>Ver detalhes</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
