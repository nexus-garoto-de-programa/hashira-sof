"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Sparkles,
  Loader2,
  Camera,
  Upload,
  CheckCircle2,
  Briefcase,
  Layers,
  Heart,
} from "lucide-react";
import { HASHIRAS_SEED, saveStoredUsuario, Usuario } from "@/lib/demands";
import {
  getStoredUsers,
  saveStoredUsers,
  setActiveUser,
  DEFAULT_COLLABORATOR_PERMISSIONS,
  UserAccount,
} from "@/lib/authPermissions";
import { toast } from "sonner";

const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
];

export default function CadastroPage() {
  const router = useRouter();

  // Dados Pessoais & Perfil
  const [nome, setNome] = useState("");
  const [nickname, setNickname] = useState("");
  const [comoQuerSerChamado, setComoQuerSerChamado] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATARS[0]);

  // Multi-Seleção de Departamentos
  const [selectedSetoresIds, setSelectedSetoresIds] = useState<string[]>([HASHIRAS_SEED[0].id]);

  // Credenciais
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarUrl(dataUrl);
        toast.success("Foto de perfil carregada!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleSetor = (setorId: string) => {
    if (selectedSetoresIds.includes(setorId)) {
      if (selectedSetoresIds.length === 1) {
        toast.error("Você deve selecionar pelo menos 1 departamento Hashira");
        return;
      }
      setSelectedSetoresIds(selectedSetoresIds.filter((id) => id !== setorId));
    } else {
      setSelectedSetoresIds([...selectedSetoresIds, setorId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("Preencha seu nome completo");
      return;
    }

    if (!email.trim()) {
      toast.error("Informe seu e-mail corporativo");
      return;
    }

    if (!senha.trim()) {
      toast.error("Preencha a senha de acesso");
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

    if (selectedSetoresIds.length === 0) {
      toast.error("Selecione pelo menos 1 departamento");
      return;
    }

    const currentUsers = getStoredUsers();
    const cleanEmail = email.trim().toLowerCase();
    const existingUser = currentUsers.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (existingUser) {
      toast.error("Este e-mail já está cadastrado no sistema. Faça login para acessar sua conta.");
      return;
    }

    setLoading(true);

    const setoresSelecionadosObjs = HASHIRAS_SEED.filter((s) => selectedSetoresIds.includes(s.id));
    const setoresNomes = setoresSelecionadosObjs.map((s) => s.nome);
    const setorPrincipal = setoresSelecionadosObjs[0] || HASHIRAS_SEED[0];

    const finalNickname = nickname.trim() || nome.trim().split(" ")[0];
    const finalComoChamar = comoQuerSerChamado.trim() || finalNickname;

    const userId = "usr-" + Date.now();

    const novoUsuarioDemandas: Usuario = {
      id: userId,
      nome: nome.trim(),
      email: cleanEmail,
      papel: "colaborador",
      setorId: setorPrincipal.id,
      setorNome: setorPrincipal.nome,
      statusConta: "ativo",
      avatarUrl: avatarUrl,
      criadoEm: new Date().toISOString(),
    };

    const novaContaAuth: UserAccount = {
      id: userId,
      nome: nome.trim(),
      nickname: finalNickname,
      comoQuerSerChamado: finalComoChamar,
      cargo: cargo.trim() || "Operador de Demandas",
      bio: bio.trim() || "Novo integrante do time Hashira Sensi.",
      email: cleanEmail,
      senha: senha.trim(),
      papel: "colaborador",
      setorNome: setorPrincipal.nome,
      setoresNomes: setoresNomes,
      avatarUrl: avatarUrl,
      permissoes: DEFAULT_COLLABORATOR_PERMISSIONS,
    };

    setTimeout(() => {
      saveStoredUsuario(novoUsuarioDemandas);
      const updatedUsers = [novaContaAuth, ...currentUsers];
      saveStoredUsers(updatedUsers);
      setActiveUser(novaContaAuth);

      toast.success(
        `Cadastro concluído com sucesso! Registrado em ${setoresNomes.length} departamento(s): ${setoresNomes.join(", ")}`
      );
      setLoading(false);
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 my-8">
      <div className="w-full max-w-3xl">
        <div className="coursue-card p-6 sm:p-10 rounded-[28px] shadow-2xl space-y-8">
          
          {/* Header */}
          <div className="flex items-center gap-4 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5B50E5] text-white shadow-lg shadow-[#5B50E5]/30 shrink-0">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase bg-[#EBE8FF] text-[#5B50E5] mb-1">
                Primeiro Acesso • Cadastro Inicial
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-['Plus_Jakarta_Sans'] leading-tight" style={{ color: "var(--text-primary)" }}>
                Pré-Cadastro de Colaborador
              </h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Preencha seu perfil completo, foto e selecione todos os departamentos em que atua
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* SEÇÃO 1: Foto de Perfil */}
            <div className="space-y-4 p-5 rounded-2xl" style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}>
              <label className="text-xs font-bold uppercase tracking-wider block flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Camera className="w-4 h-4 text-[#5B50E5]" />
                Foto de Perfil (Avatar)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Upload Button Circle */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-24 h-24 rounded-full overflow-hidden border-4 shadow-md cursor-pointer group shrink-0"
                  style={{ borderColor: "var(--brand-light)" }}
                >
                  <img
                    src={avatarUrl}
                    alt="Foto de Perfil"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-[#1E1B4B]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <Upload className="w-5 h-5" />
                    <span className="text-[9px] font-bold uppercase">Trocar</span>
                  </div>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="coursue-btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Enviar Foto do Computador
                    </button>
                  </div>
                  
                  {/* Default avatars selector */}
                  <div>
                    <span className="text-[10px] font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>
                      Ou selecione um avatar padrão:
                    </span>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      {DEFAULT_AVATARS.map((av, idx) => (
                        <img
                          key={idx}
                          src={av}
                          alt={`Avatar ${idx}`}
                          onClick={() => setAvatarUrl(av)}
                          className={`w-9 h-9 rounded-full object-cover cursor-pointer border-2 transition-all ${
                            avatarUrl === av ? "border-[#5B50E5] scale-110 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: Informações Pessoais */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 pb-2" style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border)" }}>
                <User className="w-4 h-4 text-[#5B50E5]" /> Informações Pessoais & Profissionais
              </h3>

              {/* Nome Completo & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: "var(--text-primary)" }}>
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome e sobrenome"
                      className="coursue-input pl-11 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: "var(--text-primary)" }}>
                    E-mail Corporativo *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@hashira.com"
                      className="coursue-input pl-11 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Nickname, Como Quer Ser Chamado & Cargo Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: "var(--text-primary)" }}>
                    Nickname / Apelido
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ex: Sensei, Guardian"
                    className="coursue-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                    <Heart className="w-3 h-3 text-[#5B50E5]" /> Como quer ser chamado? *
                  </label>
                  <input
                    type="text"
                    value={comoQuerSerChamado}
                    onChange={(e) => setComoQuerSerChamado(e.target.value)}
                    placeholder="Nome de preferência na equipe"
                    className="coursue-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: "var(--text-primary)" }}>
                    Cargo / Função
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      placeholder="Ex: Designer Lead, Copywriter"
                      className="coursue-input pl-11 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: "var(--text-primary)" }}>
                  Bio / Apresentação Pessoal
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="Escreva uma breve apresentação sobre sua atuação..."
                  className="w-full rounded-2xl p-3.5 text-xs outline-none transition-all"
                  style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            {/* SEÇÃO 3: Seleção Multi-Departamento Hashira */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Layers className="w-4 h-4 text-[#5B50E5]" />
                  Selecione seus Departamentos Hashira (Pode marcar mais de 1) *
                </h3>
                <span className="text-xs font-bold px-3 py-0.5 rounded-full text-[#5B50E5]" style={{ backgroundColor: "var(--brand-light)" }}>
                  {selectedSetoresIds.length} selecionado(s)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HASHIRAS_SEED.map((h) => {
                  const isSelected = selectedSetoresIds.includes(h.id);
                  return (
                    <div
                      key={h.id}
                      onClick={() => handleToggleSetor(h.id)}
                      className="p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 group"
                      style={{
                        backgroundColor: isSelected ? "var(--brand-light)" : "var(--surface-alt)",
                        borderColor: isSelected ? "#5B50E5" : "var(--border)",
                      }}
                    >
                      <div
                        className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected ? "bg-[#5B50E5] border-[#5B50E5] text-white" : "border-[#9CA3AF]"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className="text-xs font-bold block"
                          style={{ color: isSelected ? "#5B50E5" : "var(--text-primary)" }}
                        >
                          {h.nome}
                        </span>
                        <span className="text-[10px] line-clamp-1" style={{ color: "var(--text-secondary)" }}>
                          {h.descricao}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEÇÃO 4: Credenciais de Acesso */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 pb-2" style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border)" }}>
                <Lock className="w-4 h-4 text-[#5B50E5]" /> Senha de Acesso
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: "var(--text-primary)" }}>
                    Senha *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    <input
                      type={showSenha ? "text" : "password"}
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="coursue-input pl-11 pr-11 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: "var(--text-primary)" }}>
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    <input
                      type={showSenha ? "text" : "password"}
                      required
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Confirme a senha"
                      className="coursue-input pl-11 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="coursue-btn-primary w-full h-12 text-sm shadow-xl shadow-[#5B50E5]/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Concluir Pré-Cadastro & Acessar Painel →"
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="text-center text-xs pt-3" style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}>
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
