import { Component, input, computed } from '@angular/core';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  template: `
    <div style="display:flex;align-items:center;gap:24px">
      <svg [attr.width]="size()" [attr.height]="size()" [attr.viewBox]="'0 0 '+size()+' '+size()">
        @for (seg of segments(); track seg.label; let i = $index) {
          <path [attr.d]="arcPaths()[i]" [attr.fill]="seg.color" style="transition:opacity 0.15s"/>
        }
        @if (centerValue()) {
          <text [attr.x]="r()" [attr.y]="r()-4" text-anchor="middle" font-size="11" fill="var(--text-muted)" style="text-transform:uppercase;letter-spacing:0.05em">{{ centerLabel() }}</text>
          <text [attr.x]="r()" [attr.y]="r()+18" text-anchor="middle" font-size="22" font-weight="600" fill="var(--text)" style="font-family:var(--font-mono)">{{ centerValue() }}</text>
        }
      </svg>
      <div style="display:flex;flex-direction:column;gap:10px">
        @for (seg of segments(); track seg.label) {
          <div style="display:flex;align-items:center;gap:10px;font-size:13px">
            <div [style.background]="seg.color" style="width:10px;height:10px;border-radius:3px;flex-shrink:0"></div>
            <div>
              <div>{{ seg.label }}</div>
              <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">
                {{ seg.value }} <span style="opacity:0.6">({{ pct(seg) }}%)</span>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class DonutChart {
  segments    = input<DonutSegment[]>([]);
  size        = input<number>(180);
  thickness   = input<number>(22);
  centerLabel = input<string>('');
  centerValue = input<string | number | null>(null);

  readonly r = computed(() => this.size() / 2);

  readonly total = computed(() =>
    this.segments().reduce((s, seg) => s + seg.value, 0) || 1
  );

  readonly arcPaths = computed(() => {
    const segs = this.segments();
    const r = this.r();
    const inner = r - this.thickness();
    const total = this.total();
    let cur = -Math.PI / 2;
    return segs.map(seg => {
      const ang = (seg.value / total) * Math.PI * 2;
      const start = cur;
      const end = cur + ang;
      cur = end;
      const x1 = r + r * Math.cos(start);
      const y1 = r + r * Math.sin(start);
      const x2 = r + r * Math.cos(end);
      const y2 = r + r * Math.sin(end);
      const ix1 = r + inner * Math.cos(end);
      const iy1 = r + inner * Math.sin(end);
      const ix2 = r + inner * Math.cos(start);
      const iy2 = r + inner * Math.sin(start);
      const large = end - start > Math.PI ? 1 : 0;
      return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${inner} ${inner} 0 ${large} 0 ${ix2} ${iy2} Z`;
    });
  });

  pct(seg: DonutSegment): string {
    return ((seg.value / this.total()) * 100).toFixed(1);
  }
}
