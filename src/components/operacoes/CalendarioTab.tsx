"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OperacoesTarefa } from "@/lib/operacoesData";

interface CalendarioTabProps {
  tarefas: OperacoesTarefa[];
}

export const CalendarioTab: React.FC<CalendarioTabProps> = ({ tarefas }) => {
  const daysOfWeek = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

  // August 2026 Calendar Grid
  const prevMonthDays = [26, 27, 28, 29, 30, 31];
  const currentMonthDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const nextMonthDays = [1, 2, 3, 4, 5];

  const currentDayHighlight = 7;

  return (
    <div className="coursue-card p-6 rounded-[24px] space-y-6 shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
          Agosto 2026
        </h3>

        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <button className="p-1.5 rounded-full transition-colors" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-extrabold text-[#5B50E5] px-3.5 py-1 rounded-full" style={{ backgroundColor: 'var(--brand-light)' }}>
            Hoje
          </span>
          <button className="p-1.5 rounded-full transition-colors" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="space-y-2">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
          {daysOfWeek.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid Cells */}
        <div className="grid grid-cols-7 gap-2">
          {/* Previous Month Padded Days */}
          {prevMonthDays.map((d) => (
            <div
              key={`prev-${d}`}
              className="h-24 rounded-[16px] p-2 text-xs font-bold opacity-30"
              style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              {d}
            </div>
          ))}

          {/* Current Month Days */}
          {currentMonthDays.map((d) => {
            const isToday = d === currentDayHighlight;
            const taskOnDay = tarefas.find(
              (t) => new Date(t.dataEntrega + "T00:00:00").getDate() === d
            );

            return (
              <div
                key={`curr-${d}`}
                className={`h-24 rounded-[16px] p-2 text-xs font-bold transition-all relative flex flex-col justify-between ${
                  isToday
                    ? "border-[#5B50E5] shadow-sm"
                    : ""
                }`}
                style={{
                  backgroundColor: isToday ? 'var(--brand-light)' : 'var(--surface-alt)',
                  border: isToday ? '2px solid #5B50E5' : '1px solid var(--border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                      isToday ? "bg-[#5B50E5] text-white" : ""
                    }`}
                    style={{ color: isToday ? "#FFFFFF" : "var(--text-primary)" }}
                  >
                    {d}
                  </span>
                </div>

                {/* Scheduled Task Pill */}
                {taskOnDay && (
                  <div
                    className="p-1.5 rounded-lg bg-amber-100 border border-amber-200 text-[9px] font-extrabold text-amber-800 uppercase truncate"
                    title={taskOnDay.titulo}
                  >
                    {taskOnDay.titulo}
                  </div>
                )}
                {d === 1 && !taskOnDay && (
                  <div className="p-1.5 rounded-lg bg-amber-100 border border-amber-200 text-[9px] font-extrabold text-amber-800 uppercase truncate">
                    DEMANDAS DISCORD
                  </div>
                )}
              </div>
            );
          })}

          {/* Next Month Padded Days */}
          {nextMonthDays.map((d) => (
            <div
              key={`next-${d}`}
              className="h-24 rounded-[16px] p-2 text-xs font-bold opacity-30"
              style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              {d}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
