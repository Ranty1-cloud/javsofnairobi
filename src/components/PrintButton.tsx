"use client";
import { useEffect } from "react";
// Opens the print dialog on its own when the page is opened with ?print=1.
export default function PrintButton() {
  useEffect(() => { if (new URLSearchParams(window.location.search).get("print") === "1") setTimeout(() => window.print(), 500); }, []);
  return <button onClick={() => window.print()} className="btn ghost no-print">Print ticket</button>;
}
