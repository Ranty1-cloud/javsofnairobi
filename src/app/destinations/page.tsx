import Link from "next/link";
import { db } from "@/lib/db";
import JsonLd from "@/components/JsonLd";
import { pageMeta, webPageLd, breadcrumbLd, graph } from "@/lib/seo";
export const revalidate = 60;
const DESC = "Kenyan destinations worth the drive: guides with travel time from Nairobi, budget notes, activities and tips, plus the upcoming trips going there.";
export const metadata = pageMeta({ title: "Destinations", description: DESC, path: "/destinations" });
export default async function D() {
  const d = await db.destination.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { trips: { where: { published: true, departsAt: { gt: new Date() } } } } } } });
  return <div className="wrap"><JsonLd data={graph(webPageLd({ path: "/destinations", name: "Destinations", description: DESC, type: "CollectionPage" }), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Destinations", path: "/destinations" }]))} /><p className="eyebrow">Explore Kenya</p><h1 className="disp" style={{ fontSize: "clamp(2.8rem,7vw,5rem)" }}>Desti<span className="red">nations</span></h1>
    <div className="grid">{d.map(x => <Link key={x.id} className="card" href={`/destinations/${x.slug}`} style={{ padding: 0, overflow: "hidden" }}>{x.imageUrl ? <img src={x.imageUrl} alt="" loading="lazy" style={{ aspectRatio: "4/3", objectFit: "cover", width: "100%" }} /> : <div className="tcard-ph" style={{ position: "static", aspectRatio: "4/3", background: "var(--elev)" }}>{x.name}</div>}
      <div style={{ padding: 20 }}><h3 style={{ margin: 0 }}>{x.name}</h3><p className="mut" style={{ margin: "6px 0" }}>{x.region}{x.region && x.travelTime && " · "}{x.travelTime}</p><span className="badge">{x._count.trips} upcoming {x._count.trips === 1 ? "trip" : "trips"}</span></div></Link>)}
      {!d.length && <div className="empty">No destinations yet.</div>}</div></div>;
}
