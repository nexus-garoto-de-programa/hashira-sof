import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/tags/assign?userId=... - Retorna as tags atribuídas a um usuário
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      // Se não informar userId, retorna todas as atribuições agrupadas
      const { data, error } = await supabase.from("user_tags").select("*, tag:tags(*)");
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ assignments: data });
    }

    const { data, error } = await supabase
      .from("user_tags")
      .select("tag_id, tag:tags(*)")
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tags: data?.map((d: any) => d.tag) || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao buscar tags do usuário" }, { status: 500 });
  }
}

// POST /api/tags/assign - Atualiza ou adiciona/remove tags de um usuário
// Body: { userId: string, tagIds: string[] } ou { userId: string, tagId: string, action: 'add' | 'remove' }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, tagIds, tagId, action } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    // Modo 1: Ação única (add ou remove)
    if (tagId && action) {
      if (action === "add") {
        const { data, error } = await supabase
          .from("user_tags")
          .upsert({ user_id: userId, tag_id: tagId }, { onConflict: "user_id,tag_id" })
          .select()
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, assignment: data });
      } else if (action === "remove") {
        const { error } = await supabase
          .from("user_tags")
          .delete()
          .match({ user_id: userId, tag_id: tagId });

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, message: "Tag removida com sucesso" });
      }
    }

    // Modo 2: Definir conjunto completo de tags
    if (Array.isArray(tagIds)) {
      // 1. Remove antigas
      await supabase.from("user_tags").delete().eq("user_id", userId);

      // 2. Insere novas
      if (tagIds.length > 0) {
        const rows = tagIds.map((tId: string) => ({
          user_id: userId,
          tag_id: tId,
        }));
        const { error: insertError } = await supabase.from("user_tags").insert(rows);
        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 400 });
        }
      }

      return NextResponse.json({ success: true, count: tagIds.length });
    }

    return NextResponse.json(
      { error: "Informe tagIds (array) ou tagId com action ('add' | 'remove')" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao atribuir tags" }, { status: 500 });
  }
}
