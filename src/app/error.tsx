"use client";
import Link from "next/link";
// Friendly 500 page. Next sends the real error status, so search engines never index it.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="wrap narrow" style={{ textAlign: "center" }}><p className="eyebrow">Something broke</p><h1 className="disp" style={{ fontSize: "4rem" }}>Engine <span className="red">trouble</span></h1><p className="mut">We hit a problem loading this page. Try again, or head back to the trips.</p><p><button className="btn" onClick={reset}>Try again</button> <Link className="btn ghost" href="/trips">Browse trips</Link></p></div>;
}
