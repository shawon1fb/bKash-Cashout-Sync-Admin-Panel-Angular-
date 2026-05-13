import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'amount', standalone: true, pure: true })
export class AmountPipe implements PipeTransform {
  transform(value: string | number | null | undefined, withCurrency = true): string {
    if (value === null || value === undefined) return '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '—';
    const s = num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return withCurrency ? `৳ ${s}` : s;
  }
}

export function fmtAmountShort(value: number): string {
  if (value >= 10_000_000) return `৳ ${(value / 10_000_000).toFixed(2)}Cr`;
  if (value >= 100_000)    return `৳ ${(value / 100_000).toFixed(2)}L`;
  if (value >= 1_000)      return `৳ ${(value / 1_000).toFixed(1)}K`;
  return `৳ ${value.toFixed(0)}`;
}
