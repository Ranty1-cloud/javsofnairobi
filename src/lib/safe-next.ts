// Only same-site paths may be used as a post-login destination, so a crafted link can't bounce someone to another site.
// Backslashes are rejected because browsers treat "/\host" like "//host".
export function safeNext(v: unknown): string | undefined {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") && v.length < 300 ? v : undefined;
}
