export function asMoneyString(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}


