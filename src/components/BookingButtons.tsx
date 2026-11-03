"use client";
import { useRouter } from "next/navigation";
export function CancelButton({ id }: { id: string }) {
  const r = useRouter();
  return <button className="btn" style={{ background: "#171717" }} onClick={async () => { const x = await fetch("/api/bookings/cancel", { method: "POST", body: JSON.stringify({ id }) }); if (!x.ok) alert((await x.json()).error); r.refresh(); }}>Cancel booking</button>;
}
export function LogoutButton() {
  return <button className="btn" style={{ background: "#171717" }} onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }}>Log out</button>;
}
