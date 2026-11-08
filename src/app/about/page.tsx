import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { pageMeta, webPageLd, breadcrumbLd, graph, ORG_DESCRIPTION } from "@/lib/seo";
const DESC = "About JAVS OF NAIROBI: road trips, destination experiences and Nganya culture events out of Nairobi, Kenya, with online seat booking and M-Pesa payment.";
export const metadata = pageMeta({ title: "About Us", description: DESC, path: "/about" });
export default function About() {
  return <div className="wrap narrow prose"><JsonLd data={graph(webPageLd({ path: "/about", name: "About JAVS OF NAIROBI", description: ORG_DESCRIPTION, type: "AboutPage" }), breadcrumbLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }]))} />
    <p className="eyebrow">About</p><h1 className="disp" style={{ fontSize: "clamp(3rem,8vw,5.5rem)" }}>More than a <span className="red">booking site</span></h1>
    <p>JAVS OF NAIROBI organises road trips, destination experiences and Nganya culture events out of Nairobi. We care about three things: safe, well-organised travel; the creativity of Kenyan matatu culture; and the friendships made on the road.</p>
    <h2>What we do</h2>
    <ul>
      <li><b>Trips and events.</b> Scheduled departures from Nairobi with a stated meeting point, price and live seat availability. <Link className="red" href="/trips">See upcoming trips</Link>.</li>
      <li><b>Destination guides.</b> Places across Kenya, with travel time from Nairobi, budget notes, activities and tips. <Link className="red" href="/destinations">Browse destinations</Link>.</li>
      <li><b>Nganya culture.</b> Showcases of customised matatus and their crews, plus news, events and photos. <Link className="red" href="/nganya">Explore Nganya culture</Link>.</li>
      <li><b>News and stories.</b> Travel updates and Nganya news, each with its author and date. <Link className="red" href="/news">Read the latest</Link>.</li>
      <li><b>Official merchandise.</b> Kiburi Nation and Javs of Nairobi gear. <Link className="red" href="/shop">Visit the shop</Link>.</li>
    </ul>
    <h2>How booking works</h2>
    <p>Create an account, pick a trip, choose your seats and pay with M-Pesa. Every step is explained on <Link className="red" href="/how-to-book">How to book</Link>.</p>
    <p><Link className="btn" href="/trips">See upcoming trips</Link> <Link className="btn ghost" href="/support">Contact us</Link></p></div>;
}
