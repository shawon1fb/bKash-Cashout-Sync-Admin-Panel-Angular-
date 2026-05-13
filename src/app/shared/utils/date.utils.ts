const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function fmtDate(iso: string, withTime = true): string {
  const d = new Date(iso);
  const day = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  if (!withTime) return day;
  const h12 = (d.getHours() % 12) || 12;
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  return `${day}, ${h12}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

export function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function fmtRelative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDateShort(iso);
}

export function dailySeries(transactions: any[], days = 7): any[] {
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const items = transactions.filter(t => {
      const tt = new Date(t.transactionTime);
      return tt >= day && tt < next;
    });
    const paid = items.filter(t => t.status === 'paid');
    buckets.push({
      date: day,
      label: day.toLocaleDateString('en', { weekday: 'short' }),
      shortLabel: `${day.getDate()}/${day.getMonth() + 1}`,
      count: items.length,
      paidAmount: paid.reduce((s: number, t: any) => s + parseFloat(t.amount), 0),
      paidCount: paid.length,
      receivedCount: items.length - paid.length,
    });
  }
  return buckets;
}

export function monthlySeries(transactions: any[], months = 6): any[] {
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const ref = new Date();
    ref.setDate(1); ref.setHours(0, 0, 0, 0);
    ref.setMonth(ref.getMonth() - i);
    const next = new Date(ref);
    next.setMonth(next.getMonth() + 1);
    const items = transactions.filter(t => {
      const tt = new Date(t.transactionTime);
      return tt >= ref && tt < next;
    });
    const paid = items.filter(t => t.status === 'paid');
    const m = ref.toLocaleDateString('en', { month: 'short' });
    buckets.push({
      date: ref,
      label: m,
      count: items.length,
      paidAmount: paid.reduce((s: number, t: any) => s + parseFloat(t.amount), 0),
      paidCount: paid.length,
    });
  }
  return buckets;
}
