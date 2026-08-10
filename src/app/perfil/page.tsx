"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, User, Mail, Briefcase, Sparkles, Check, Upload, ShieldCheck, Heart } from "lucide-react";
import { getActiveUser, updateActiveUserProfile, UserAccount, USERS_SEED } from "@/lib/authPermissions";
import { AppSidebar } from "@/components/AppSidebar";
import { toast } from "sonner";

export default function PerfilPage() {
  const [user, setUser] = useState<UserAccount>(() => USERS_SEED[0]);
  const [nome, setNome] = useState("");
  const [nickname, setNickname] = useState("");
  const [comoQuerSerChamado, setComoQuerSerChamado] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("");
  const [setorNome, setSetorNome] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const active = getActiveUser();
    setUser(active);
    setNome(active.nome || "");
    setNickname(active.nickname || active.nome?.split(" ")[0] || "");
    setComoQuerSerChamado(active.comoQuerSerChamado || active.nickname || active.nome?.split(" ")[0] || "");
    setEmail(active.email || "");
    setCargo(active.cargo || (active.papel === "administrador" ? "Administrador Geral" : "Operador de Demandas"));
    setSetorNome(active.setorNome || "Geral");
    setBio(active.bio || "Membro integrante do time Hashira.");
    setAvatarUrl(active.avatarUrl || "");
  }, []);

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
        toast.success("Foto selecionada! Clique em 'Salvar Alterações' para confirmar.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe seu nome completo");
      return;
    }

    setSaving(true);

    setTimeout(() => {
      const updated = updateActiveUserProfile({
        nome: nome.trim(),
        nickname: nickname.trim() || nome.split(" ")[0],
        comoQuerSerChamado: comoQuerSerChamado.trim() || nickname.trim() || nome.split(" ")[0],
        email: email.trim(),
        cargo: cargo.trim(),
        setorNome: setorNome.trim(),
        bio: bio.trim(),
        avatarUrl,
      });

      setUser(updated);
      setSaving(false);
      toast.success("Perfil atualizado com sucesso!");
    }, 400);
  };

  const displayName = comoQuerSerChamado || nickname || nome || "Usuário";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <AppSidebar userRole={user.papel} userName={displayName} userEmail={user.email} />

      {/* Main Content Body */}
      <div className="flex-1 min-w-0 p-8 space-y-8">
        
        {/* Banner Hero Coursue */}
        <section
          className="coursue-banner relative p-8 md:p-10 shadow-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 100%)" }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Floating Avatar Header */}
              <div className="relative group shrink-0">
                <img
                  src={avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                  alt={displayName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-xl"
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold mb-2 bg-white/10 text-[#C7C2F5]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Meu Perfil de Usuário
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                  Olá, <span className="text-[#C7C2F5]">{displayName} 👋</span>
                </h1>
                <p className="mt-1 text-xs text-white/80">
                  {cargo} • Departamento: <strong>{setorNome}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase flex items-center gap-1.5 ${
                  user.papel === "administrador"
                    ? "bg-amber-400 text-[#1E1B4B]"
                    : "bg-white/20 text-white"
                }`}
              >
                {user.papel === "administrador" ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                Perfil: {user.papel}
              </span>
            </div>
          </div>
        </section>

        {/* Profile Card & Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
          
          {/* Left Avatar & Photo Upload Box */}
          <div className="coursue-card p-6 rounded-[24px] shadow-sm text-center flex flex-col items-center space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Foto de Perfil
            </h3>

            {/* Hidden Input for Local Computer File Upload */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              className="hidden"
            />

            {/* Avatar Circle with Upload Hover Overlay */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-36 h-36 rounded-full overflow-hidden border-4 shadow-md cursor-pointer group"
              style={{ borderColor: 'var(--brand-light)' }}
            >
              <img
                src={avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={displayName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-[#1E1B4B]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-1">
                <Camera className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase">Trocar Foto</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="coursue-btn-secondary w-full text-xs py-2.5 rounded-full flex items-center justify-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" /> Enviar Foto do Computador
            </button>

            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Formatos aceitos: PNG, JPG, WEBP. A foto será exibida no seu anel de desempenho e comentários.
            </p>
          </div>

          {/* Right Form Fields Card */}
          <div className="coursue-card p-8 rounded-[24px] shadow-sm">
            <h2 className="text-lg font-extrabold font-['Plus_Jakarta_Sans'] mb-6 pb-4" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              Informações Pessoais & Preferências
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* Nome Completo & Nickname Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="coursue-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                    Nickname / Apelido
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ex: Sensei, Matheus, Guardian"
                    className="coursue-input text-xs"
                  />
                </div>
              </div>

              {/* Como quer ser chamado & Cargo Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Heart className="w-3.5 h-3.5 text-[#5B50E5]" /> Como quer ser chamado(a)?
                  </label>
                  <input
                    type="text"
                    value={comoQuerSerChamado}
                    onChange={(e) => setComoQuerSerChamado(e.target.value)}
                    placeholder="Como prefere ser chamado na equipe"
                    className="coursue-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Operador de Funil, Designer Lead"
                    className="coursue-input text-xs"
                  />
                </div>
              </div>

              {/* Email & Setor Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@hashira.com"
                    className="coursue-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                    Departamento Hashira
                  </label>
                  <input
                    type="text"
                    value={setorNome}
                    onChange={(e) => setSetorNome(e.target.value)}
                    placeholder="Departamento de atuação"
                    className="coursue-input text-xs"
                  />
                </div>
              </div>

              {/* Bio / Apresentacao */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                  Bio / Apresentação Pessoal
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Escreva uma breve apresentação sobre você…"
                  className="w-full rounded-2xl p-4 text-xs outline-none focus:border-[#5B50E5] transition-all"
                  style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Save CTA */}
              <div className="pt-4 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="coursue-btn-primary px-8 h-12 text-xs shadow-lg shadow-[#5B50E5]/20 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {saving ? "Salvando…" : "Salvar Alterações do Perfil"}
                </button>
              </div>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
