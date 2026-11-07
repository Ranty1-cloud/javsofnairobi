// Seat layouts. Older vehicles are a plain grid ({ rows, cols }) with the aisle in the middle of every row.
// A vehicle with a `plan` is drawn exactly as written: one string per row, front of the bus first.
//   S = passenger seat   . = empty space (door, engine cover)   | = aisle   D = driver
// Seat numbers are the column position in the row and the aisle is not counted, so "..|SS" has seats 3 and 4.
export type Plan = { row: string; cells: string }[];
export type Layout = { rows: string[]; cols: number[]; plan?: Plan };

// 33-seater Nganya bus. Kenya drives on the left, so the driver sits on the right and the door is on the left.
//   front: 2 passengers beside the driver | door row: left side is the entrance, so only the right pair exists
//   6 rows of 2+2 | back bench of 5.   2 + 2 + 24 + 5 = 33
// To move the door row, move the "..|SS" line. To change a row's seats, edit its string, then update the migration to match.
export const NGANYA_33_PLAN: Plan = [
  { row: "A", cells: "SS|.D" },
  { row: "B", cells: "..|SS" },
  { row: "C", cells: "SS|SS" }, { row: "D", cells: "SS|SS" }, { row: "E", cells: "SS|SS" },
  { row: "F", cells: "SS|SS" }, { row: "G", cells: "SS|SS" }, { row: "H", cells: "SS|SS" },
  { row: "I", cells: "SSSSS" },
];
export const NGANYA_33_LAYOUT: Layout = { rows: NGANYA_33_PLAN.map(r => r.row), cols: [1, 2, 3, 4, 5], plan: NGANYA_33_PLAN };

export function planSeats(plan: Plan) {
  const out: { label: string; rowIndex: number }[] = [];
  plan.forEach((r, rowIndex) => {
    let col = 0;
    for (const ch of r.cells) { if (ch === "|") continue; col++; if (ch === "S") out.push({ label: `${r.row}${col}`, rowIndex }); }
  });
  return out;
}
// Every seat a vehicle has, with the index of its row (0 = front row, which gets the front-row price).
export const layoutSeats = (l: Layout) => l.plan ? planSeats(l.plan) : l.rows.flatMap((r, rowIndex) => l.cols.map(c => ({ label: `${r}${c}`, rowIndex })));
