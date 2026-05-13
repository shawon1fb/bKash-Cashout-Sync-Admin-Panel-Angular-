import { Component, input, signal, computed, ElementRef, viewChild, afterNextRender, DestroyRef, inject } from '@angular/core';
import { fmtAmountShort } from '../../pipes/amount.pipe';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  template: `
    <div #container style="width:100%;position:relative">
      @if (w() > 0) {
        <svg [attr.width]="w()" [attr.height]="height()" style="display:block">
          <defs>
            <linearGradient id="bar-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.95"/>
              <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0.55"/>
            </linearGradient>
            <linearGradient id="bar-grad-hover" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="var(--brand-2)" stop-opacity="1"/>
              <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0.7"/>
            </linearGradient>
          </defs>
          @for (tick of yTicks(); track $index) {
            <line [attr.x1]="padL" [attr.x2]="w()-padR" [attr.y1]="yPos(tick)" [attr.y2]="yPos(tick)" stroke="var(--divider)" stroke-dasharray="2 4"/>
            <text [attr.x]="padL-8" [attr.y]="yPos(tick)+4" font-size="10" fill="var(--text-dim)" text-anchor="end">{{ fmtY(tick) }}</text>
          }
          @for (d of data(); track $index; let i = $index) {
            @let cx = padL + stepX() * i + stepX() / 2;
            @let by = yPos(d[valueKey()]);
            <rect [attr.x]="cx - barW()/2" [attr.y]="by" [attr.width]="barW()" [attr.height]="height()-padB-by" rx="3"
              [attr.fill]="hover() === i ? 'url(#bar-grad-hover)' : 'url(#bar-grad)'"
              (mouseenter)="hover.set(i)" (mouseleave)="hover.set(null)"
              style="transition:fill 0.15s;cursor:pointer"/>
            <text [attr.x]="cx" [attr.y]="height()-padB+16" font-size="10" fill="var(--text-muted)" text-anchor="middle">{{ d[labelKey()] }}</text>
          }
        </svg>
        @if (hover() !== null) {
          @let hd = data()[hover()!];
          @let hcx = padL + stepX() * hover()! + stepX() / 2;
          <div [style.left.px]="hcx + 8" [style.top.px]="yPos(hd[valueKey()]) - 4" style="position:absolute;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);padding:8px 10px;font-size:12px;box-shadow:var(--shadow-md);pointer-events:none;white-space:nowrap;transform:translateY(-100%)">
            <div style="color:var(--text-muted);font-size:10px;text-transform:uppercase;letter-spacing:0.06em">{{ hd[labelKey()] }}</div>
            <div style="font-weight:600;margin-top:2px;font-family:var(--font-mono)">{{ fmtY(hd[valueKey()]) }}</div>
          </div>
        }
      }
    </div>
  `,
})
export class BarChart {
  data     = input<any[]>([]);
  height   = input<number>(240);
  color    = input<string>('var(--brand)');
  valueKey = input<string>('paidAmount');
  labelKey = input<string>('label');
  currency = input<boolean>(true);

  readonly padL = 44; readonly padR = 14; readonly padT = 16; readonly padB = 30;

  container = viewChild<ElementRef>('container');
  readonly w = signal(0);
  readonly hover = signal<number | null>(null);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.container()?.nativeElement;
      if (!el) return;
      const ro = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect?.width;
        if (width) this.w.set(Math.max(220, width));
      });
      ro.observe(el);
      destroyRef.onDestroy(() => ro.disconnect());
    });
  }

  readonly max = computed(() => Math.max(...this.data().map(d => d[this.valueKey()] ?? 0), 1));
  readonly stepX = computed(() => (this.w() - this.padL - this.padR) / (this.data().length || 1));
  readonly barW = computed(() => Math.max(8, this.stepX() * 0.6));

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
}
