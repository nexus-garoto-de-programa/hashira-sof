"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tag, Plus, X } from "lucide-react";
import { OperacoesProjeto, saveStoredOperacoesProjetos, getStoredOperacoesProjetos } from "@/lib/operacoesData";
import { toast } from "sonner";

export const ProjetosTab: React.FC = () => {
  const [projetos, setProjetos] = useState<OperacoesProjeto[]>(getStoredOperacoesProjetos);
  const [novoNome, setNovoNome] = useState("");
  const [corSelecionada, setCorSelecionada] = useState("#8B5CF6");

  const coresDisponiveis = [
    "#8B5CF6", // Roxo
    "#3B82F6", // Azul
    "#06B6D4", // Ciano
    "#22C55E", // Verde
    "#EAB308", // Amarelo
    "#EC4899", // Rosa
    "#D946EF", // Magenta
  ];

  const handleCriarProjeto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) {
      toast.error("Informe o nome do projeto");
      return;
    }

    const novo: OperacoesProjeto = {
      id: "proj-" + Date.now(),
      nome: novoNome.trim(),
      cor: corSelecionada,
      totalTarefas: 0,
      concluidas: 0,
      tarefasTítulos: [],
    };

    const atualizados = [novo, ...projetos];
    setProjetos(atualizados);
    saveStoredOperacoesProjetos(atualizados);
    toast.success("Projeto criado com sucesso!");
    setNovoNome("");
  };

  const handleRemoverProjeto = (id: string) => {
    const atualizados = projetos.filter((p) => p.id !== id);
    setProjetos(atualizados);
    saveStoredOperacoesProjetos(atualizados);
    toast.success("Projeto removido");
  };

  return (
    <div className="space-y-6">
      {/* Box de explicação + Formulário de Criação */}
      <div className="coursue-card p-6 rounded-[24px] space-y-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
            Projetos são etiquetas que você atribui às tarefas
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Exemplo: banners x, y e z podem ser do projeto <strong className="text-[#5B50E5]">Discord</strong>. Crie um projeto e atribua a quantas tarefas quiser.
          </p>
        </div>

        {/* Input + Color Picker + Button */}
        <form onSubmit={handleCriarProjeto} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <input
            type="text"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome do projeto (ex.: Discord)"
            className="coursue-input flex-1"
          />

          {/* Color Dots Picker */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
            {coresDisponiveis.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCorSelecionada(c)}
                className={`h-4 w-4 rounded-full transition-transform ${
                  corSelecionada === c ? "scale-125 ring-2 ring-[#5B50E5]" : "opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <button
            type="submit"
            className="coursue-btn-primary h-12 px-6 text-xs shadow-md shadow-[#5B50E5]/20 flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Criar Projeto
          </button>
        </form>
      </div>

      {/* Grid de Cards de Projetos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projetos.map((proj) => (
          <motion.div
            key={proj.id}
            whileHover={{ y: -3 }}
            className="coursue-card p-6 rounded-[24px] space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="p-2.5 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: proj.cor + "20", color: proj.cor }}
                  >
                    <Tag className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                    {proj.nome}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {coresDisponiveis.slice(0, 5).map((c, idx) => (
                      <span
                        key={idx}
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: c === proj.cor ? c : c + "40" }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => handleRemoverProjeto(proj.id)}
                    className="hover:text-rose-600 p-1 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {proj.totalTarefas} tarefas <span style={{ color: 'var(--text-muted)' }}>•</span>{" "}
                <span className="text-emerald-600 font-bold">{proj.concluidas} concluídas</span>
              </div>

              {/* Task titles snippet */}
              <div className="mt-4 space-y-1.5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                {proj.tarefasTítulos.map((t, idx) => (
                  <div key={idx} className="text-xs flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span className="truncate">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
