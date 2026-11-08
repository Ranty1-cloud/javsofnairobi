import Script from "next/script";
// Google Analytics 4 loads only when NEXT_PUBLIC_GA_ID (like G-XXXXXXXXXX) is set. Nothing loads otherwise.
const ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
export default function Analytics() {
  if (!/^G-[A-Z0-9]{4,}$/.test(ID)) return null;
  return (<>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${ID}`} strategy="afterInteractive" />
    <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ID}');`}</Script>
  </>);
}
