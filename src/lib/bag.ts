"use client";
import { useEffect, useState } from "react";
import { MAX_QTY } from "./shop-constants";

// The shopping bag lives in this browser only (localStorage). Prices and stock are re-checked on the server when the order is placed.
export type BagItem = { variantId: string; slug: string; name: string; color: string; size: string; unitKes: number; qty: number; imageUrl: string | null; max: number };
const KEY = "javs-bag", EVT = "javs-bag";
const ok = (i: unknown): i is BagItem => !!i && typeof i === "object" && typeof (i as BagItem).variantId === "string" && typeof (i as BagItem).qty === "number" && typeof (i as BagItem).unitKes === "number";
export function readBag(): BagItem[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v.filter(ok) : []; } catch { return []; }
}
export function writeBag(items: BagItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* private mode: the bag just won't persist */ }
  window.dispatchEvent(new Event(EVT));
}
export function addToBag(item: BagItem) {
  const bag = readBag(), cap = Math.min(item.max, MAX_QTY), at = bag.findIndex(b => b.variantId === item.variantId);
  if (at >= 0) bag[at] = { ...bag[at], ...item, qty: Math.min(cap, bag[at].qty + item.qty) };
  else bag.push({ ...item, qty: Math.min(cap, item.qty) });
  writeBag(bag);
}
// Returns the bag and whether it has been read yet (false during server render, so pages don't flash an empty bag).
export function useBag(): [BagItem[], boolean] {
  const [bag, setBag] = useState<BagItem[]>([]), [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => { setBag(readBag()); setReady(true); };
    read(); window.addEventListener(EVT, read); window.addEventListener("storage", read);
    return () => { window.removeEventListener(EVT, read); window.removeEventListener("storage", read); };
  }, []);
  return [bag, ready];
}
