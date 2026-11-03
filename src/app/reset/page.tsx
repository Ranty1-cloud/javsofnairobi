import { ResetForm } from "@/components/PasswordForms";
// The token is in the URL, so keep it out of Referer headers and search results.
export const metadata = { title: "Choose a new password", referrer: "no-referrer", robots: { index: false } };
export default function P({ searchParams }: { searchParams: { token?: string } }) {
  const t = searchParams.token ?? "";
  return <main className="wrap narrow"><h1>New <span className="red">password</span></h1>{t.length >= 20 ? <ResetForm token={t} /> : <p className="mut">This link is incomplete. <a className="red" href="/forgot">Request a new one</a>.</p>}</main>;
}
