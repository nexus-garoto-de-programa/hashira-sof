"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminColaboradoresPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/configuracoes?tab=equipe");
  }, [router]);

  return null;
}
