import { cookies } from "next/headers";
export function holderId() {
  const jar = cookies();
  let id = jar.get("jid")?.value;
  if (!id) { id = crypto.randomUUID(); jar.set("jid", id, { httpOnly: true, sameSite: "lax", maxAge: 86400 }); }
  return id;
}
