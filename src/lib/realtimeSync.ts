"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type RealtimeTopic =
  | "tarefas"
  | "demandas"
  | "usuarios"
  | "setores"
  | "projetos"
  | "branding"
  | "influenciadores"
  | "drive-design"
  | "drive_design_blocks"
  | "agenda"
  | "checklist"
  | "ponto"
  | "discord_status"
  | "all";

// 1. Cross-Tab Broadcast Channel (instantâneo entre abas do mesmo navegador)
let broadcastChannel: BroadcastChannel | null = null;

export function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel("hashira_realtime_channel_v1");
    } catch (e) {
      console.warn("[REALTIME] BroadcastChannel não suportado neste ambiente");
    }
  }
  return broadcastChannel;
}

// 2. Disparador de Notificação em Tempo Real (Local + Cross-Tab)
export function notifyRealtimeChange(topic: RealtimeTopic, data?: any) {
  if (typeof window === "undefined") return;

  // Disparo de CustomEvent local para a janela ativa
  window.dispatchEvent(
    new CustomEvent("hashira_realtime_event", {
      detail: { topic, data, timestamp: Date.now() },
    })
  );

  // Disparo para outras abas abertas
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({ topic, data, timestamp: Date.now() });
    } catch (e) {}
  }
}

// 3. React Hook para Auto-Sincronização em Tempo Real em qualquer página
export function useRealtimeSubscription({
  topics,
  onUpdate,
  pollIntervalMs = 10000,
}: {
  topics: RealtimeTopic[];
  onUpdate: () => void | Promise<void>;
  pollIntervalMs?: number;
}) {
  useEffect(() => {
    let isSubscribed = true;

    const handleTrigger = () => {
      if (!isSubscribed) return;
      onUpdate();
    };

    // 1. Escuta eventos locais
    const handleLocalEvent = (e: Event) => {
      const custom = e as CustomEvent;
      const eventTopic = custom.detail?.topic as RealtimeTopic;
      if (topics.includes("all") || topics.includes(eventTopic)) {
        handleTrigger();
      }
    };

    window.addEventListener("hashira_realtime_event", handleLocalEvent);
    window.addEventListener("hashira_demandas_updated", handleTrigger);
    window.addEventListener("hashira_operacoes_tarefas_updated", handleTrigger);
    window.addEventListener("hashira_users_updated", handleTrigger);
    window.addEventListener("hashira_branding_updated", handleTrigger);
    window.addEventListener("hashira_influenciadores_updated", handleTrigger);
    window.addEventListener("hashira_drive_design_updated", handleTrigger);
    window.addEventListener("hashira_ponto_updated", handleTrigger);
    window.addEventListener("hashira_agenda_updated", handleTrigger);
    window.addEventListener("hashira_checklist_updated", handleTrigger);
    window.addEventListener("hashira_discord_updated", handleTrigger);

    // 2. Escuta eventos cross-tab (outras abas)
    const channel = getBroadcastChannel();
    if (channel) {
      channel.onmessage = (msgEvent) => {
        const msgTopic = msgEvent.data?.topic as RealtimeTopic;
        if (topics.includes("all") || topics.includes(msgTopic)) {
          handleTrigger();
        }
      };
    }

    // 3. Inscrição WebSocket no Supabase Realtime
    const supabaseChannel = supabase
      .channel(`realtime-sync-${topics.join("-")}-${Math.random().toString(36).slice(2, 7)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "operacoes_tarefas" }, () => {
        if (topics.includes("all") || topics.includes("tarefas") || topics.includes("demandas")) {
          handleTrigger();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "demandas" }, () => {
        if (topics.includes("all") || topics.includes("demandas") || topics.includes("tarefas")) {
          handleTrigger();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "usuarios" }, () => {
        if (topics.includes("all") || topics.includes("usuarios")) {
          handleTrigger();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "operacoes_projetos" }, () => {
        if (topics.includes("all") || topics.includes("projetos")) {
          handleTrigger();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "operacoes_setores" }, () => {
        if (topics.includes("all") || topics.includes("setores")) {
          handleTrigger();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "influenciadores" }, () => {
        if (topics.includes("all") || topics.includes("influenciadores")) {
          handleTrigger();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "drive_design_blocks" }, () => {
        if (topics.includes("all") || topics.includes("drive-design") || topics.includes("drive_design_blocks")) {
          handleTrigger();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pontos" }, () => {
        if (topics.includes("all") || topics.includes("ponto")) {
          handleTrigger();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "agenda_eventos" }, () => {
        if (topics.includes("all") || topics.includes("agenda")) {
          handleTrigger();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "checklist_itens" }, () => {
        if (topics.includes("all") || topics.includes("checklist")) {
          handleTrigger();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "checklist_templates" }, () => {
        if (topics.includes("all") || topics.includes("checklist")) {
          handleTrigger();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "discord_status" }, () => {
        if (topics.includes("all") || topics.includes("discord_status")) {
          handleTrigger();
        }
      })
      .subscribe();

    // 4. Auto-sincronização preventiva ao focar a janela ou aba
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        handleTrigger();
      }
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleFocus);

    // 5. Polling silencioso de fundo a cada X segundos (garante consistência mesmo com quedas de rede)
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        handleTrigger();
      }
    }, pollIntervalMs);

    return () => {
      isSubscribed = false;
      window.removeEventListener("hashira_realtime_event", handleLocalEvent);
      window.removeEventListener("hashira_demandas_updated", handleTrigger);
      window.removeEventListener("hashira_operacoes_tarefas_updated", handleTrigger);
      window.removeEventListener("hashira_users_updated", handleTrigger);
      window.removeEventListener("hashira_branding_updated", handleTrigger);
      window.removeEventListener("hashira_influenciadores_updated", handleTrigger);
      window.removeEventListener("hashira_drive_design_updated", handleTrigger);
      window.removeEventListener("hashira_ponto_updated", handleTrigger);
      window.removeEventListener("hashira_agenda_updated", handleTrigger);
      window.removeEventListener("hashira_checklist_updated", handleTrigger);
      window.removeEventListener("hashira_discord_updated", handleTrigger);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleFocus);
      clearInterval(interval);
      supabase.removeChannel(supabaseChannel);
    };
  }, [topics, onUpdate, pollIntervalMs]);
}
