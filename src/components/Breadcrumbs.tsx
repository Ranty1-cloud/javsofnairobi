import Link from "next/link";
// Visible breadcrumb trail. The matching BreadcrumbList data is added by the page's own JSON-LD graph.
export default function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>{items.map((it, i) => <li key={it.path}>{i < items.length - 1 ? <Link href={it.path}>{it.name}</Link> : <span aria-current="page">{it.name}</span>}</li>)}</ol>
    </nav>
  );
}
