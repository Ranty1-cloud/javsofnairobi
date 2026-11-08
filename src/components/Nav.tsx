"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
const LINKS: [string, string][] = [["Home", "/"], ["Trips", "/trips"], ["Destinations", "/destinations"], ["Nganya Culture", "/nganya"], ["Gallery", "/gallery"], ["Shop", "/shop"], ["About", "/about"], ["Contact", "/support"]];
const wa = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  const on = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <>
      <header className="nav">
        <div className="nav-in">
          <Link href="/" className="logo-img" aria-label="JAVS OF NAIROBI home">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/icons/icon-192.png" width={48} height={48} alt="JAVS OF NAIROBI" /></Link>
          <nav className="nav-links" aria-label="Main">{LINKS.map(([n, h]) => <Link key={h} href={h} className={on(h) ? "on" : ""}>{n}</Link>)}</nav>
          <form className="nav-search" action="/trips" role="search"><input name="q" placeholder="Search trips" aria-label="Search trips" /></form>
          {wa && <a className="btn ghost sm nav-cta" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp</a>}
          <Link className="btn sm nav-cta" href="/trips">Book a Seat</Link>
          <Link href="/account" className="nav-cta mut" style={{ fontSize: ".85rem" }}>Account</Link>
          <button className="burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "✕" : "☰"}</button>
        </div>
      </header>
      {open && <div className="drawer" role="dialog" aria-label="Menu">
        <form action="/trips" role="search"><input name="q" placeholder="Search trips" aria-label="Search trips" /></form>
        {LINKS.map(([n, h]) => <Link key={h} href={h}>{n}</Link>)}
        <Link href="/news">News &amp; Stories</Link><Link href="/account">Account &amp; My Bookings</Link>
      </div>}
      <div className="sticky-cta">
        <Link className="btn" href="/trips">Book a Seat</Link>
        {wa && <a className="btn ghost" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" aria-label="WhatsApp support">WhatsApp</a>}
      </div>
    </>
  );
}
