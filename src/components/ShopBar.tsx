"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBag } from "@/lib/bag";
export default function ShopBar() {
  const path = usePathname(), [bag] = useBag(), n = bag.reduce((s, i) => s + i.qty, 0);
  const on = (p: string) => (path === p ? "on" : "");
  return <nav className="shopbar" aria-label="Shop"><Link href="/shop" className={on("/shop")}>Shop</Link><Link href="/shop/cart" className={on("/shop/cart")}>Bag{n > 0 ? ` (${n})` : ""}</Link><Link href="/shop/orders" className={path.startsWith("/shop/orders") ? "on" : ""}>My orders</Link></nav>;
}
