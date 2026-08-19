"use client";

import { useState, useEffect } from "react";

export interface AppBranding {
  logoUrl: string;
  faviconUrl: string;
  loginBgUrl: string;
  nomeMarca: string;
  slogan: string;
}

export const DEFAULT_BRANDING: AppBranding = {
  logoUrl: "/hashira-logo-vertical.png",
  faviconUrl: "/favicon.ico",
  loginBgUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80",
  nomeMarca: "Gestão Cascata",
  slogan: "Central Hashira",
};

const STORAGE_KEY_BRANDING = "hashira_custom_branding_v1";

export function getStoredBranding(): AppBranding {
  if (typeof window === "undefined") return DEFAULT_BRANDING;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BRANDING);
    if (!raw) return DEFAULT_BRANDING;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_BRANDING,
      ...parsed,
    };
  } catch (e) {
    return DEFAULT_BRANDING;
  }
}

export function applyFaviconToDocument(faviconUrl: string) {
  if (typeof document === "undefined" || !faviconUrl) return;
  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    link.href = faviconUrl;
  } catch (e) {
    console.warn("[BRANDING WARN] Falha ao aplicar favicon dinamicamente:", e);
  }
}

export function saveStoredBranding(branding: Partial<AppBranding>) {
  if (typeof window === "undefined") return;
  const current = getStoredBranding();
  const updated: AppBranding = {
    ...current,
    ...branding,
  };

  try {
    localStorage.setItem(STORAGE_KEY_BRANDING, JSON.stringify(updated));
    if (updated.faviconUrl) {
      applyFaviconToDocument(updated.faviconUrl);
    }
    window.dispatchEvent(new Event("hashira_branding_updated"));
  } catch (e) {
    console.error("[BRANDING ERROR] Falha ao salvar configurações de marca:", e);
  }
}

export function resetBrandingToDefault() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_BRANDING);
    applyFaviconToDocument(DEFAULT_BRANDING.faviconUrl);
    window.dispatchEvent(new Event("hashira_branding_updated"));
  } catch (e) {}
}

export function useBranding(): AppBranding {
  const [branding, setBranding] = useState<AppBranding>(getStoredBranding);

  useEffect(() => {
    const update = () => {
      const current = getStoredBranding();
      setBranding(current);
      if (current.faviconUrl) {
        applyFaviconToDocument(current.faviconUrl);
      }
    };

    update();
    window.addEventListener("hashira_branding_updated", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("hashira_branding_updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return branding;
}
