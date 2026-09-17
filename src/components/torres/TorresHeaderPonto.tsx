"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle2, LogOut as LogOutIcon, Play, Pause, AlertCircle, Calendar, Sparkles } from "lucide-react";
import {
  baterPonto,
  fetchPontosDoDia,
  calcularTempoExpedienteHoje,
  getTodayDateString,
  PontoRegistro,
} from "@/lib/torresData";
import { UserAccount } from "@/lib/authPermissions";
import { useRealtimeSubscription } from "@/lib/realtimeSync";
import { toast } from "sonner";

interface TorresHeaderPontoProps {
  currentUser: UserAccount;
}

export const TorresHeaderPonto: React.FC<TorresHeaderPontoProps> = ({ currentUser }) => {
  const [pontosHoje, setPontosHoje] = useState<PontoRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"entrada" | "saida" | null>(null);
  const [currentTime, setCurrentTime] = useState("");

  // Relógio ao vivo
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const carregarPontos = async () => {
    if (!currentUser.id) return;
    try {
      const res = await fetchPontosDoDia(currentUser.id);
      setPontosHoje(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPontos();
  }, [currentUser.id]);

  useRealtimeSubscription({
    topics: ["ponto"],
    onUpdate: () => carregarPontos(),
  });

  const expediente = calcularTempoExpedienteHoje(pontosHoje);

  const handleBater = async (tipo: "entrada" | "saida") => {
    setSubmitting(tipo);
    try {
      const res = await baterPonto(currentUser.id, tipo);
      if (res) {
        setPontosHoje((prev) => [...prev, res]);
        if (tipo === "entrada") {
          toast.success("Ponto de entrada registrado com sucesso! Bom expediente! 🚀");
        } else {
          toast.success("Ponto de saída registrado com sucesso! Até logo! 👋");
        }
      }
    } catch (e) {
      toast.error("Erro ao registrar ponto. Tente novamente.");
    } finally {
      setSubmitting(null);
    }
  };

  const temEntradaHoje = pontosHoje.some((p) => p.tipo === "entrada");

  return (
    <div
      className="p-6 rounded-[28px] shadow-sm relative overflow-hidden transition-all"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Luz decorativa de fundo */}
      <div
        className={`absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all ${
          expediente.emExpediente ? "bg-emerald-500/15" : "bg-[#5B50E5]/10"
        }`}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Lado Esquerdo: Identificação e Status de Expediente */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-all ${
                expediente.emExpediente
                  ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                  : temEntradaHoje
                  ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                  : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  expediente.emExpediente
                    ? "bg-emerald-500 animate-pulse"
                    : temEntradaHoje
                    ? "bg-amber-500"
                    : "bg-rose-500 animate-ping"
                }`}
              />
              {expediente.emExpediente
                ? "EM EXPEDIENTE"
                : temEntradaHoje
                ? "PAUSADO / SAÍDA REGISTRADA"
                : "ENTRADA NÃO REGISTRADA"}
            </span>

            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg text-zinc-400">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Controle de Ponto Eletrônico
          </h2>

          <p className="text-xs leading-relaxed max-w-xl" style={{ color: "var(--text-secondary)" }}>
            {expediente.emExpediente
              ? "Você está atualmente em atividade. Ao finalizar ou pausar seu turno, registre a saída."
              : temEntradaHoje
              ? "Sua entrada já foi computada hoje. Você pode registrar novo início se retornar à atividade."
              : "Atenção: Para liberar o acesso ao painel de demandas, registre sua entrada do dia."}
          </p>
        </div>

        {/* Centro: Relógio e Tempo Trabalhado */}
        <div className="flex items-center gap-6 p-4 rounded-2xl" style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}>
          <div className="text-center px-2">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
              Hora Atual
            </span>
            <span className="text-2xl font-black tracking-tight block text-[#5B50E5]">
              {currentTime || "--:--:--"}
            </span>
          </div>

          <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />

          <div className="text-center px-2">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
              Trabalhado Hoje
            </span>
            <span className="text-2xl font-black tracking-tight block" style={{ color: "var(--text-primary)" }}>
              {expediente.formatado}
            </span>
          </div>
        </div>

        {/* Lado Direito: Botões de Ponto */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleBater("entrada")}
            disabled={submitting !== null || expediente.emExpediente}
            className={`px-5 py-3 rounded-2xl font-extrabold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              expediente.emExpediente
                ? "bg-zinc-800/40 text-zinc-500 border border-zinc-700/50 cursor-not-allowed opacity-60"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 active:scale-95"
            }`}
          >
            {submitting === "entrada" ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>Bater Entrada</span>
          </button>

          <button
            type="button"
            onClick={() => handleBater("saida")}
            disabled={submitting !== null || !expediente.emExpediente}
            className={`px-5 py-3 rounded-2xl font-extrabold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              !expediente.emExpediente
                ? "bg-zinc-800/40 text-zinc-500 border border-zinc-700/50 cursor-not-allowed opacity-60"
                : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25 active:scale-95"
            }`}
          >
            {submitting === "saida" ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Pause className="w-4 h-4 fill-current" />
            )}
            <span>Bater Saída</span>
          </button>
        </div>
      </div>

      {/* Histórico resumido de hoje */}
      {pontosHoje.length > 0 && (
        <div className="mt-4 pt-4 border-t flex items-center gap-3 flex-wrap text-[11px]" style={{ borderColor: "var(--border)" }}>
          <span className="font-bold uppercase tracking-wider text-zinc-400">Registros de hoje:</span>
          {pontosHoje.map((p, idx) => {
            const timeStr = new Date(p.timestamp).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <span
                key={p.id}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold border ${
                  p.tipo === "entrada"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                }`}
              >
                {p.tipo === "entrada" ? "🟢 Entrada:" : "🔴 Saída:"} {timeStr}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
