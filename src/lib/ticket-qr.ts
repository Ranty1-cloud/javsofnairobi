import QRCode from "qrcode";
// Styled QR: round dots, rounded corner "eyes" with a red centre, and a small J badge in the middle.
// Error correction is level H (30% recoverable), so the badge and the styling never stop phones or the scanner reading it.
// The code carries only the opaque ticket token, never passenger data.
export const QUIET = 2;
export function qrLayout(token: string) {
  const q = QRCode.create(token, { errorCorrectionLevel: "H" });
  const n = q.modules.size, mid = (n - 1) / 2, half = n >= 29 ? 3 : 0;
  const inEye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const dots: [number, number][] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!q.modules.get(r, c) || inEye(r, c)) continue;
    if (half && Math.abs(r - mid) <= half && Math.abs(c - mid) <= half) continue;
    dots.push([r, c]);
  }
  const eyes: [number, number][] = [[0, 0], [0, n - 7], [n - 7, 0]];
  return { n, mid, half, dots, eyes, total: n + QUIET * 2 };
}
const rr = (x: number, y: number, w: number, r: number) => `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="${r}"/>`;
export function qrSvg(token: string, o: { fg?: string; accent?: string; bg?: string } = {}) {
  const { fg = "#0a0a0a", accent = "#E50914", bg = "#ffffff" } = o, L = qrLayout(token), m = QUIET;
  const dots = L.dots.map(([r, c]) => `<circle cx="${c + m + 0.5}" cy="${r + m + 0.5}" r="0.47"/>`).join("");
  const eyes = L.eyes.map(([r, c]) => `<g transform="translate(${c + m} ${r + m})"><g fill="${fg}">${rr(0, 0, 7, 2)}</g><g fill="${bg}">${rr(1, 1, 5, 1.4)}</g><g fill="${accent}">${rr(2, 2, 3, 0.9)}</g></g>`).join("");
  const cx = L.mid + m + 0.5;
  const badge = L.half ? `<circle cx="${cx}" cy="${cx}" r="3.2" fill="${bg}"/><circle cx="${cx}" cy="${cx}" r="2.7" fill="${accent}"/><text x="${cx}" y="${cx + 1.2}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="3.4" fill="#fff">J</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.total} ${L.total}" shape-rendering="geometricPrecision" role="img" aria-label="Ticket QR code"><rect width="${L.total}" height="${L.total}" fill="${bg}"/><g fill="${fg}">${dots}</g>${eyes}${badge}</svg>`;
}
