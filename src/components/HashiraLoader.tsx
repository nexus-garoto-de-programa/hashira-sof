"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface HashiraLoaderProps {
  /**
   * Se true, ocupa a viewport inteira com overlay fixo e z-index elevado.
   * Se false, ocupa o container pai (relative).
   * @default true
   */
  fullScreen?: boolean;
  /**
   * Mensagem opcional exibida abaixo da animação (ex: "Carregando demandas...", "Salvando...").
   */
  message?: string;
  /**
   * Classes CSS adicionais para o container externo.
   */
  className?: string;
}

export const HashiraLoader: React.FC<HashiraLoaderProps> = ({
  fullScreen = true,
  message,
  className = "",
}) => {
  const [videoError, setVideoError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detecta se o usuário prefere movimento reduzido
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Força o play programaticamente para contornar restrições de autoplay no Android
  useEffect(() => {
    if (!prefersReducedMotion && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Se o navegador bloquear autoplay mesmo muted, mantém no fallback/poster
      });
    }
  }, [prefersReducedMotion]);

  const containerClasses = fullScreen
    ? "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md select-none transition-all"
    : "relative w-full h-full min-h-[280px] flex flex-col items-center justify-center bg-black/95 rounded-2xl select-none";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message || "Carregando..."}
      className={`${containerClasses} ${className}`}
      style={{ backgroundColor: "#000000" }}
    >
      {/* Container Central da Logo com proporção 16:9 */}
      <div className="relative w-full max-w-[480px] sm:max-w-[580px] md:max-w-[700px] aspect-video flex items-center justify-center overflow-hidden px-4">
        {/* Caso o usuário tenha prefers-reduced-motion ou o vídeo falhe: exibe poster estático com fade */}
        {prefersReducedMotion || videoError ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex items-center justify-center"
          >
            <img
              src="/roxo-poster.jpg"
              alt="Hashira Oficial"
              className="w-full h-full object-contain pointer-events-none"
            />
          </motion.div>
        ) : (
          <video
            ref={videoRef}
            src="/roxo.mp4"
            poster="/roxo-poster.jpg"
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onError={() => setVideoError(true)}
            className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_0_24px_rgba(91,80,229,0.35)]"
          />
        )}
      </div>

      {/* Mensagem Opcional de Status com tipografia Apple HIG */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="mt-2 text-center px-4"
        >
          <span className="inline-block text-xs md:text-sm font-medium tracking-wide text-white/80">
            {message}
          </span>
        </motion.div>
      )}

      {/* Indicador sutil de carregamento em barra fina inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-transparent via-[#5B50E5] to-transparent animate-[shimmer_1.8s_infinite] w-full" />
      </div>
    </div>
  );
};
