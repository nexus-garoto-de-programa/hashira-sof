"use client";

import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Clock, Tag, Flame, AlertCircle, GripVertical, CheckCircle2 } from "lucide-react";
import { OperacoesTarefa, OperacoesProjeto, ColumnStatus, DEFAULT_KANBAN_COLUMNS } from "@/lib/operacoesData";

interface KanbanTarefasTabProps {
  tarefas: OperacoesTarefa[];
  projetos?: OperacoesProjeto[];
  onMoveTarefa?: (tarefaId: string, novoStatus: ColumnStatus, sourceIndex: number, destinationIndex: number) => Promise<any> | void;
}

export const KanbanTarefasTab: React.FC<KanbanTarefasTabProps> = ({
  tarefas,
  projetos = [],
  onMoveTarefa,
}) => {
  // Evita erros de hidratação SSR no Next.js aguardando o primeiro render no cliente
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const columns = DEFAULT_KANBAN_COLUMNS;

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se soltou fora de uma área válida ou no mesmo local
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const novoStatus = destination.droppableId as ColumnStatus;
    if (onMoveTarefa) {
      await onMoveTarefa(draggableId, novoStatus, source.index, destination.index);
    }
  };

  // Helper para buscar a cor e dados do projeto vinculado à tarefa
  const getProjetoBadge = (projId?: string) => {
    if (!projId) return null;
    const p = projetos.find((proj) => proj.id === projId);
    if (!p) return null;
    return {
      nome: p.nome,
      cor: p.cor || "#8B5CF6",
    };
  };

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start pb-6">
        {columns.map((col) => (
          <div key={col.id} className="coursue-card p-5 space-y-4 min-w-[260px] animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/2" />
            <div className="h-32 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start overflow-x-auto pb-8 no-scrollbar">
        {columns.map((col) => {
          // Filtra tarefas da coluna e ordena pela posição definida
          const colTarefas = tarefas
            .filter((t) => t.status === col.id)
            .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

          return (
            <div
              key={col.id}
              className="coursue-card p-5 flex flex-col space-y-4 min-w-[280px] shadow-sm rounded-[24px]"
              style={{ backgroundColor: "var(--surface)" }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: col.dotColor }} />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                    {col.label}
                  </h3>
                </div>
                <span
                  className="h-5 px-2.5 rounded-full text-[11px] font-extrabold text-[#5B50E5] flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: "var(--brand-light)" }}
                >
                  {colTarefas.length}
                </span>
              </div>

              {/* Droppable Column Area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[420px] rounded-2xl p-1.5 transition-colors ${
                      snapshot.isDraggingOver ? "bg-[#5B50E5]/5 ring-2 ring-[#5B50E5]/30" : ""
                    }`}
                  >
                    {colTarefas.map((task, index) => {
                      const projBadge = getProjetoBadge(task.projetoId);

                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(providedDrag, snapshotDrag) => (
                            <div
                              ref={providedDrag.innerRef}
                              {...providedDrag.draggableProps}
                              className={`p-4 rounded-[18px] transition-all space-y-3 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing border ${
                                snapshotDrag.isDragging
                                  ? "shadow-2xl ring-2 ring-[#5B50E5] scale-105 opacity-95 z-50"
                                  : ""
                              }`}
                              style={{
                                backgroundColor: snapshotDrag.isDragging ? "var(--surface-raised)" : "var(--surface-alt)",
                                borderColor: snapshotDrag.isDragging ? "#5B50E5" : "var(--border)",
                                ...providedDrag.draggableProps.style,
                              }}
                            >
                              {/* Top row: Handle + Tag do Projeto */}
                              <div className="flex items-center justify-between gap-2">
                                {projBadge ? (
                                  <span
                                    className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 truncate max-w-[190px]"
                                    style={{
                                      backgroundColor: projBadge.cor + "18",
                                      color: projBadge.cor,
                                      border: `1px solid ${projBadge.cor}35`,
                                    }}
                                  >
                                    <Tag className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate">{projBadge.nome}</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md text-[#5B50E5]" style={{ backgroundColor: "var(--brand-light)" }}>
                                    {task.setorNome}
                                  </span>
                                )}

                                <div {...providedDrag.dragHandleProps} className="text-gray-400 hover:text-gray-600 p-1" title="Arrastar">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                              </div>

                              {/* Title */}
                              <h4 className="text-xs font-extrabold uppercase tracking-tight leading-snug font-['Plus_Jakarta_Sans']" style={{ color: "var(--text-primary)" }}>
                                {task.titulo}
                              </h4>

                              {/* Descrição se houver */}
                              {task.descricao && (
                                <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                  {task.descricao}
                                </p>
                              )}

                              {/* Badges Row */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {/* Prioridade */}
                                {task.prioridade && (
                                  <span
                                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                      task.prioridade === "urgente"
                                        ? "bg-rose-100 text-rose-700"
                                        : task.prioridade === "alta"
                                        ? "bg-amber-100 text-amber-800"
                                        : task.prioridade === "media"
                                        ? "bg-sky-100 text-sky-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {task.prioridade === "urgente" && <Flame className="w-2.5 h-2.5" />}
                                    {task.prioridade}
                                  </span>
                                )}

                                {/* Sector tag (se tiver projeto badge no topo) */}
                                {projBadge && (
                                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md text-gray-600" style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border)" }}>
                                    {task.setorNome}
                                  </span>
                                )}

                                {/* Delay warning */}
                                {task.atrasoDias && task.status !== "concluido" ? (
                                  <span className="text-[9px] font-extrabold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {task.atrasoDias}d atraso
                                  </span>
                                ) : null}
                              </div>

                              {/* Card Footer: Responsável + Prazo */}
                              <div className="pt-2.5 flex items-center justify-between text-xs" style={{ borderTop: "1px solid var(--border)" }}>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div
                                    className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-xs shrink-0"
                                    style={{ backgroundColor: task.membro?.avatarBg || "#5B50E5" }}
                                    title={task.membro?.name}
                                  >
                                    {task.membro?.initials || "US"}
                                  </div>
                                  <span className="text-[11px] font-semibold truncate max-w-[100px]" style={{ color: "var(--text-secondary)" }}>
                                    {task.membro?.name}
                                  </span>
                                </div>

                                <span className="text-[10px] font-semibold flex items-center gap-1 shrink-0" style={{ color: "var(--text-muted)" }}>
                                  <Clock className="w-3 h-3 text-[#5B50E5]" />
                                  {task.dataEntrega}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}

                    {provided.placeholder}

                    {colTarefas.length === 0 && (
                      <div
                        className="h-32 border border-dashed rounded-[18px] flex flex-col items-center justify-center text-xs p-4 text-center transition-colors"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                      >
                        <span className="text-[11px]">Nenhuma tarefa nesta coluna</span>
                        <span className="text-[10px] opacity-75 mt-0.5">Arraste cards para cá</span>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
