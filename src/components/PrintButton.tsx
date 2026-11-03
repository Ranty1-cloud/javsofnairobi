"use client";
export default function PrintButton() {
  return <button onClick={() => window.print()} className="no-print" style={{ marginTop: 16, padding: "12px 20px", background: "#E50914", color: "#fff", border: 0, borderRadius: 8 }}>Download PDF (Print → Save as PDF)</button>;
}
