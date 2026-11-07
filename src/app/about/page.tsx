import Link from "next/link";
export const metadata = { title: "About Us" };
export default function About() {
  return <div className="wrap narrow prose"><p className="eyebrow">About</p><h1 className="disp" style={{ fontSize: "clamp(3rem,8vw,5.5rem)" }}>More than a <span className="red">booking site</span></h1>
    <p>JAVS OF NAIROBI organises road trips, destination experiences and Nganya culture events out of Nairobi. We care about three things: safe, well-organised travel; the creativity of Kenyan matatu culture; and the friendships made on the road.</p>
    <p><Link className="btn" href="/trips">See upcoming trips</Link> <Link className="btn ghost" href="/support">Contact us</Link></p></div>;
}
