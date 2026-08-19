"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPermissoesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/configuracoes?tab=acessos");
  }, [router]);

  return null;
}
