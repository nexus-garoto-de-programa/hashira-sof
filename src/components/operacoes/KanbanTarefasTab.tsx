"use client";

import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Clock, Tag, Flame, AlertCircle, GripVertical, CheckCircle2 } from "lucide-react";
import { OperacoesTarefa, OperacoesProjeto, ColumnStatus, DEFAULT_KANBAN_COLUMNS } from "@/lib/operacoesData";
import { useGlobalLoading } from "@/context/LoadingContext";

interface KanbanTarefasTabProps {
  tarefas: OperacoesTarefa[];
  projetos?: OperacoesProjeto[];
  onMoveTarefa?: (
    tarefaId: string,
    destStatus: ColumnStatus,
    sourceStatus: ColumnStatus,
    sourceIndex: number,
    destinationIndex: number
  ) => Promise<any> | void;
}

export const KanbanTarefasTab: React.FC<KanbanTarefasTabProps> = ({
  tarefas,
  projetos = [],
  onMoveTarefa,
}) => {
  const { withLoading } = useGlobalLoading();
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

    const destStatus = destination.droppableId as ColumnStatus;
    const sourceStatus = source.droppableId as ColumnStatus;

    if (onMoveTarefa) {
      await withLoading(async () => {
        await onMoveTarefa(draggableId, destStatus, sourceStatus, source.index, destination.index);
      }, "Atualizando status no quadro...");
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
              className="coursue-card p-4 flex flex-col space-y-3 min-w-[280px] rounded-xl transition-all"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shadow-xs" style={{ backgroundColor: col.dotColor }} />
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                    {col.label}
                  </h3>
                </div>
                <span
                  className="h-5 min-w-[20px] px-1.5 rounded-md text-[11px] font-bold text-[#5B50E5] flex items-center justify-center border"
                  style={{
                    backgroundColor: "var(--brand-light)",
                    borderColor: "var(--border)",
                  }}
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
                    className="space-y-2.5 min-h-[420px] p-1.5 transition-colors rounded-lg"
                    style={{
                      backgroundColor: snapshot.isDraggingOver ? "rgba(91, 80, 229, 0.04)" : "transparent",
                      border: snapshot.isDraggingOver ? "1.5px dashed rgba(91, 80, 229, 0.4)" : "1px dashed transparent",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    {colTarefas.map((task, index) => {
                      const projBadge = getProjetoBadge(task.projetoId);

                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(providedDrag, snapshotDrag) => (
                            <div
                              ref={providedDrag.innerRef}
                              {...providedDrag.draggableProps}
                              {...providedDrag.dragHandleProps}
                              className={`p-3.5 space-y-2.5 transition-shadow select-none ${
                                snapshotDrag.isDragging ? "cursor-grabbing" : "cursor-grab"
                              }`}
                              style={{
                                backgroundColor: snapshotDrag.isDragging ? "var(--surface-raised)" : "var(--surface-alt)",
                                border: snapshotDrag.isDragging ? "1.5px solid #5B50E5" : "1px solid var(--border)",
                                borderRadius: "var(--radius-md)",
                                boxShadow: snapshotDrag.isDragging ? "var(--shadow-drag)" : "var(--shadow-xs)",
                                transform: snapshotDrag.isDragging
                                  ? `${providedDrag.draggableProps.style?.transform || ""} scale(1.02)`
                                  : providedDrag.draggableProps.style?.transform,
                                zIndex: snapshotDrag.isDragging ? 9999 : "auto",
                                ...providedDrag.draggableProps.style,
                              }}
                            >
                              {/* Top row: Tag do Projeto + Handle visual sutil */}
                              <div className="flex items-center justify-between gap-2">
                                {projBadge ? (
                                  <span
                                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 truncate max-w-[190px]"
                                    style={{
                                      backgroundColor: projBadge.cor + "15",
                                      color: projBadge.cor,
                                      border: `1px solid ${projBadge.cor}30`,
                                    }}
                                  >
                                    <Tag className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate">{projBadge.nome}</span>
                                  </span>
                                ) : (
                                  <span
                                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-[#5B50E5]"
                                    style={{ backgroundColor: "var(--brand-light)" }}
                                  >
                                    {task.setorNome}
                                  </span>
                                )}

                                <div className="text-gray-400 hover:text-gray-600 p-0.5" title="Arrastar">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                              </div>

                              {/* Title */}
                              <h4 className="text-xs font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
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
                                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                      task.prioridade === "urgente"
                                        ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                        : task.prioridade === "alta"
                                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                        : task.prioridade === "media"
                                        ? "bg-sky-500/10 text-sky-600 border border-sky-500/20"
                                        : "bg-gray-500/10 text-gray-600 border border-gray-500/20"
                                    }`}
                                  >
                                    {task.prioridade === "urgente" && <Flame className="w-2.5 h-2.5" />}
                                    {task.prioridade}
                                  </span>
                                )}

                                {/* Sector tag (se tiver projeto badge no topo) */}
                                {projBadge && (
                                  <span
                                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-gray-500"
                                    style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border)" }}
                                  >
                                    {task.setorNome}
                                  </span>
                                )}

                                {/* Delay warning */}
                                {task.atrasoDias && task.status !== "concluido" ? (
                                  <span className="text-[9px] font-bold text-rose-600 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {task.atrasoDias}d atraso
                                  </span>
                                ) : null}
                              </div>

                              {/* Card Footer: Responsável com Foto + Prazo */}
                              <div className="pt-2 flex items-center justify-between text-xs" style={{ borderTop: "1px solid var(--border)" }}>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {task.membro?.avatarUrl ? (
                                    <img
                                      src={task.membro.avatarUrl}
                                      alt={task.membro.name}
                                      className="h-5 w-5 rounded-full object-cover shrink-0 ring-1 ring-white/20"
                                    />
                                  ) : (
                                    <div
                                      className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                      style={{ backgroundColor: task.membro?.avatarBg || "#5B50E5" }}
                                      title={task.membro?.name}
                                    >
                                      {task.membro?.initials || "US"}
                                    </div>
                                  )}
                                  <span className="text-[11px] font-medium truncate max-w-[90px]" style={{ color: "var(--text-secondary)" }}>
                                    {task.membro?.name}
                                  </span>
                                </div>

                                <span className="text-[10px] font-medium flex items-center gap-1 shrink-0" style={{ color: "var(--text-muted)" }}>
                                  <Clock className="w-3 h-3 text-[#5B50E5]" />
                                  <span>
                                    {task.dataEntrega}
                                    {task.horarioEntrega ? ` ${task.horarioEntrega}` : ""}
                                  </span>
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
                        className="h-28 border border-dashed flex flex-col items-center justify-center text-xs p-3 text-center"
                        style={{
                          borderColor: "var(--border)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-muted)",
                        }}
                      >
                        <span className="text-[11px] font-medium">Nenhuma tarefa nesta coluna</span>
                        <span className="text-[10px] opacity-70 mt-0.5">Arraste cards para cá</span>
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

