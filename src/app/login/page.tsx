import AuthForm from "@/components/AuthForm";
const safe = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "");
export const metadata = { title: "Log in", robots: { index: false } };
export default function P({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  const next = safe(searchParams.next), q = next ? `?next=${encodeURIComponent(next)}` : "";
  return <main className="wrap"><h1>Log in</h1>
    {next && <p className="note" role="status">Log in to continue. You need an account to book seats and see your tickets.</p>}
    {searchParams.error === "link" && <p role="alert" style={{ color: "#E50914" }}>That email link is invalid or has expired. Log in, or request a new one.</p>}
    <AuthForm mode="login" /><p className="mut"><a href={`/register${q}`}>Create an account</a> · <a href="/forgot">Forgot password?</a></p></main>;
}
