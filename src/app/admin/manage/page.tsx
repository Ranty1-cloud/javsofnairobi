import { redirect } from "next/navigation";
// Old bookmark: content tools now live on their own pages (Events, Articles, Destinations, Nganya, Gallery).
export default function Manage() { redirect("/admin/events"); }
