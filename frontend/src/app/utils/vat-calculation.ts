/**
 * Extract VAT and Net amount from a VAT-inclusive total.
 * 
 * @param amount - The total amount including VAT
 * @param vatRate - VAT percentage (e.g., 5 for 5%)
 * @returns { vatAmount, netAmount }
 */
export function getVatExclusive(
  amount: number,
  vatRate: number = 5
): { vatAmount: number; netAmount: number } {
  if (!amount || vatRate <= 0) {
    return { vatAmount: 0, netAmount: amount || 0 };
  }

  const vatAmount = (amount * vatRate) / (100 + vatRate);
  const netAmount = amount - vatAmount;

  return {
    vatAmount: parseFloat(vatAmount.toFixed(2)),
    netAmount: parseFloat(netAmount.toFixed(2)),
  };
}
