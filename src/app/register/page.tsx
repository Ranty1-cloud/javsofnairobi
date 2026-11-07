import AuthForm from "@/components/AuthForm";
const safe = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "");
export const metadata = { title: "Create account", robots: { index: false } };
export default function P({ searchParams }: { searchParams: { next?: string } }) {
  const next = safe(searchParams.next), q = next ? `?next=${encodeURIComponent(next)}` : "";
  return <main className="wrap"><h1>Create account</h1><p className="mut">A free account lets you book seats and keeps all your tickets in one place.</p><AuthForm mode="register" /><p className="mut">Already have an account? <a href={`/login${q}`}>Log in</a></p></main>;
}
