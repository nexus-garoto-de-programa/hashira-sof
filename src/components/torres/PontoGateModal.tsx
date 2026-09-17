"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ShieldAlert, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import {
  baterPonto,
  fetchPontosDoDia,
  verificarEntradaHoje,
  getTodayDateString,
  PontoRegistro,
} from "@/lib/torresData";
import { UserAccount, getAdminSimulatedRole } from "@/lib/authPermissions";
import { useRealtimeSubscription } from "@/lib/realtimeSync";
import { toast } from "sonner";

interface PontoGateModalProps {
  currentUser: UserAccount | null;
}

export const PontoGateModal: React.FC<PontoGateModalProps> = ({ currentUser }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [pontosHoje, setPontosHoje] = useState<PontoRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

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
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carrega pontos de hoje
  const carregarPontos = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetchPontosDoDia(currentUser.id);
      setPontosHoje(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPontos();
  }, [currentUser?.id]);

  // Inscrição em realtime para atualização imediata
  useRealtimeSubscription({
    topics: ["ponto"],
    onUpdate: () => {
      carregarPontos();
    },
  });

  if (!currentUser || loading) return null;

  const isAdmin =
    currentUser.email === "mhvzbusiness@gmail.com" ||
    currentUser.papel === "administrador";
  const simulatedRole = getAdminSimulatedRole();
  const isViewingAsAdmin = isAdmin && simulatedRole === "administrador";

  // Administrador tem acesso livre por padrão
  if (isViewingAsAdmin) return null;

  // Se já bateu entrada hoje, não bloqueia
  const temEntrada = verificarEntradaHoje(currentUser.id, pontosHoje);
  if (temEntrada) return null;

  // Se estiver na própria página da Central dos Torres, não precisamos bloquear a tela com modal opaco
  // porque lá ele já terá o cartão principal para bater ponto com destaque!
  if (pathname === "/central-torres") return null;

  const handleBaterPontoEntrada = async () => {
    if (!currentUser?.id) return;
    setSubmitting(true);
    try {
      const res = await baterPonto(currentUser.id, "entrada");
      if (res) {
        setPontosHoje((prev) => [...prev, res]);
        toast.success("Ponto de entrada registrado com sucesso! Bom trabalho! 🚀");
      }
    } catch (e) {
      toast.error("Erro ao registrar ponto. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Luz decorativa suave */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#5B50E5]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Expediente Obrigatório
              </span>
              <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                Ponto de Entrada Pendente
              </h2>
            </div>
          </div>

          {/* Relógio em destaque */}
          <div
            className="p-4 rounded-2xl text-center my-4 space-y-1"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
            }}
          >
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#5B50E5]">
              Horário Oficial de Brasília
            </span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              {currentTime || "--:--:--"}
            </div>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Descrição explicativa */}
          <p className="text-xs leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
            Olá, <strong className="text-[#5B50E5]">{currentUser.comoQuerSerChamado || currentUser.nome}</strong>!
            Para liberar o acesso ao painel de demandas, tarefas e operações, confirme o seu início de atividades de hoje.
          </p>

          {/* Ações */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleBaterPontoEntrada}
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#5B50E5] hover:bg-[#483EA8] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#5B50E5]/25 transition-all transform active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registrando ponto...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Bater Ponto de Entrada Agora</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/central-torres")}
              className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: "var(--surface-alt)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <span>Abrir Central dos Torres</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
