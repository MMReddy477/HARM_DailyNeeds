export type RateLine = { quantity: number; price: number | null };

export function calculateQuote(lines: RateLine[], discount = 0) {
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) return null;
  let subtotal = 0;
  for (const line of lines) {
    if (line.price === null || !Number.isFinite(line.price) || line.price < 0 || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 10000) return null;
    subtotal += Math.round(line.price * 100) * line.quantity;
    if (!Number.isSafeInteger(subtotal)) return null;
  }
  const discountAmount = Math.round(subtotal * discount / 100);
  return { subtotal: subtotal / 100, discountAmount: discountAmount / 100, total: (subtotal - discountAmount) / 100 };
}
