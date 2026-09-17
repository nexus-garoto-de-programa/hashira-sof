"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useGlobalLoading } from "@/context/LoadingContext";

/**
 * Componente que intercepta navegações de rotas internas no Next.js (SPA)
 * e dispara o HashiraLoader global automaticamente, encerrando-o quando a nova
 * rota estiver pronta e o pathname for atualizado.
 */
export function NavigationLoadingTrigger() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showLoader, hideLoader } = useGlobalLoading();
  const currentLoaderIdRef = useRef<string | null>(null);

  // Quando o pathname ou query params mudam, encerra o loader de navegação
  useEffect(() => {
    if (currentLoaderIdRef.current) {
      hideLoader(currentLoaderIdRef.current);
      currentLoaderIdRef.current = null;
    }
  }, [pathname, searchParams, hideLoader]);

  // Intercepta cliques globais em tags <a> com navegação interna
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      // Ignora se for clique modificado (Ctrl, Cmd, Shift, Alt) ou botão direito
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      // Procura o elemento <a> mais próximo
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignora links externos, mailto, tel, âncoras locais ou downloads
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      // Normaliza para comparar com a URL atual
      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Se o destino for exatamente a mesma página e sem parâmetros novos, não exibe
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search
        ) {
          return;
        }

        // Se já houver um loader ativo, encerra o anterior
        if (currentLoaderIdRef.current) {
          hideLoader(currentLoaderIdRef.current);
        }

        // Inicia o loader global para a nova rota
        currentLoaderIdRef.current = showLoader("Carregando página...");
      } catch {
        // Ignora URLs inválidas
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [showLoader, hideLoader]);

  return null;
}
