"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminTagsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/configuracoes?tab=tags");
  }, [router]);

  return null;
}
