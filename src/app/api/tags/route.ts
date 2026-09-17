import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { slugify, Tag } from "@/lib/userTagsTypes";

// GET /api/tags - Lista todas as tags e opcionalmente com contagem de membros
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const withCount = searchParams.get("with_count") === "true";

    const { data: tags, error: tagsError } = await supabase
      .from("tags")
      .select("*")
      .order("nome", { ascending: true });

    if (tagsError) {
      return NextResponse.json({ error: tagsError.message }, { status: 500 });
    }

    if (!withCount) {
      return NextResponse.json({ tags });
    }

    const { data: userTags } = await supabase.from("user_tags").select("tag_id");

    const counts: Record<string, number> = {};
    (userTags || []).forEach((ut) => {
      counts[ut.tag_id] = (counts[ut.tag_id] || 0) + 1;
    });

    const enriched = (tags || []).map((t) => ({
      ...t,
      usersCount: counts[t.id] || 0,
    }));

    return NextResponse.json({ tags: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao consultar tags" }, { status: 500 });
  }
}

// POST /api/tags - Cria nova tag
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, cor, descricao } = body;

    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return NextResponse.json({ error: "O nome da tag é obrigatório" }, { status: 400 });
    }

    const cleanNome = nome.trim();
    const slug = slugify(cleanNome);
    const id = `tag-${slug || Date.now()}`;
    const cleanCor = cor || "#5B50E5";
    const corBg = `${cleanCor}20`;

    const { data, error } = await supabase
      .from("tags")
      .insert({
        id,
        nome: cleanNome,
        slug,
        cor: cleanCor,
        cor_bg: corBg,
        descricao: descricao?.trim() || "",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ tag: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao criar tag" }, { status: 500 });
  }
}

// PUT /api/tags - Atualiza tag existente
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nome, cor, descricao } = body;

    if (!id) {
      return NextResponse.json({ error: "O ID da tag é obrigatório" }, { status: 400 });
    }

    const updates: any = {
      atualizado_em: new Date().toISOString(),
    };

    if (nome) {
      updates.nome = nome.trim();
      updates.slug = slugify(nome);
    }
    if (cor) {
      updates.cor = cor;
      updates.cor_bg = `${cor}20`;
    }
    if (descricao !== undefined) {
      updates.descricao = descricao.trim();
    }

    const { data, error } = await supabase
      .from("tags")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ tag: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao atualizar tag" }, { status: 500 });
  }
}

// DELETE /api/tags - Exclui tag
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "O ID da tag é obrigatório" }, { status: 400 });
    }

    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Tag excluída com sucesso" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao excluir tag" }, { status: 500 });
  }
}
