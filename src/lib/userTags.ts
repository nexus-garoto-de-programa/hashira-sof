"use client";

import { supabase } from "@/lib/supabase";
import { notifyRealtimeChange } from "@/lib/realtimeSync";
import { useEffect, useState, useCallback } from "react";
import { UserAccount, getStoredUsers } from "@/lib/authPermissions";

export interface Tag {
  id: string;
  nome: string;
  slug: string;
  cor: string;
  corBg?: string;
  descricao?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface UserTag {
  id: string;
  userId: string;
  tagId: string;
  criadoEm?: string;
}

export const SEED_TAGS: Tag[] = [
  {
    id: "tag-torre",
    nome: "Torre",
    slug: "torre",
    cor: "#8B5CF6",
    corBg: "rgba(139, 92, 246, 0.15)",
    descricao: "Membros operadores da Central dos Torres",
  },
];

export const SEED_USER_TAGS: UserTag[] = [
  { id: "ut-debora-torre", userId: "usr-1786476388116", tagId: "tag-torre" },
  { id: "ut-xarada-torre", userId: "usr-1786476427231", tagId: "tag-torre" },
  { id: "ut-mazoti-torre", userId: "usr-1786476578880", tagId: "tag-torre" },
];

const STORAGE_KEY_TAGS = "central_hashira_tags_v1";
const STORAGE_KEY_USER_TAGS = "central_hashira_user_tags_v1";

export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

// Fallbacks locais para offline / instant-render
export function getStoredTags(): Tag[] {
  if (typeof window === "undefined") return SEED_TAGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TAGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return SEED_TAGS;
}

export function saveStoredTags(tags: Tag[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(tags));
    window.dispatchEvent(new Event("hashira_tags_updated"));
  } catch (e) {}
}

export function getStoredUserTags(): UserTag[] {
  if (typeof window === "undefined") return SEED_USER_TAGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_TAGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return SEED_USER_TAGS;
}

export function saveStoredUserTags(userTags: UserTag[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_USER_TAGS, JSON.stringify(userTags));
    window.dispatchEvent(new Event("hashira_user_tags_updated"));
  } catch (e) {}
}

