import type { ReactNode } from "react";
import ShopBar from "@/components/ShopBar";
export default function ShopLayout({ children }: { children: ReactNode }) {
  return <main className="wrap"><ShopBar />{children}</main>;
}
