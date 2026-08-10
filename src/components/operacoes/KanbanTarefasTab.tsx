"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { OperacoesTarefa, ColumnStatus } from "@/lib/operacoesData";

interface KanbanTarefasTabProps {
  tarefas: OperacoesTarefa[];
}

export const KanbanTarefasTab: React.FC<KanbanTarefasTabProps> = ({ tarefas }) => {
  const columns: { id: ColumnStatus; label: string; dotColor: string }[] = [
    { id: "nao_iniciado", label: "Não iniciado", dotColor: "#8B5CF6" },
    { id: "em_andamento", label: "Em andamento", dotColor: "#3B82F6" },
    { id: "revisao", label: "Revisão", dotColor: "#D97706" },
    { id: "concluido", label: "Concluído", dotColor: "#16A34A" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start overflow-x-auto pb-6 no-scrollbar">
      {columns.map((col) => {
        const colTarefas = tarefas.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className="coursue-card p-5 flex flex-col space-y-4 min-w-[280px] shadow-sm"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.dotColor }} />
                <h3 className="text-xs font-extrabold uppercase tracking-wider font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                  {col.label}
                </h3>
              </div>
              <span className="h-5 px-2.5 rounded-full text-[11px] font-extrabold text-[#5B50E5] flex items-center justify-center" style={{ backgroundColor: 'var(--brand-light)' }}>
                {colTarefas.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 min-h-[400px]">
              {colTarefas.map((task) => (
                <motion.div
                  key={task.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-4 rounded-[16px] transition-all space-y-3 cursor-pointer shadow-sm hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Title */}
                  <h4 className="text-xs font-extrabold uppercase tracking-tight leading-snug font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                    {task.titulo}
                  </h4>

                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Status badge */}
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        task.status === "concluido"
                          ? "bg-emerald-100 text-emerald-700"
                          : task.status === "revisao"
                          ? "bg-amber-100 text-amber-700"
                          : task.status === "em_andamento"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {task.status.replace("_", " ")}
                    </span>

                    {/* Sector tag */}
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md text-[#5B50E5]" style={{ backgroundColor: 'var(--brand-light)' }}>
                      {task.setorNome}
                    </span>

                    {/* Delay warning badge */}
                    {task.atrasoDias && task.status !== "concluido" && (
                      <span className="text-[9px] font-extrabold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {task.atrasoDias} dias de atraso
                      </span>
                    )}
                  </div>

                  {/* Card Footer: Assigned Member Avatar + Date */}
                  <div className="pt-2 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border)' }}>
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm"
                      style={{ backgroundColor: task.membro.avatarBg }}
                      title={task.membro.name}
                    >
                      {task.membro.initials}
                    </div>

                    <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {task.dataEntrega}
                    </span>
                  </div>
                </motion.div>
              ))}

              {colTarefas.length === 0 && (
                <div className="h-32 border border-dashed rounded-[16px] flex items-center justify-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  Nenhuma tarefa nesta coluna
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
