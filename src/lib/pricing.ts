// Totals are always computed on the server from DB prices, never from the client.
export const total = (seats: { priceKes: number }[], bookingFeeKes: number) =>
  seats.reduce((s, x) => s + x.priceKes, 0) + bookingFeeKes;
