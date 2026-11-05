import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import HeroEditor from "@/components/HeroEditor";
export const metadata = { title: "Homepage", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Site() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"]))) redirect("/");
  const hero = await db.siteSetting.findUnique({ where: { key: "heroImage" } });
  return <main className="wrap"><h1>Homepage</h1><HeroEditor current={hero?.value ?? null} /></main>;
}
