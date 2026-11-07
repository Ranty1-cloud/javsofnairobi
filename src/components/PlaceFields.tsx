"use client";
import { useState } from "react";
import { COUNTIES, COUNTY_NAMES } from "@/lib/kenya";
// County (all 47) plus an optional town. Towns are suggestions only, so any place can be typed.
export default function PlaceFields({ county: c0 = "", town: t0 = "", required = true }: { county?: string; town?: string; required?: boolean }) {
  const [county, setCounty] = useState(c0), [town, setTown] = useState(t0);
  const list = `towns-${county || "none"}`;
  return (
    <>
      <label htmlFor="pf-county">County</label>
      <select id="pf-county" name="county" value={county} onChange={e => { setCounty(e.target.value); setTown(""); }} required={required}>
        <option value="">Choose a county</option>{COUNTY_NAMES.map(c => <option key={c}>{c}</option>)}
      </select>
      <label htmlFor="pf-town">Town or place <span className="mut">(optional)</span></label>
      <input id="pf-town" name="town" value={town} onChange={e => setTown(e.target.value)} list={list} maxLength={80} placeholder={county ? "e.g. " + (COUNTIES[county]?.[0] ?? "") : "Pick a county first"} disabled={!county} autoComplete="off" />
      <datalist id={list}>{(COUNTIES[county] ?? []).map(t => <option key={t} value={t} />)}</datalist>
    </>
  );
}
