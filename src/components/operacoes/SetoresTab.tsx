"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Scissors, Palette, Building, ArrowRight, Camera, Upload } from "lucide-react";
import { OperacoesSetor, OperacoesTarefa } from "@/lib/operacoesData";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { uploadFileToSupabaseStorage } from "@/lib/supabase";
import { toast } from "sonner";

interface SetoresTabProps {
  setores: OperacoesSetor[];
  tarefas: OperacoesTarefa[];
  isAdmin?: boolean;
  onNavigateTab: (tab: string) => void;
  onUpdateCoverImage: (setorId: string, dataUrl: string) => void;
}

export const SetoresTab: React.FC<SetoresTabProps> = ({
  setores,
  tarefas,
  isAdmin = true,
  onNavigateTab,
  onUpdateCoverImage,
}) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileChange = async (setorId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido");
      return;
    }

    toast.info("Enviando imagem de capa para o Supabase Storage CDN...");

    const publicUrl = await uploadFileToSupabaseStorage(file, "covers");
    if (publicUrl) {
      onUpdateCoverImage(setorId, publicUrl);
      toast.success("Imagem de capa enviada para o CDN do Supabase com sucesso!");
    } else {
      toast.error("Falha ao enviar imagem de capa para o Supabase Storage.");
    }
  };

  const concluidas = tarefas.filter((t) => t.status === "concluido").length;
  const pendentes = tarefas.filter((t) => t.status === "em_andamento" || t.status === "revisao").length;
  const naoIniciadas = tarefas.filter((t) => t.status === "nao_iniciado").length;
  const totalTarefas = tarefas.length;

  // Donut chart dataset
  const donutData = [
    { name: "Concluídas", value: concluidas, color: "#16A34A" },
    { name: "Pendentes", value: pendentes, color: "#D97706" },
    { name: "Não iniciadas", value: naoIniciadas, color: "#9CA3AF" },
  ];

  // Stacked Bar dataset by sector
  const barData = setores.map((setor) => {
    const totalSetor = tarefas.filter((t) => t.setorId === setor.id);
    return {
      name: setor.nome,
      Concluidas: totalSetor.filter((t) => t.status === "concluido").length,
      Pendentes: totalSetor.filter((t) => t.status === "em_andamento" || t.status === "revisao").length,
      NaoIniciadas: totalSetor.filter((t) => t.status === "nao_iniciado").length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Admin Notice Banner */}
      {isAdmin && (
        <div className="p-4 rounded-2xl border flex items-center justify-between text-xs" style={{ backgroundColor: 'var(--brand-light)', borderColor: 'rgba(91,80,229,0.2)', color: 'var(--text-primary)' }}>
          <div className="flex items-center gap-2.5">
            <Camera className="w-4 h-4 text-[#5B50E5]" />
            <span>
              <strong>Modo Administrador Ativo:</strong> Você pode alterar a imagem de capa de qualquer setor enviando um arquivo diretamente do seu computador. A nova imagem ficará visível para todos os usuários.
            </span>
          </div>
        </div>
      )}

      {/* Cards Grid de Setores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {setores.map((setor) => {
          const countTotal = tarefas.filter((t) => t.setorId === setor.id).length;
          const countConc = tarefas.filter((t) => t.setorId === setor.id && t.status === "concluido").length;
          const countPend = countTotal - countConc;

          return (
            <motion.div
              key={setor.id}
              whileHover={{ y: -3 }}
              className="coursue-card rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group"
            >
              {/* Hidden File Input for Admin Upload */}
              {isAdmin && (
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => {
                    fileInputRefs.current[setor.id] = el;
                  }}
                  onChange={(e) => handleFileChange(setor.id, e)}
                  className="hidden"
                />
              )}

              {/* Cover Image Header */}
              <div className="h-36 w-full overflow-hidden relative" style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                {setor.capaUrl ? (
                  <img
                    src={setor.capaUrl}
                    alt={setor.nome}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Sem capa definida
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-transparent" />

                {/* Admin Upload Cover Button Overlay */}
                {isAdmin && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRefs.current[setor.id]?.click();
                      }}
                      className="px-4 py-2 rounded-full bg-white text-[#1E1B4B] text-xs font-bold shadow-lg hover:bg-[#5B50E5] hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Alterar Capa (Upload)
                    </button>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div
                onClick={() => onNavigateTab("tarefas")}
                className="p-5 space-y-4 flex-1 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-[#5B50E5]" style={{ backgroundColor: 'var(--brand-light)' }}>
                      {setor.icone === "Scissors" && <Scissors className="w-5 h-5 text-[#5B50E5]" />}
                      {setor.icone === "Palette" && <Palette className="w-5 h-5 text-purple-600" />}
                      {setor.icone === "Building" && <Building className="w-5 h-5 text-sky-600" />}
                    </div>
                    <ArrowRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </div>

                  <h3 className="text-lg font-extrabold tracking-tight font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                    {setor.nome}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{setor.descricao}</p>
                </div>

                <div className="pt-3 flex items-center justify-between text-xs font-semibold" style={{ borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{countTotal} tarefas</span>
                  <span className="text-emerald-600 font-bold">
                    {countConc} concluídas <span style={{ color: 'var(--text-muted)' }}>•</span>{" "}
                    <span className="text-amber-600">{countPend} pendentes</span>
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3 Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="coursue-card p-6 rounded-[24px] space-y-1 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-secondary)' }}>
            CONCLUÍDAS
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 font-['Plus_Jakarta_Sans']">
              {concluidas}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>de {totalTarefas} no total</span>
          </div>
        </div>

        <div className="coursue-card p-6 rounded-[24px] space-y-1 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-secondary)' }}>
            PENDENTES
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 font-['Plus_Jakarta_Sans']">
              {pendentes}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>de {totalTarefas} no total</span>
          </div>
        </div>

        <div className="coursue-card p-6 rounded-[24px] space-y-1 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-secondary)' }}>
            NÃO INICIADAS
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-secondary)' }}>
              {naoIniciadas}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>de {totalTarefas} no total</span>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: Status geral das tarefas */}
        <div className="coursue-card p-6 rounded-[24px] space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
            Status geral das tarefas
          </h3>

          <div className="h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#16A34A]" /> Concluídas
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#D97706]" /> Pendentes
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#9CA3AF]" /> Não iniciadas
            </span>
          </div>
        </div>

        {/* Stacked Bar Chart: Tarefas por setor */}
        <div className="coursue-card p-6 rounded-[24px] space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
            Tarefas por setor
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="Concluidas" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} name="Concluídas" />
                <Bar dataKey="Pendentes" stackId="a" fill="#D97706" radius={[0, 0, 0, 0]} name="Pendentes" />
                <Bar dataKey="NaoIniciadas" stackId="a" fill="#9CA3AF" radius={[4, 4, 0, 0]} name="Não iniciadas" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#16A34A]" /> Concluídas
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#D97706]" /> Pendentes
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#9CA3AF]" /> Não iniciadas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
