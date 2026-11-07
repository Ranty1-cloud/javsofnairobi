import { revalidatePath } from "next/cache";
// Public pages are cached for speed. Call this after any admin change that visitors can see so it shows up at once.
export const refreshSite = () => { try { revalidatePath("/", "layout"); } catch { /* not in a request, ignore */ } };
