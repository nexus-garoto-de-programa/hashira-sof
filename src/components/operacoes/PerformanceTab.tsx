"use client";

import React from "react";
import { motion } from "framer-motion";
import { ListChecks, Percent, Clock, TrendingUp } from "lucide-react";
import { ACTIVITIES_SEED, ActivityLog } from "@/lib/operacoesData";
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
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-muted)' }}>Tarefas Concluídas</span>
            <h3 className="text-2xl font-black font-['Plus_Jakarta_Sans'] mt-0.5" style={{ color: 'var(--text-primary)' }}>12</h3>
          </div>
        </div>

        <div className="coursue-card p-6 rounded-[24px] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl text-[#16A34A] bg-emerald-500/10">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-muted)' }}>Taxa de Conclusão</span>
            <h3 className="text-2xl font-black font-['Plus_Jakarta_Sans'] mt-0.5" style={{ color: 'var(--text-primary)' }}>85,7%</h3>
          </div>
        </div>

        <div className="coursue-card p-6 rounded-[24px] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl text-[#D97706] bg-amber-500/10">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-muted)' }}>Tempo Médio de Conclusão</span>
            <h3 className="text-2xl font-black font-['Plus_Jakarta_Sans'] mt-0.5" style={{ color: 'var(--text-primary)' }}>1.8 dias</h3>
          </div>
        </div>

        <div className="coursue-card p-6 rounded-[24px] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl text-[#3B82F6] bg-blue-500/10">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-muted)' }}>Produtividade Semanal</span>
            <h3 className="text-2xl font-black text-emerald-500 font-['Plus_Jakarta_Sans'] mt-0.5 flex items-center gap-1">
              +14,2% <TrendingUp className="w-4 h-4" />
            </h3>
          </div>
        </div>
      </div>

      {/* Main Chart + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Performance Chart */}
        <div className="lg:col-span-2 coursue-card p-6 rounded-[28px] space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
              Tarefas Concluídas por Membro
            </h3>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Desempenho da equipe no período selecionado
            </p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataMembros} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-alt)',
                    borderColor: 'var(--border)',
                    borderRadius: '16px',
                    color: 'var(--text-primary)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="concluida" fill="#5B50E5" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="coursue-card p-6 rounded-[28px] space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold uppercase tracking-wide font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
            Atividade dos últimos 7 dias
          </h3>

          <div className="space-y-3">
            {(ACTIVITIES_SEED as ActivityLog[]).map((act: ActivityLog) => (
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
    </div>
  );
};
