import AuthForm from "@/components/AuthForm";
export default function P({ searchParams }: { searchParams: { error?: string } }) {
  return <main className="wrap"><h1>Log in</h1>{searchParams.error === "link" && <p role="alert" style={{ color: "#E50914" }}>That email link is invalid or has expired. Log in, or request a new one.</p>}<AuthForm mode="login" /><p className="mut"><a href="/register">Create an account</a> · <a href="/forgot">Forgot password?</a></p></main>;
}
