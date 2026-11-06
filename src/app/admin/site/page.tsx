import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { readHero, ROLES_HERO } from "@/lib/hero";
import HeroEditor from "@/components/HeroEditor";
export const metadata = { title: "Homepage photo", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Site() {
  if (!(await requireRole([...ROLES_HERO]))) redirect("/");
  const { active, library } = await readHero();
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Content</p><h1>Homepage <span className="red">photo</span></h1><p className="mut" style={{ margin: 0 }}>Upload, preview and switch the big photo on the homepage. Changes go live immediately, no code needed.</p></div></header>
      <HeroEditor active={active} library={library} />
    </main>
  );
}
