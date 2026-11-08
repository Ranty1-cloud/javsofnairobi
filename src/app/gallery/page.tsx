import { db } from "@/lib/db";
import GalleryGrid from "@/components/GalleryGrid";
import { GALLERY_CATS as CATS } from "@/lib/gallery";
import JsonLd from "@/components/JsonLd";
import { pageMeta, webPageLd, breadcrumbLd, graph } from "@/lib/seo";
export const dynamic = "force-dynamic";
const DESC = "Photos and moments from JAVS OF NAIROBI road trips, Nganya culture and Kenyan destinations.";
export const generateMetadata = ({ searchParams }: { searchParams: { c?: string } }) => pageMeta({ title: "Gallery", description: DESC, path: "/gallery", noindex: !!searchParams.c });
export default async function G({ searchParams }: { searchParams: { c?: string } }) {
  const m = await db.galleryMedia.findMany({ where: searchParams.c ? { category: searchParams.c } : {}, orderBy: { createdAt: "desc" }, take: 60 });
  return <div className="wrap"><JsonLd data={graph(webPageLd({ path: "/gallery", name: "Gallery", description: DESC, type: "CollectionPage" }), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Gallery", path: "/gallery" }]))} /><p className="eyebrow">Moments</p><h1 className="disp" style={{ fontSize: "clamp(2.8rem,7vw,5rem)" }}>The <span className="red">Gallery</span></h1>
    <div className="chips"><a href="/gallery" className={`chip ${!searchParams.c ? "on" : ""}`}>All</a>{CATS.map(c => <a key={c} href={`/gallery?c=${encodeURIComponent(c)}`} className={`chip ${searchParams.c === c ? "on" : ""}`}>{c}</a>)}</div>
    {m.length ? <GalleryGrid items={m.map(i => ({ id: i.id, url: i.url, caption: i.caption, category: i.category }))} /> : <div className="empty">No photos yet. Check back soon.</div>}</div>;
}
