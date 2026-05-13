import { Component, input, signal, computed, ElementRef, viewChild, afterNextRender, DestroyRef, inject } from '@angular/core';
import { fmtAmountShort } from '../../pipes/amount.pipe';

@Component({
  selector: 'app-line-area-chart',
  standalone: true,
  template: `
    <div #container style="width:100%;position:relative">
      @if (w() > 0) {
        <svg [attr.width]="w()" [attr.height]="height()" style="display:block">
          <defs>
            <linearGradient id="lac-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.28"/>
              <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="lac-line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" [attr.stop-color]="color()"/>
              <stop offset="100%" [attr.stop-color]="color2()"/>
            </linearGradient>
          </defs>
          @for (tick of yTicks(); track $index) {
            <line [attr.x1]="padL" [attr.x2]="w()-padR" [attr.y1]="yPos(tick)" [attr.y2]="yPos(tick)" stroke="var(--divider)" stroke-dasharray="2 4"/>
            <text [attr.x]="padL-8" [attr.y]="yPos(tick)+4" font-size="10" fill="var(--text-dim)" text-anchor="end">{{ fmtY(tick) }}</text>
          }
          @for (d of data(); track $index; let i = $index) {
            <text [attr.x]="xPos(i)" [attr.y]="height()-padB+16" font-size="10" fill="var(--text-muted)" text-anchor="middle">{{ d[labelKey()] }}</text>
          }
          <path [attr.d]="areaPath()" fill="url(#lac-area)"/>
          <path [attr.d]="linePath()" fill="none" stroke="url(#lac-line)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          @for (d of data(); track $index; let i = $index) {
            <circle [attr.cx]="xPos(i)" [attr.cy]="yDataPos(i)" [attr.r]="hover() === i ? 5 : 3" fill="var(--surface)" [attr.stroke]="color()" stroke-width="2" style="transition:r 0.12s"/>
            <rect [attr.x]="xPos(i) - stepX()/2" [attr.y]="padT" [attr.width]="stepX()" [attr.height]="height()-padT-padB" fill="transparent"
              (mouseenter)="hover.set(i)" (mouseleave)="hover.set(null)"/>
          }
          @if (hover() !== null) {
            <line [attr.x1]="xPos(hover()!)" [attr.x2]="xPos(hover()!)" [attr.y1]="padT" [attr.y2]="height()-padB" [attr.stroke]="color()" stroke-dasharray="3 3" stroke-opacity="0.4"/>
          }
        </svg>
        @if (hover() !== null) {
          <div [style.left.px]="Math.min(xPos(hover()!)+10, w()-160)" [style.top.px]="yDataPos(hover()!)-18" style="position:absolute;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);padding:8px 10px;font-size:12px;box-shadow:var(--shadow-md);pointer-events:none;white-space:nowrap">
            <div style="color:var(--text-muted);font-size:10px;text-transform:uppercase;letter-spacing:0.06em">{{ data()[hover()!][labelKey()] }}</div>
            <div style="font-weight:600;margin-top:2px;font-family:var(--font-mono)">{{ fmtY(data()[hover()!][valueKey()]) }}</div>
          </div>
        }
      }
    </div>
  `,
})
export class LineAreaChart {
  data      = input<any[]>([]);
  height    = input<number>(240);
  color     = input<string>('var(--brand)');
  color2    = input<string>('var(--brand-2)');
  valueKey  = input<string>('paidAmount');
  labelKey  = input<string>('label');
  currency  = input<boolean>(true);

  readonly padL = 44; readonly padR = 14; readonly padT = 16; readonly padB = 30;

  protected readonly Math = Math;
  container = viewChild<ElementRef>('container');
  readonly w = signal(0);
  readonly hover = signal<number | null>(null);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.container()?.nativeElement;
      if (!el) return;
      const ro = new ResizeObserver(entries => {
        const w = entries[0]?.contentRect?.width;
        if (w) this.w.set(Math.max(220, w));
      });
      ro.observe(el);
      destroyRef.onDestroy(() => ro.disconnect());
    });
  }

  readonly max = computed(() => Math.max(...this.data().map(d => d[this.valueKey()] ?? 0), 1));
  readonly stepX = computed(() => (this.w() - this.padL - this.padR) / Math.max(this.data().length - 1, 1));

  xPos(i: number): number {
    return this.padL + i * this.stepX();
  }
  yDataPos(i: number): number {
    const v = this.data()[i]?.[this.valueKey()] ?? 0;
    return this.padT + (1 - v / (this.max() || 1)) * (this.height() - this.padT - this.padB);
  }
  yPos(v: number): number {
    return this.padT + (1 - v / (this.max() || 1)) * (this.height() - this.padT - this.padB);
  }

  readonly yTicks = computed(() => {
    const ticks: number[] = [];
    for (let i = 0; i <= 4; i++) ticks.push(this.max() * (i / 4));
    return ticks;
  });

  fmtY(v: number): string {
    return this.currency() ? fmtAmountShort(v) : String(Math.round(v));
  }

  readonly linePath = computed(() => {
    const d = this.data();
    if (!d.length) return '';
    let path = '';
    d.forEach((pt, i) => {
      const px = this.xPos(i), py = this.yDataPos(i);
      if (i === 0) { path += `M ${px},${py}`; return; }
      const prevX = this.xPos(i - 1), prevY = this.yDataPos(i - 1);
      const cx = (prevX + px) / 2;
      path += ` C ${cx},${prevY} ${cx},${py} ${px},${py}`;
    });
    return path;
  });

  readonly areaPath = computed(() => {
    const lp = this.linePath();
    if (!lp) return '';
    const d = this.data();
    const lastX = this.xPos(d.length - 1);
    const firstX = this.xPos(0);
    const baseline = this.height() - this.padB;
    return `${lp} L ${lastX},${baseline} L ${firstX},${baseline} Z`;
  });
}
