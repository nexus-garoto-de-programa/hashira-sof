"use client";

import React from "react";
import { motion } from "framer-motion";
import { ListChecks, Percent, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { ACTIVITIES_SEED } from "@/lib/operacoesData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export const PerformanceTab: React.FC = () => {
  const chartDataMembros = [
    { name: "MH", concluida: 6 },
    { name: "G", concluida: 0 },
    { name: "SD", concluida: 5 },
    { name: "J", concluida: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="coursue-card p-6 rounded-[24px] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl text-[#5B50E5]" style={{ backgroundColor: 'var(--brand-light)' }}>
              <ListChecks className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> ~0
            </span>
          </div>
          <div>
            <span className="text-3xl font-black font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>0</span>
            <span className="text-[11px] font-bold block mt-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Tarefas criadas no mês
            </span>
          </div>
        </div>

        <div className="coursue-card p-6 rounded-[24px] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-sky-100 text-sky-700">
              <Percent className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> ~0
            </span>
          </div>
          <div>
            <span className="text-3xl font-black font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>0%</span>
            <span className="text-[11px] font-bold block mt-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Taxa de conclusão
            </span>
          </div>
        </div>

        <div className="coursue-card p-6 rounded-[24px] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> ~14
            </span>
          </div>
          <div>
            <span className="text-3xl font-black font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>14</span>
            <span className="text-[11px] font-bold block mt-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Tarefas em atraso
            </span>
          </div>
        </div>

        <div className="coursue-card p-6 rounded-[24px] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> ~0.3
            </span>
          </div>
          <div>
            <span className="text-3xl font-black font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>0.3</span>
            <span className="text-[11px] font-bold block mt-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Tempo médio (dias)
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart: Tarefas concluídas por membro */}
      <div className="coursue-card p-6 rounded-[24px] space-y-4 shadow-sm">
        <h3 className="text-base font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
          Tarefas concluídas por membro
        </h3>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartDataMembros} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
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
              <Bar dataKey="concluida" fill="#5B50E5" radius={[6, 6, 0, 0]} name="Tarefas Concluídas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Log: Atividade dos últimos 7 dias */}
      <div className="coursue-card p-6 rounded-[24px] space-y-4 shadow-sm">
        <h3 className="text-base font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
          Atividade dos últimos 7 dias
        </h3>

        <div className="space-y-3">
          {ACTIVITIES_SEED.map((act) => (
            <div
              key={act.id}
              className="p-4 rounded-2xl flex items-center justify-between text-xs transition-colors"
              style={{
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: act.membroColor }}
                >
                  {act.membroInitials}
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  <strong className="font-extrabold" style={{ color: 'var(--text-primary)' }}>{act.membroNome}</strong>{" "}
                  <span style={{ color: 'var(--text-secondary)' }}>{act.acao}</span>{" "}
                  <strong className="font-extrabold text-[#5B50E5] uppercase">{act.tarefaTitulo}</strong>
                </div>
              </div>

              <span className="text-[11px] font-semibold shrink-0" style={{ color: 'var(--text-muted)' }}>
                {act.tempoAtras}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
