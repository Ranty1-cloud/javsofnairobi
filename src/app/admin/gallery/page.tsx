import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import GalleryManager from "@/components/GalleryManager";
export const metadata = { title: "Gallery", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function AdminGallery() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"]))) redirect("/admin");
  const rows = await db.galleryMedia.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Content</p><h1>The <span className="red">gallery</span></h1><p className="mut" style={{ margin: 0 }}>Upload, sort and remove the photos on the Gallery page. Changes are live straight away.</p></div><div className="adm-tools"><Link className="btn sm ghost" href="/gallery" target="_blank">View gallery ↗</Link></div></header>
      <GalleryManager photos={rows.map(r => ({ id: r.id, url: r.url, caption: r.caption, category: r.category }))} />
    </main>
  );
}
