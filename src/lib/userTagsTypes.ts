export interface Tag {
  id: string;
  nome: string;
  slug: string;
  cor: string;
  descricao?: string;
  created_at?: string;
  usersCount?: number;
}

export interface UserTag {
  id: string;
  user_id: string;
  tag_id: string;
  assigned_at?: string;
  tag?: Tag;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}
