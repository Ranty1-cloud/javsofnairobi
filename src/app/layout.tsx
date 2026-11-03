export const metadata = { title: "JAVS OF NAIROBI", description: "Epic road trips. Hidden gems. Unforgettable memories." };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{ margin: 0, background: "#050505", color: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>{children}</body></html>;
}
