// The name on the customer's M-Pesa, entered with the confirmation code so staff can match it on the statement.
// Rule: at least two names (e.g. "John Kamau"); a middle initial is fine ("John K Kamau"). Used by the form and the API.
export const PAYER_NAME_HELP = "Enter at least two names exactly as they appear on your M-Pesa, e.g. John Kamau";
export const cleanPayerName = (s: string) => s.trim().replace(/\s+/g, " ");
export function isPayerName(s: string) {
  const n = cleanPayerName(s), words = n.split(" ");
  return n.length <= 80 && words.every(w => /^\p{L}[\p{L}.'-]*$/u.test(w)) && words.filter(w => w.replace(/[.'-]/g, "").length >= 2).length >= 2;
}
