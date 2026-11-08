import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { pageMeta, webPageLd, breadcrumbLd, graph } from "@/lib/seo";
// Describes what the site actually collects, from the database schema and the booking, payment, account and contact forms.
// If a new feature collects more data, update this list in the same change.
const DESC = "What personal data JAVS OF NAIROBI collects when you create an account, book a trip, order merchandise or contact us, why we collect it, and who processes it.";
export const metadata = pageMeta({ title: "Privacy", description: DESC, path: "/privacy" });
const GA = /^G-[A-Z0-9]{4,}$/.test(process.env.NEXT_PUBLIC_GA_ID ?? "");
export default function Privacy() {
  return (
    <div className="wrap narrow prose">
      <JsonLd data={graph(webPageLd({ path: "/privacy", name: "Privacy", description: DESC }), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Privacy", path: "/privacy" }]))} />
      <p className="eyebrow">Privacy</p>
      <h1 className="disp" style={{ fontSize: "clamp(2.6rem,7vw,4.5rem)" }}>Your <span className="red">data</span></h1>
      <p>This page explains what JAVS OF NAIROBI collects through this website, why, and who helps us handle it. We collect only what we need to run trips, orders and the account area.</p>

      <h2>What we collect and why</h2>
      <ul>
        <li><b>Account:</b> your name, email address and, if you give it, your phone number. Used to sign you in, hold your bookings and show your tickets. Your password is handled by our sign-in provider; we do not see it.</li>
        <li><b>Bookings:</b> the trip, seats, the name of each passenger, your phone number and email, and whether you want tickets sent on WhatsApp. Used to reserve seats, issue tickets and contact you about your trip.</li>
        <li><b>Payments:</b> the M-Pesa confirmation code and the name on your M-Pesa account that you enter, and the amount. Used so our team can match your payment to your booking or order. You enter your M-Pesa PIN only in your own M-Pesa app. We never ask for it.</li>
        <li><b>Merchandise orders:</b> your name, phone number and, for delivery, your address.</li>
        <li><b>Waitlists, newsletter, comments, reviews and submissions:</b> the contact detail or name you type into those forms, and your message. Comments and reviews are checked before they appear.</li>
      </ul>

      <h2>Who processes data for us</h2>
      <p>We use service providers to run the site: a database and sign-in provider (Supabase), website hosting (Vercel) and an email delivery service for tickets and account emails. M-Pesa payments are made in your own M-Pesa app through Safaricom. We do not sell your personal data.</p>

      <h2>Cookies</h2>
      <p>We use cookies that keep you signed in. They are needed for the account area to work. {GA ? "We also use Google Analytics to see, in aggregate, how the site is used." : "We do not run advertising or analytics cookies."}</p>

      <h2>Your choices</h2>
      <p>To see, correct or delete the details we hold about you, or to stop receiving emails, contact us through <Link className="red" href="/support">Support</Link>. Bookings and payment records may need to be kept so we can reconcile payments.</p>
    </div>
  );
}
