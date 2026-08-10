"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { HASHIRAS_SEED, saveStoredUsuario, Usuario } from "@/lib/demands";
import {
  getStoredUsers,
  saveStoredUsers,
  setActiveUser,
  DEFAULT_COLLABORATOR_PERMISSIONS,
  UserAccount,
} from "@/lib/authPermissions";
import { toast } from "sonner";

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [setorId, setSetorId] = useState(HASHIRAS_SEED[0].id);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !email.trim() || !senha.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (senha !== confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    const setorObj = HASHIRAS_SEED.find((s) => s.id === setorId) || HASHIRAS_SEED[0];

    const novoUsuarioDemandas: Usuario = {
      id: "usr-" + Date.now(),
      nome: nome.trim(),
      email: email.trim(),
      papel: "colaborador",
      setorId: setorObj.id,
      setorNome: setorObj.nome,
      statusConta: "ativo",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      criadoEm: new Date().toISOString(),
    };

    const novaContaAuth: UserAccount = {
      id: novoUsuarioDemandas.id,
      nome: nome.trim(),
      nickname: nome.trim().split(" ")[0],
      comoQuerSerChamado: nome.trim().split(" ")[0],
      email: email.trim(),
      papel: "colaborador",
      setorNome: setorObj.nome,
      avatarUrl: novoUsuarioDemandas.avatarUrl,
      permissoes: DEFAULT_COLLABORATOR_PERMISSIONS,
    };

    setTimeout(() => {
      saveStoredUsuario(novoUsuarioDemandas);
      const currentUsers = getStoredUsers();
      saveStoredUsers([novaContaAuth, ...currentUsers]);
      setActiveUser(novaContaAuth);

      toast.success(`Conta criada com sucesso! Bem-vindo ao departamento ${setorObj.nome}`);
      setLoading(false);
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 my-8">
      <div className="w-full max-w-2xl">
        <div className="coursue-card p-8 rounded-[28px] shadow-xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5B50E5] text-white shadow-md shadow-[#5B50E5]/25">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                Criar Conta de Colaborador
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Preencha seus dados e escolha seu departamento Hashira para acesso imediato
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome Completo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                Nome Completo *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome e sobrenome"
                  className="coursue-input pl-11"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                E-mail Corporativo *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@hashira.com"
                  className="coursue-input pl-11"
                />
              </div>
            </div>

            {/* Seletor de Departamento Hashira */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                Selecione seu Departamento Hashira *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HASHIRAS_SEED.map((h) => {
                  const isSelected = setorId === h.id;
                  return (
                    <div
                      key={h.id}
                      onClick={() => setSetorId(h.id)}
                      className="p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3"
                      style={{
                        backgroundColor: isSelected ? 'var(--brand-light)' : 'var(--surface-alt)',
                        borderColor: isSelected ? '#5B50E5' : 'var(--border)',
                      }}
                    >
                      <div
                        className="h-4 w-4 rounded-full border-2 border-[#5B50E5] flex items-center justify-center shrink-0 mt-0.5"
                      >
                        {isSelected && <div className="h-2 w-2 rounded-full bg-[#5B50E5]" />}
                      </div>
                      <div>
                        <span
                          className="text-xs font-bold block"
                          style={{ color: isSelected ? "#5B50E5" : "var(--text-primary)" }}
                        >
                          {h.nome}
                        </span>
                        <span className="text-[10px] line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                          {h.descricao}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Senha e Confirmar Senha Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                  Senha *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type={showSenha ? "text" : "password"}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="coursue-input pl-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type={showSenha ? "text" : "password"}
                    required
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Confirme a senha"
                    className="coursue-input pl-11"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="coursue-btn-primary w-full h-12 text-sm shadow-md shadow-[#0A0A0A]/20 mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Concluir Cadastro & Acessar Painel →"
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="text-center text-xs pt-3" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Já possui uma conta?{" "}
            <Link href="/login" className="font-bold text-[#5B50E5] hover:underline">
              Fazer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
