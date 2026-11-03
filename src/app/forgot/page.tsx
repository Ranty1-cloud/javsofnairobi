import { ForgotForm } from "@/components/PasswordForms";
export const metadata = { title: "Forgot password", robots: { index: false } };
export default function P() { return <main className="wrap narrow"><h1>Forgot <span className="red">password</span></h1><p className="mut">Enter your account email and we&apos;ll send you a reset link.</p><ForgotForm /><p className="mut"><a href="/login">Back to log in</a></p></main>; }
