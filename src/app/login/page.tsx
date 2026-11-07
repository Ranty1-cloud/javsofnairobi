import AuthForm from "@/components/AuthForm";
import { safeNext } from "@/lib/safe-next";
export default function P({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  const next = safeNext(searchParams.next), q = next ? `?next=${encodeURIComponent(next)}` : "";
  return <main className="wrap"><h1>Log in</h1>{next && <p className="mut">Log in to continue your booking. An account is required to book.</p>}{searchParams.error === "link" && <p role="alert" style={{ color: "#E50914" }}>That email link is invalid or has expired. Log in, or request a new one.</p>}<AuthForm mode="login" next={next} /><p className="mut"><a href={`/register${q}`}>Create an account</a> · <a href="/forgot">Forgot password?</a></p></main>;
}
