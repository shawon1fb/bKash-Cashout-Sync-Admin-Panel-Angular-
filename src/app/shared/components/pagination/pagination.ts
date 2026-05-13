import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-top:1px solid var(--divider);font-size:12px;color:var(--text-muted)">
      <div style="display:flex;align-items:center;gap:10px">
        <span>Rows per page:</span>
        <select [value]="pageSize()" (change)="onPageSizeChange($event)" class="input" style="width:auto;padding:4px 22px 4px 8px;font-size:12px">
          @for (n of [10,25,50,100]; track n) {
            <option [value]="n">{{ n }}</option>
          }
        </select>
        <span>{{ rangeText() }}</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px">
        <button class="btn btn-sm btn-ghost btn-icon" (click)="pageChange.emit(Math.max(1, page()-1))" [disabled]="page() <= 1" [style.opacity]="page() <= 1 ? 0.4 : 1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style="padding:0 8px;font-family:var(--font-mono)">{{ page() }} / {{ totalPages() }}</span>
        <button class="btn btn-sm btn-ghost btn-icon" (click)="pageChange.emit(Math.min(totalPages(), page()+1))" [disabled]="page() >= totalPages()" [style.opacity]="page() >= totalPages() ? 0.4 : 1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  `,
})
export class Pagination {
  page       = input<number>(1);
  totalPages = input<number>(1);
  pageSize   = input<number>(25);
  totalItems = input<number>(0);

  pageChange     = output<number>();
  pageSizeChange = output<number>();

  protected readonly Math = Math;

  readonly rangeText = computed(() => {
    const total = this.totalItems();
    if (!total) return '0 of 0';
    const from = (this.page() - 1) * this.pageSize() + 1;
    const to = Math.min(this.page() * this.pageSize(), total);
    return `${from}–${to} of ${total}`;
  });

  onPageSizeChange(e: Event): void {
    this.pageSizeChange.emit(+(e.target as HTMLSelectElement).value);
  }
}
