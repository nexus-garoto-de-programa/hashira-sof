"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, User, Loader2, Sparkles } from "lucide-react";
import { getStoredUsers, fetchUsersFromSupabase, setActiveUser, UserAccount } from "@/lib/authPermissions";
import { useBranding, DEFAULT_BRANDING } from "@/lib/branding";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const branding = useBranding();
  const [activeTab, setActiveTab] = useState<"colaborador" | "administrador">("colaborador");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Informe e-mail e senha para continuar");
      return;
    }

    setLoading(true);

    setTimeout(async () => {
      try {
        const users = await fetchUsersFromSupabase();
        const cleanEmail = email.trim().toLowerCase();

        // Buscar usuário por e-mail na base salva
        const matchingUser = users.find(
          (u) => u.email.toLowerCase().trim() === cleanEmail
        );

        if (!matchingUser) {
          setLoading(false);
          toast.error("E-mail não encontrado. Realize o cadastro para criar sua conta.");
          return;
        }

        // Validação de Senha
        if (matchingUser.senha && matchingUser.senha !== password.trim()) {
          setLoading(false);
          toast.error("Senha incorreta. Tente novamente.");
          return;
        }

        // Se o usuário tentar logar na aba Administrador com uma conta que é estritamente Colaborador
        if (activeTab === "administrador" && matchingUser.papel !== "administrador" && cleanEmail !== "mhvzbusiness@gmail.com") {
          setLoading(false);
          toast.error("Esta conta possui perfil de Colaborador. Alterne para a aba 'Colaborador' para entrar.");
          return;
        }

        // Define a sessão ativa
        setActiveUser(matchingUser);

        const isAdminAccount = matchingUser.papel === "administrador" || cleanEmail === "mhvzbusiness@gmail.com";
        const displayName = matchingUser.comoQuerSerChamado || matchingUser.nickname || matchingUser.nome || "Usuário";

        // Exibe a notificação de boas-vindas
        if (isAdminAccount) {
          toast.success(`Seja bem-vindo, Administrador! (${matchingUser.email})`);
        } else {
          toast.success(`Seja bem-vindo(a), ${displayName}!`);
        }

        // Rota de destino explícita por perfil
        const targetRoute = isAdminAccount ? "/admin/dashboard" : "/dashboard";

        console.log(`[AUTH LOG] Login realizado com sucesso para ${matchingUser.email} [${matchingUser.papel}]. Redirecionando para ${targetRoute}...`);

        setLoading(false);

        // Executa navegação via router do Next.js
        router.push(targetRoute);

        // Fallback de navegação preventiva
        setTimeout(() => {
          if (typeof window !== "undefined" && window.location.pathname === "/login") {
            console.warn(`[AUTH WARN] Redirecionamento pendente. Executando navegacao fallback para ${targetRoute}`);
            window.location.href = targetRoute;
          }
        }, 350);

      } catch (err) {
        console.error("[AUTH ERROR] Erro durante o processo de login:", err);
        setLoading(false);
        toast.error("Ocorreu um erro ao processar seu login. Tente novamente.");
      }
    }, 600);
  };

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: 'var(--bg)' }}>
      
      {/* Lado Esquerdo — Imagem de Destaque com Logo Oficial */}
      <div className="relative hidden md:flex md:w-[48%] flex-col justify-between p-12 overflow-hidden bg-[#1E1B4B]">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={branding.loginBgUrl || DEFAULT_BRANDING.loginBgUrl}
            alt="Central Hashira Operations"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B4B] via-[#1E1B4B]/70 to-[#5B50E5]/50" />
        </div>

        {/* Top Logo Container */}
        <div className="relative z-10 flex items-center gap-4">
          <img
            src={branding.logoWhiteUrl || "/hashira-logo-white.png"}
            alt={branding.nomeMarca || "HASHIRA"}
            className="h-24 md:h-28 w-auto max-w-[340px] object-contain drop-shadow-2xl"
          />
        </div>

        {/* Central Headlines */}
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold bg-white/15 text-white backdrop-blur-md border border-white/20">
            <Sparkles className="h-3.5 w-3.5" />
            Centro de Comando & Controle
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight font-['Plus_Jakarta_Sans']">
            Gerencie operações com
            <br />
            <span className="text-[#C7C2F5]">permissões granulares.</span>
          </h2>
          <p className="text-sm text-white/80 leading-relaxed max-w-md">
            Acesso sob medida para colaboradores e administradores. Controle setores, tarefas, quadros Kanban e relatórios.
          </p>
        </div>

        {/* Bottom Features */}
        <div className="relative z-10 flex items-center gap-6 text-xs text-white/70">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Auto-cadastro de Operadores
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#C7C2F5]" /> Gestão de Acessos pelo Admin
          </span>
        </div>
      </div>

      {/* Lado Direito — Formulário de Login com Alternador */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[440px]">
          {/* Logo no Mobile */}
          <div className="md:hidden flex justify-center mb-6">
            <img
              src="/hashira-logo-purple.png"
              alt="HASHIRA"
              className="h-16 w-auto object-contain"
            />
          </div>

          <div className="coursue-card p-8 sm:p-10 rounded-[28px] shadow-xl space-y-6">
            
            {/* Header */}
            <div>
              <h1 className="text-2xl font-extrabold font-['Plus_Jakarta_Sans']" style={{ color: 'var(--text-primary)' }}>
                Acessar Plataforma
              </h1>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                Selecione seu perfil abaixo para entrar na conta
              </p>
            </div>

            {/* Alternador de Perfil: Colaborador vs Administrador */}
            <div className="flex p-1.5 rounded-full" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setActiveTab("colaborador")}
                className={`flex-1 py-2.5 rounded-full text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "colaborador"
                    ? "bg-[#5B50E5] text-white shadow-md"
                    : ""
                }`}
                style={{
                  color: activeTab === "colaborador" ? "#FFFFFF" : "var(--text-secondary)",
                }}
              >
                <User className="w-3.5 h-3.5" /> Colaborador
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("administrador")}
                className={`flex-1 py-2.5 rounded-full text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "administrador"
                    ? "bg-[#1E1B4B] text-white shadow-md"
                    : ""
                }`}
                style={{
                  color: activeTab === "administrador" ? "#FFFFFF" : "var(--text-secondary)",
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Administrador
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                  {activeTab === "administrador" ? "E-mail Administrativo" : "E-mail do Colaborador"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeTab === "administrador" ? "admin@hashira.com" : "seu@hashira.com"}
                    className="coursue-input pl-12"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="coursue-input pl-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 rounded-full font-bold text-xs text-white transition-all flex items-center justify-center gap-2 shadow-md ${
                  activeTab === "administrador"
                    ? "bg-[#1E1B4B] hover:bg-[#121033]"
                    : "bg-[#5B50E5] hover:bg-[#483EA8]"
                }`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : activeTab === "administrador" ? (
                  "Entrar como Administrador 👑 →"
                ) : (
                  "Entrar como Colaborador →"
                )}
              </button>
            </form>

            {/* Self-service Registration link ONLY for Operators/Collaborators */}
            {activeTab === "colaborador" && (
              <div className="text-center text-xs pt-4" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Ainda não possui conta de operador?{" "}
                <Link
                  href="/cadastro"
                  className="font-bold text-[#5B50E5] hover:underline block mt-1"
                >
                  Criar conta de Colaborador (Auto-cadastro) →
                </Link>
              </div>
            )}

            {activeTab === "administrador" && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 text-center">
                🔒 Área restrita para gestores. O acesso permite configurar permissões da equipe.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
