// Dependency-free SVG charts. Server components: no client JS shipped, which matters on slow connections.
// Colours come from CSS variables so the charts follow the site theme.
import type { Point } from "@/lib/admin-stats";

const short = (k: string) => { const [, m, d] = k.split("-"); return `${Number(d)}/${Number(m)}`; };
const compact = (n: number) => n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${+(n / 1_000).toFixed(1)}k` : String(Math.round(n));
const niceMax = (v: number) => { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };

export function Delta({ now, prev, invert = false }: { now: number; prev: number; invert?: boolean }) {
  if (!prev && !now) return <span className="delta flat">no data yet</span>;
  if (!prev) return <span className="delta up">new</span>;
  const pct = Math.round(((now - prev) / prev) * 100);
  const good = invert ? pct <= 0 : pct >= 0;
  return <span className={`delta ${pct === 0 ? "flat" : good ? "up" : "down"}`}>{pct > 0 ? "▲" : pct < 0 ? "▼" : "•"} {Math.abs(pct)}% vs previous</span>;
}

export function Spark({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(...values, 1), w = 120, h = 34;
  const pts = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * w},${h - 3 - (v / max) * (h - 8)}`).join(" ");
  return <svg className="spark" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} preserveAspectRatio="none"><polyline points={pts} fill="none" stroke="var(--red)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>;
}

export function AreaChart({ data, fmt = (n: number) => String(n), label }: { data: Point[]; fmt?: (n: number) => string; label: string }) {
  const W = 720, H = 240, L = 46, R = 12, T = 12, B = 28;
  const max = niceMax(Math.max(...data.map(d => d.value), 0)), iw = W - L - R, ih = H - T - B;
  const x = (i: number) => L + (i / Math.max(data.length - 1, 1)) * iw, y = (v: number) => T + ih - (v / max) * ih;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${T + ih} L${L},${T + ih} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1], step = Math.max(1, Math.ceil(data.length / 7));
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}. Total ${fmt(total)}.`}>
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--red)" stopOpacity=".38" /><stop offset="1" stopColor="var(--red)" stopOpacity="0" /></linearGradient></defs>
      {ticks.map(t => <g key={t}><line x1={L} x2={W - R} y1={y(max * t)} y2={y(max * t)} stroke="var(--line)" strokeDasharray={t ? "3 5" : undefined} /><text x={L - 8} y={y(max * t) + 4} textAnchor="end" className="ax">{compact(max * t)}</text></g>)}
      {data.some(d => d.value) && <><path d={area} fill="url(#ag)" /><path d={line} fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /></>}
      {data.map((d, i) => <g key={d.label} className="pt"><rect x={x(i) - iw / data.length / 2} y={T} width={iw / data.length} height={ih} fill="transparent" /><circle cx={x(i)} cy={y(d.value)} r="4" fill="var(--black)" stroke="var(--red)" strokeWidth="2" /><title>{`${short(d.label)}: ${fmt(d.value)}`}</title></g>)}
      {data.map((d, i) => i % step === 0 || i === data.length - 1 ? <text key={d.label} x={x(i)} y={H - 8} textAnchor="middle" className="ax">{short(d.label)}</text> : null)}
      {!data.some(d => d.value) && <text x={W / 2} y={H / 2} textAnchor="middle" className="ax">Nothing recorded in this period yet</text>}
    </svg>
  );
}

export function Columns({ data, label, color = "var(--red)" }: { data: Point[]; label: string; color?: string }) {
  const W = 720, H = 180, L = 30, R = 8, T = 10, B = 24;
  const max = niceMax(Math.max(...data.map(d => d.value), 0)), iw = W - L - R, ih = H - T - B, bw = iw / data.length;
  const step = Math.max(1, Math.ceil(data.length / 7));
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}. Total ${data.reduce((a, d) => a + d.value, 0)}.`}>
      {[0, 0.5, 1].map(t => <g key={t}><line x1={L} x2={W - R} y1={T + ih - ih * t} y2={T + ih - ih * t} stroke="var(--line)" strokeDasharray={t ? "3 5" : undefined} /><text x={L - 6} y={T + ih - ih * t + 4} textAnchor="end" className="ax">{compact(max * t)}</text></g>)}
      {data.map((d, i) => { const h = (d.value / max) * ih; return <g key={d.label}><rect x={L + i * bw + bw * 0.18} y={T + ih - h} width={bw * 0.64} height={Math.max(h, d.value ? 2 : 0)} rx="3" fill={color}><title>{`${short(d.label)}: ${d.value}`}</title></rect>{(i % step === 0 || i === data.length - 1) && <text x={L + i * bw + bw / 2} y={H - 7} textAnchor="middle" className="ax">{short(d.label)}</text>}</g>; })}
    </svg>
  );
}

export type Slice = { label: string; value: number; color: string };
export function Donut({ slices, center, sub }: { slices: Slice[]; center: string; sub: string }) {
  const total = slices.reduce((a, s) => a + s.value, 0), r = 52, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 140 140" role="img" aria-label={`${sub}: ${slices.map(s => `${s.label} ${s.value}`).join(", ") || "no data"}`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--elev)" strokeWidth="16" />
        {total > 0 && slices.filter(s => s.value > 0).map(s => { const len = (s.value / total) * c, el = <circle key={s.label} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="16" strokeDasharray={`${Math.max(len - 2, 0)} ${c}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)"><title>{`${s.label}: ${s.value}`}</title></circle>; acc += len; return el; })}
        <text x="70" y="68" textAnchor="middle" className="dn">{center}</text><text x="70" y="86" textAnchor="middle" className="ds">{sub}</text>
      </svg>
      <ul className="legend-list">{slices.map(s => <li key={s.label}><i style={{ background: s.color }} />{s.label}<b>{s.value}</b></li>)}</ul>
    </div>
  );
}

export function HBars({ items, fmt = (n: number) => String(n), empty }: { items: { label: string; value: number; note?: string }[]; fmt?: (n: number) => string; empty: string }) {
  if (!items.length) return <p className="mut">{empty}</p>;
  const max = Math.max(...items.map(i => i.value), 1);
  return <ul className="hbars">{items.map(i => <li key={i.label}><div className="hb-top"><span>{i.label}</span><b>{fmt(i.value)}</b></div><div className="hb-track" role="presentation"><div className="hb-fill" style={{ width: `${Math.max((i.value / max) * 100, 2)}%` }} /></div>{i.note && <small className="mut">{i.note}</small>}</li>)}</ul>;
}

export function Meter({ pct, held = 0, label }: { pct: number; held?: number; label: string }) {
  return <div className="meter" role="img" aria-label={`${label}: ${pct}% booked`}><div className="m-fill" style={{ width: `${pct}%` }} />{held > 0 && <div className="m-held" style={{ width: `${Math.min(held, 100 - pct)}%` }} />}</div>;
}
