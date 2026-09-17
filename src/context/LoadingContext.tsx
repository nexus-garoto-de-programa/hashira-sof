"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HashiraLoader } from "@/components/HashiraLoader";

interface LoadingContextValue {
  isLoading: boolean;
  message?: string;
  showLoader: (message?: string) => string;
  hideLoader: (id?: string) => void;
  withLoading: <T>(fnOrPromise: (() => Promise<T>) | Promise<T>, message?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextValue>({
  isLoading: false,
  showLoader: () => "",
  hideLoader: () => {},
  withLoading: async (fn) => (typeof fn === "function" ? fn() : fn),
});

export const useGlobalLoading = () => useContext(LoadingContext);

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [activeOperations, setActiveOperations] = useState<Map<string, string | undefined>>(new Map());
  const [displayedMessage, setDisplayedMessage] = useState<string | undefined>(undefined);
  const [visible, setVisible] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showTimestampRef = useRef<number>(0);

  const updateVisibility = useCallback((operations: Map<string, string | undefined>) => {
    const hasActive = operations.size > 0;

    if (hasActive) {
      // Pega a mensagem mais recente ou definida
      const msgs = Array.from(operations.values()).filter(Boolean);
      const latestMsg = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
      setDisplayedMessage(latestMsg);

      // Se ainda não estiver visível e não houver timer de debounce agendado
      if (!visible && !debounceTimerRef.current) {
        debounceTimerRef.current = setTimeout(() => {
          setVisible(true);
          showTimestampRef.current = Date.now();
          debounceTimerRef.current = null;
        }, 80); // Debounce curto de 80ms para evitar flickering em requisições instantâneas
      }
    } else {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      const elapsed = Date.now() - showTimestampRef.current;
      const minVisibleDuration = 350; // Garante permanência mínima de 350ms para motion fluido sem corte brusco

      if (visible && elapsed < minVisibleDuration) {
        if (minDisplayTimerRef.current) clearTimeout(minDisplayTimerRef.current);
        minDisplayTimerRef.current = setTimeout(() => {
          setVisible(false);
          setDisplayedMessage(undefined);
          minDisplayTimerRef.current = null;
        }, minVisibleDuration - elapsed);
      } else {
        setVisible(false);
        setDisplayedMessage(undefined);
      }
    }
  }, [visible]);

  const showLoader = useCallback((message?: string) => {
    const id = "load-" + Math.random().toString(36).substring(2, 9);
    setActiveOperations((prev) => {
      const next = new Map(prev);
      next.set(id, message);
      updateVisibility(next);
      return next;
    });
    return id;
  }, [updateVisibility]);

  const hideLoader = useCallback((id?: string) => {
    setActiveOperations((prev) => {
      const next = new Map(prev);
      if (id) {
        next.delete(id);
      } else {
        // Se chamado sem ID, limpa todas as operações ativas
        next.clear();
      }
      updateVisibility(next);
      return next;
    });
  }, [updateVisibility]);

  const withLoading = useCallback(
    async <T,>(fnOrPromise: (() => Promise<T>) | Promise<T>, message?: string): Promise<T> => {
      const id = showLoader(message);
      try {
        if (typeof fnOrPromise === "function") {
          return await fnOrPromise();
        }
        return await fnOrPromise;
      } finally {
        hideLoader(id);
      }
    },
    [showLoader, hideLoader]
  );

  return (
    <LoadingContext.Provider
      value={{
        isLoading: visible,
        message: displayedMessage,
        showLoader,
        hideLoader,
        withLoading,
      }}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999]"
          >
            <HashiraLoader fullScreen message={displayedMessage} />
          </motion.div>
        )}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
};
