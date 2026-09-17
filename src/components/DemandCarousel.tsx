"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Inbox, Plus } from "lucide-react";
import { Demanda } from "@/lib/demands";
import { DemandCard } from "@/components/DemandCard";

interface DemandCarouselProps {
  demandas: Demanda[];
  onOpenDetails: (demanda: Demanda) => void;
  onOpenCreateModal?: () => void;
}

export const DemandCarousel: React.FC<DemandCarouselProps> = ({
  demandas,
  onOpenDetails,
  onOpenCreateModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [demandas.length, updateScrollButtons]);

  // Pointer Events para arraste fluido (Desktop Mouse + Android Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignora cliques com botão direito ou botões secundários
    if (e.button !== 0) return;

    const el = containerRef.current;
    if (!el) return;

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.clientX;
    scrollLeftRef.current = el.scrollLeft;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    setIsGrabbing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const deltaX = e.clientX - startXRef.current;

    // Threshold de 6 pixels para diferenciar clique de arrasto
    if (Math.abs(deltaX) > 6) {
      hasMovedRef.current = true;
    }

    if (hasMovedRef.current) {
      containerRef.current.scrollLeft = scrollLeftRef.current - deltaX;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsGrabbing(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    // Reseta hasMoved após um tick para bloquear cliques fantasmas em cards
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 50);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    setIsGrabbing(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    hasMovedRef.current = false;
  };

  // Navegação por clique nos botões laterais (Desktop)
  const scrollStep = (direction: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;
    const offset = direction === "left" ? -320 : 320;
    el.scrollBy({ left: offset, behavior: "smooth" });
  };

  // Wrapper seguro para clique no card que impede disparo acidental após arrasto
  const handleCardClick = (demanda: Demanda) => {
    if (hasMovedRef.current) return;
    onOpenDetails(demanda);
  };

  if (demandas.length === 0) {
    return (
      <div
        className="p-8 rounded-xl text-center space-y-3 border"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
          <Inbox className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Nenhuma demanda atribuída a você no momento
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Novas demandas aparecerão aqui assim que forem atribuídas pelo gestor.
          </p>
        </div>
        {onOpenCreateModal && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#5B50E5] hover:bg-[#483EA8] text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar primeira demanda</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative group/carousel">
      {/* Botão de Navegação Esquerda (Desktop) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollStep("left")}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-md text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 hidden sm:flex cursor-pointer"
          title="Rolar para esquerda"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Container do Carrossel com Pointer Events */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="flex gap-4 overflow-x-auto py-2 px-0.5 no-scrollbar select-none"
        style={{
          cursor: isGrabbing ? "grabbing" : "grab",
          touchAction: "pan-y",
          WebkitOverflowScrolling: "touch",
          scrollBehavior: isGrabbing ? "auto" : "smooth",
        }}
      >
        {demandas.map((demanda) => (
          <div
            key={demanda.id}
            onClick={() => handleCardClick(demanda)}
            className="shrink-0"
          >
            <DemandCard
              demanda={demanda}
              onOpenDetails={() => handleCardClick(demanda)}
              layoutMode="carousel"
            />
          </div>
        ))}
      </div>

      {/* Botão de Navegação Direita (Desktop) */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollStep("right")}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-md text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 hidden sm:flex cursor-pointer"
          title="Rolar para direita"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
