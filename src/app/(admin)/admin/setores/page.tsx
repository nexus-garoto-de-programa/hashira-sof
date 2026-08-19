"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSetoresPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/configuracoes?tab=setores");
  }, [router]);

  return null;
}
