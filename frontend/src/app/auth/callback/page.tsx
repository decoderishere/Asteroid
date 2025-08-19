"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace("/"), 800);
    return () => clearTimeout(t);
  }, [router]);
  return <p style={{ padding: 24 }}>Signing you in…</p>;
}
