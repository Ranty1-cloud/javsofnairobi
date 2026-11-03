const TZ = "Africa/Nairobi";
export const fmtDate = (d: Date) => d.toLocaleDateString("en-KE", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" });
export const fmtTime = (d: Date) => d.toLocaleTimeString("en-KE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
export const fmtDateTime = (d: Date) => `${fmtDate(d)} · ${fmtTime(d)}`;
export const ksh = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;
export const TYPE_LABEL: Record<string, string> = { DAY: "Day trip", OVERNIGHT: "Overnight", WEEKEND: "Weekend" };
export const readMins = (body: string) => Math.max(1, Math.round(body.split(/\s+/).length / 200));
export const site = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
