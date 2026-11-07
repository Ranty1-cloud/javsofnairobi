import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { deliveryFee } from "@/lib/shop";
import CartCheckout from "@/components/CartCheckout";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your bag", robots: { index: false } };
export default async function Cart() {
  const s = await getSession();
  const [u, fee] = await Promise.all([s ? db.user.findUnique({ where: { id: s.userId }, select: { name: true, phone: true } }) : null, deliveryFee()]);
  return (
    <>
      <h1>Your <span className="red">bag</span></h1>
      <CartCheckout signedIn={!!s} defaultName={u?.name ?? ""} defaultPhone={u?.phone ?? ""} deliveryFee={fee} />
    </>
  );
}
