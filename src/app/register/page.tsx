import AuthForm from "@/components/AuthForm";
import { safeNext } from "@/lib/safe-next";
export default function P({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNext(searchParams.next);
  return <main className="wrap"><h1>Create account</h1>{next && <p className="mut">An account is required to book a seat. It only takes a minute.</p>}<AuthForm mode="register" next={next} /><p className="mut">Already have an account? <a href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Log in</a></p></main>;
}
