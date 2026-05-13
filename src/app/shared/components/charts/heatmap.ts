import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-heatmap',
  standalone: true,
  template: `
    <div style="display:flex;gap:2px;align-items:flex-end">
      <div style="display:flex;flex-direction:column;gap:3px;padding-right:6px;font-size:9px;color:var(--text-dim)">
        @for (d of ['M','W','F']; track d) {
          <div style="height:14px">{{ d }}</div>
        }
      </div>
      <div [style]="gridStyle()">
        @for (d of slicedData(); track $index) {
          <div [title]="d.count + ' on ' + d.date.toLocaleDateString()" [style.background]="cellBg(d.count)" style="width:14px;height:14px;border-radius:3px;border:1px solid var(--border)"></div>
        }
      </div>
    </div>
  `,
})
export class Heatmap {
  data = input<{ date: Date; count: number }[]>([]);
  days = input<number>(49);

  readonly max = computed(() => Math.max(1, ...this.data().map(d => d.count)));
  readonly slicedData = computed(() => this.data().slice(-this.days()));
  readonly weeks = computed(() => Math.ceil(this.days() / 7));

  readonly gridStyle = computed(() =>
    `display:grid;grid-template-columns:repeat(${this.weeks()},14px);grid-template-rows:repeat(7,14px);gap:3px;grid-auto-flow:column`
  );

  cellBg(count: number): string {
    const intensity = count / this.max();
    if (intensity <= 0.05) return 'var(--surface-2)';
    const pct = Math.min(100, 20 + intensity * 80);
    return `color-mix(in oklab, var(--brand) ${pct}%, transparent)`;
  }
}