// Mapeamento Supabase -> TypeScript
function mapRowToTag(row: any): Tag {
  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    cor: row.cor || "#5B50E5",
    corBg: row.cor_bg || `${row.cor || "#5B50E5"}20`,
    descricao: row.descricao || "",
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

function mapRowToUserTag(row: any): UserTag {
  return {
    id: row.id,
    userId: row.user_id,
    tagId: row.tag_id,
    criadoEm: row.criado_em,
  };
}

// Funções de Consulta e Persistência
export async function fetchTags(): Promise<Tag[]> {
  try {
    const { data, error } = await supabase.from("tags").select("*").order("nome", { ascending: true });
    if (error) {
      console.warn("[TAGS WARN] Falha ao ler tags remotas:", error.message);
      return getStoredTags();
    }
    if (data && data.length > 0) {
      const parsed = data.map(mapRowToTag);
      saveStoredTags(parsed);
      return parsed;
    }
  } catch (e) {
    console.error("[TAGS ERROR] Exceção ao buscar tags:", e);
  }
  return getStoredTags();
}

export async function fetchUserTags(): Promise<UserTag[]> {
  try {
    const { data, error } = await supabase.from("user_tags").select("*");
    if (error) {
      console.warn("[USER_TAGS WARN] Falha ao ler atribuições:", error.message);
      return getStoredUserTags();
    }
    if (data) {
      const parsed = data.map(mapRowToUserTag);
      saveStoredUserTags(parsed);
      return parsed;
    }
  } catch (e) {
    console.error("[USER_TAGS ERROR] Exceção ao buscar user_tags:", e);
  }
  return getStoredUserTags();
}

export async function saveTag(tag: Partial<Tag> & { nome: string }): Promise<Tag | null> {
  const id = tag.id || `tag-${Date.now()}`;
  const slug = tag.slug || slugify(tag.nome);
  const cor = tag.cor || "#5B50E5";
  const corBg = tag.corBg || `${cor}20`;

  const newTag: Tag = {
    id,
    nome: tag.nome.trim(),
    slug,
    cor,
    corBg,
    descricao: tag.descricao?.trim() || "",
    atualizadoEm: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("tags")
      .upsert(
        {
          id: newTag.id,
          nome: newTag.nome,
          slug: newTag.slug,
          cor: newTag.cor,
          cor_bg: newTag.corBg,
          descricao: newTag.descricao,
          atualizado_em: newTag.atualizadoEm,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[TAGS ERROR] Erro ao salvar tag no Supabase:", error.message);
    } else if (data) {
      const saved = mapRowToTag(data);
      const current = getStoredTags().filter((t) => t.id !== saved.id);
      saveStoredTags([...current, saved]);
      notifyRealtimeChange("usuarios");
      return saved;
    }
  } catch (e) {
    console.error("[TAGS ERROR] Exceção ao salvar tag:", e);
  }

  // Fallback local
  const current = getStoredTags().filter((t) => t.id !== newTag.id);
  saveStoredTags([...current, newTag]);
  notifyRealtimeChange("usuarios");
  return newTag;
}

export async function deleteTag(tagId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("tags").delete().eq("id", tagId);
    if (error) {
      console.error("[TAGS ERROR] Erro ao excluir tag:", error.message);
    }
  } catch (e) {
    console.error("[TAGS ERROR] Exceção ao excluir tag:", e);
  }

  // Atualiza cache local
  const currentTags = getStoredTags().filter((t) => t.id !== tagId);
  saveStoredTags(currentTags);
  const currentUserTags = getStoredUserTags().filter((ut) => ut.tagId !== tagId);
  saveStoredUserTags(currentUserTags);

  notifyRealtimeChange("usuarios");
  return true;
}

export async function setUserTags(userId: string, tagIds: string[]): Promise<boolean> {
  try {
    // 1. Remove todas as tags existentes do usuário no Supabase
    await supabase.from("user_tags").delete().eq("user_id", userId);

    // 2. Insere as novas tags se houver
    if (tagIds.length > 0) {
      const rows = tagIds.map((tagId) => ({
        user_id: userId,
        tag_id: tagId,
      }));
      const { error } = await supabase.from("user_tags").insert(rows);
      if (error) {
        console.error("[USER_TAGS ERROR] Erro ao associar tags:", error.message);
      }
    }
  } catch (e) {
    console.error("[USER_TAGS ERROR] Exceção ao atualizar tags do usuário:", e);
  }

  // Atualiza cache local
  const otherUserTags = getStoredUserTags().filter((ut) => ut.userId !== userId);
  const newAssignments: UserTag[] = tagIds.map((tagId) => ({
    id: `ut-${userId}-${tagId}`,
    userId,
    tagId,
    criadoEm: new Date().toISOString(),
  }));
  saveStoredUserTags([...otherUserTags, ...newAssignments]);

  notifyRealtimeChange("usuarios");
  return true;
}

/**
 * Função utilitária central (Gate Checker):
 * Verifica se um usuário possui determinada tag pelo slug ou nome.
 * Reutilizável em qualquer módulo ou rota.
 */
export function userHasTag(
  user: UserAccount | { id?: string; email?: string } | null | undefined,
  tagSlugOrName: string,
  userTagsList?: UserTag[],
  tagsList?: Tag[]
): boolean {
  if (!user || (!user.id && !user.email)) return false;

  const targetSlug = slugify(tagSlugOrName);
  const allTags = tagsList || getStoredTags();
  const allUserTags = userTagsList || getStoredUserTags();

  // Encontra a tag alvo
  const targetTag = allTags.find(
    (t) => t.slug.toLowerCase() === targetSlug || slugify(t.nome) === targetSlug
  );
  if (!targetTag) return false;

  // 1. Verifica se existe relação direta para o userId
  if (user.id) {
    const hasByUserId = allUserTags.some(
      (ut) => ut.userId === user.id && ut.tagId === targetTag.id
    );
    if (hasByUserId) return true;
  }

  // 2. Se não encontrou pelo id direto mas temos e-mail, resolve o ID real pelo cadastro de usuários
  if (user.email) {
    const cleanEmail = user.email.toLowerCase().trim();
    const storedUsers = getStoredUsers();
    const matchedUser = storedUsers.find(
      (u) => u.email && u.email.toLowerCase().trim() === cleanEmail
    );
    if (matchedUser && matchedUser.id !== user.id) {
      const hasByMatchedId = allUserTags.some(
        (ut) => ut.userId === matchedUser.id && ut.tagId === targetTag.id
      );
      if (hasByMatchedId) return true;
    }
  }

  return false;
}

/**
 * Hook React para gerenciamento e sincronização em tempo real das Tags e Atribuições
 */
export function useUserTags() {
  const [tags, setTags] = useState<Tag[]>(getStoredTags);
  const [userTags, setUserTagsState] = useState<UserTag[]>(getStoredUserTags);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [remoteTags, remoteUserTags] = await Promise.all([
        fetchTags(),
        fetchUserTags(),
      ]);
      setTags(remoteTags);
      setUserTagsState(remoteUserTags);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();

    const handleLocalUpdate = () => {
      setTags(getStoredTags());
      setUserTagsState(getStoredUserTags());
    };

    window.addEventListener("hashira_tags_updated", handleLocalUpdate);
    window.addEventListener("hashira_user_tags_updated", handleLocalUpdate);
    window.addEventListener("storage", handleLocalUpdate);

    // Canal Supabase Realtime para tabelas tags e user_tags
    const channel = supabase
      .channel("user-tags-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "tags" }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_tags" }, () => reload())
      .subscribe();

    return () => {
      window.removeEventListener("hashira_tags_updated", handleLocalUpdate);
      window.removeEventListener("hashira_user_tags_updated", handleLocalUpdate);
      window.removeEventListener("storage", handleLocalUpdate);
      supabase.removeChannel(channel);
    };
  }, [reload]);

  const getUserTagsList = useCallback(
    (userId: string): Tag[] => {
      const assignedTagIds = userTags
        .filter((ut) => ut.userId === userId)
        .map((ut) => ut.tagId);
      return tags.filter((t) => assignedTagIds.includes(t.id));
    },
    [tags, userTags]
  );

  const checkUserHasTag = useCallback(
    (user: UserAccount | { id?: string; email?: string } | null | undefined, tagSlug: string) => {
      return userHasTag(user, tagSlug, userTags, tags);
    },
    [userTags, tags]
  );

  return {
    tags,
    userTags,
    loading,
    reload,
    getUserTagsList,
    checkUserHasTag,
    assignTagsToUser: setUserTags,
    saveTag,
    deleteTag,
  };
}
