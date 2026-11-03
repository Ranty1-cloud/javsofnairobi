"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function AutoRefresh({ active }: { active: boolean }) {
  const r = useRouter();
  useEffect(() => { if (!active) return; const i = setInterval(() => r.refresh(), 4000); return () => clearInterval(i); }, [active, r]);
  return null;
}
