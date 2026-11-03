import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function G({ searchParams }: { searchParams: { c?: string } }) {
  const m = await db.galleryMedia.findMany({ where: searchParams.c ? { category: searchParams.c } : {}, orderBy: { createdAt: "desc" }, take: 60 });
  return <main className="wrap"><h1>Gallery</h1><p>{["Road Trips", "Nganya Culture", "Destinations", "Night Adventures", "Community", "Events"].map(c => <a key={c} href={`/gallery?c=${encodeURIComponent(c)}`} className="mut" style={{ marginRight: 14 }}>{c}</a>)}<a href="/gallery">All</a></p>
    <div style={{ columnWidth: 260, columnGap: 12 }}>{m.map(i => <figure key={i.id} style={{ margin: "0 0 12px" }}><img src={i.url} alt={i.caption || i.category} loading="lazy" style={{ width: "100%", borderRadius: 12 }} /></figure>)}</div>
    {!m.length && <p className="mut">Photos from real JAVS trips will appear here.</p>}</main>;
}
