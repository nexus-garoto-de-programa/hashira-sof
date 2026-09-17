"use client";

import React, { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  Radio,
  Settings,
  Sparkles,
  User,
  Volume2,
  X,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  DiscordStatusItem,
  fetchDiscordStatuses,
  vincularDiscordUser,
  simularDiscordStatus,
} from "@/lib/torresData";
import { UserAccount, getStoredUsers, getAdminSimulatedRole, fetchUsersFromSupabase } from "@/lib/authPermissions";
import { useRealtimeSubscription } from "@/lib/realtimeSync";
import { toast } from "sonner";

interface TorresDiscordStatusProps {
  currentUser: UserAccount;
}

export const TorresDiscordStatus: React.FC<TorresDiscordStatusProps> = ({ currentUser }) => {
  const [statuses, setStatuses] = useState<DiscordStatusItem[]>([]);
  const [colaboradores, setColaboradores] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para vincular discord_user_id (Admin)
  const [selectedColabForLink, setSelectedColabForLink] = useState<UserAccount | null>(null);
  const [discordIdInput, setDiscordIdInput] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  const isAdmin =
    currentUser.email === "mhvzbusiness@gmail.com" ||
    currentUser.papel === "administrador";
  const simulated = getAdminSimulatedRole();
  const isAdminView = isAdmin && simulated === "administrador";

  const carregarDados = async () => {
    try {
      const [sts, usrs] = await Promise.all([
        fetchDiscordStatuses(),
        fetchUsersFromSupabase(),
      ]);
      setStatuses(sts);
      setColaboradores(usrs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  useRealtimeSubscription({
    topics: ["discord_status", "usuarios"],
    onUpdate: () => carregarDados(),
  });

  const handleOpenLinkModal = (colab: UserAccount) => {
    setSelectedColabForLink(colab);
    setDiscordIdInput(colab.discord_user_id || "");
  };

  const handleSalvarLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColabForLink) return;

    setSavingLink(true);
    try {
      await vincularDiscordUser(selectedColabForLink.id, discordIdInput.trim());
      toast.success(`ID do Discord vinculado para ${selectedColabForLink.comoQuerSerChamado || selectedColabForLink.nome}!`);
      setSelectedColabForLink(null);
      await carregarDados();
    } catch (e) {
      toast.error("Erro ao vincular ID do Discord.");
    } finally {
      setSavingLink(false);
    }
  };

  const handleSimularToggleCall = async (colabId: string, atualEmCall: boolean) => {
    try {
      await simularDiscordStatus(colabId, !atualEmCall, "🔊 Canal de Voz Operações");
      toast.success(!atualEmCall ? "Simulação: Colaborador entrou em call! 🟢" : "Simulação: Colaborador saiu de call! ⚪");
      await carregarDados();
    } catch (e) {
      toast.error("Erro na simulação.");
    }
  };

  const emCallCount = statuses.filter((s) => s.em_call).length;

  return (
    <div
      className="p-6 rounded-[28px] space-y-6 shadow-sm relative overflow-hidden"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                Status de Chamada no Discord
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#5865F2]/15 text-[#5865F2]">
                {emCallCount} em call agora
              </span>
            </div>
            <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
              Presença e canais de voz da equipe atualizados em tempo real via bot
            </p>
          </div>
        </div>

        {isAdminView && (
          <div className="text-[11px] font-bold text-zinc-400">
            👑 Modo Admin: Você pode vincular os IDs e simular eventos de voz
          </div>
        )}
      </div>

      {/* Grid de Colaboradores com Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {colaboradores.map((colab) => {
          const st = statuses.find((s) => s.colaborador_id === colab.id);
          const emCall = !!st?.em_call;
          const canal = st?.canal_atual;
          const temDiscordId = !!colab.discord_user_id;

          return (
            <div
              key={colab.id}
              className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between group ${
                emCall
                  ? "bg-emerald-500/10 border-emerald-500/30 shadow-sm"
                  : "hover:border-[#5865F2]/30"
              }`}
              style={{
                backgroundColor: emCall ? undefined : "var(--surface-alt)",
                borderColor: emCall ? undefined : "var(--border)",
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={colab.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                      alt={colab.nome}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                        emCall ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <h4
                      className="text-xs font-black truncate leading-tight"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {colab.comoQuerSerChamado || colab.nome}
                    </h4>
                    <span className="text-[10px] block truncate text-zinc-400">
                      {colab.setorNome || "Operações"}
                    </span>
                  </div>
                </div>

                {/* Badge de Status */}
                <div className="shrink-0 text-right">
                  {emCall ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 animate-pulse">
                      <Mic className="w-3 h-3" />
                      <span>EM CALL</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/15 text-zinc-400">
                      <MicOff className="w-3 h-3" />
                      <span>OFFLINE</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Informação do Canal ou ID */}
              <div className="pt-2 border-t flex items-center justify-between gap-2 text-[10px]" style={{ borderColor: "var(--border)" }}>
                <div className="min-w-0 truncate">
                  {emCall && canal ? (
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 truncate block">
                      {canal}
                    </span>
                  ) : (
                    <span className="text-zinc-400 truncate block">
                      {temDiscordId ? `ID: ${colab.discord_user_id}` : "Discord não vinculado"}
                    </span>
                  )}
                </div>

                {/* Controles de Admin */}
                {isAdminView && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSimularToggleCall(colab.id, emCall)}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold border transition-colors cursor-pointer ${
                        emCall
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                      }`}
                      title="Testar alternância de status de voz"
                    >
                      {emCall ? "Desconectar" : "Simular Call"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenLinkModal(colab)}
                      className="p-1 rounded-lg hover:bg-zinc-500/15 text-zinc-400 transition-colors cursor-pointer"
                      title="Vincular Discord User ID"
                    >
                      <Settings className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Admin: Vincular Discord ID */}
      {selectedColabForLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 relative"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                Vincular Conta do Discord
              </h3>
              <button
                type="button"
                onClick={() => setSelectedColabForLink(null)}
                className="p-1.5 rounded-xl hover:bg-zinc-500/15 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Insira o <strong>ID de Usuário do Discord (Snowflake ID)</strong> do colaborador{" "}
              <strong>{selectedColabForLink.comoQuerSerChamado || selectedColabForLink.nome}</strong>.
              O bot usará esse ID para detectar quando ele entrar ou sair de uma chamada.
            </p>

            <form onSubmit={handleSalvarLink} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Discord User ID (ex: 789456123012345678)
                </label>
                <input
                  type="text"
                  placeholder="Cole o ID de usuário do Discord..."
                  value={discordIdInput}
                  onChange={(e) => setDiscordIdInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border outline-none"
                  style={{
                    backgroundColor: "var(--surface-alt)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedColabForLink(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  style={{
                    backgroundColor: "var(--surface-alt)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingLink}
                  className="px-5 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingLink ? "Salvando..." : "Salvar Vínculo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
