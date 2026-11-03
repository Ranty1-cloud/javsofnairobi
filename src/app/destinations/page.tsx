import Link from "next/link";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function D() {
  const d = await db.destination.findMany({ orderBy: { name: "asc" } });
  return <main className="wrap"><h1>Destinations</h1><div className="grid">{d.map(x => <Link key={x.id} className="card" href={`/destinations/${x.slug}`}><h3>{x.name}</h3><p className="mut">{x.description}</p></Link>)}{!d.length && <p className="mut">No destinations yet.</p>}</div></main>;
}
