"use client";

import React from "react";
import { Tag as TagIcon, Castle, X } from "lucide-react";
import { Tag } from "@/lib/userTags";

interface UserTagBadgeProps {
  tag: Tag;
  size?: "xs" | "sm" | "md";
  showIcon?: boolean;
  onRemove?: () => void;
  className?: string;
}

export const UserTagBadge: React.FC<UserTagBadgeProps> = ({
  tag,
  size = "sm",
  showIcon = true,
  onRemove,
  className = "",
}) => {
  const isTorre = tag.slug.toLowerCase() === "torre" || tag.nome.toLowerCase() === "torre";

  // Dimensões conforme tamanho
  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0.5 gap-1 font-bold",
    sm: "text-[10px] px-2 py-0.5 gap-1.5 font-bold",
    md: "text-xs px-2.5 py-1 gap-1.5 font-extrabold",
  }[size];

  const iconSizeClasses = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
  }[size];

  if (isTorre) {
    return (
      <span
        className={`inline-flex items-center rounded-full uppercase tracking-wider transition-all select-none border ${sizeClasses} ${className}`}
        style={{
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(91, 80, 229, 0.25) 100%)",
          color: "#8B5CF6",
          borderColor: "rgba(139, 92, 246, 0.35)",
          boxShadow: "0 0 8px rgba(139, 92, 246, 0.15)",
        }}
        title={tag.descricao || "Membro da Central dos Torres"}
      >
        {showIcon && <Castle className={`${iconSizeClasses} shrink-0 text-[#8B5CF6]`} />}
        <span className="truncate">{tag.nome}</span>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="hover:bg-purple-500/20 rounded-full p-0.5 transition-colors ml-0.5"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </span>
    );
  }

  // Estilo padrão para tags customizadas
  return (
    <span
      className={`inline-flex items-center rounded-full uppercase tracking-wider transition-all select-none border ${sizeClasses} ${className}`}
      style={{
        backgroundColor: tag.corBg || `${tag.cor}18`,
        color: tag.cor,
        borderColor: `${tag.cor}35`,
      }}
      title={tag.descricao || tag.nome}
    >
      {showIcon && <TagIcon className={`${iconSizeClasses} shrink-0`} style={{ color: tag.cor }} />}
      <span className="truncate">{tag.nome}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-75 rounded-full p-0.5 transition-opacity ml-0.5"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
};
