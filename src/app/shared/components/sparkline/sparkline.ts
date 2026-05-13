import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-sparkline',
  standalone: true,
  template: `
    @if (data().length >= 2) {
      <svg [attr.width]="w" [attr.height]="h" [style]="'display:block'" [attr.viewBox]="'0 0 ' + w + ' ' + h" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkgrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.5"/>
            <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path [attr.d]="areaPath()" fill="url(#sparkgrad)"/>
        <polyline fill="none" [attr.stroke]="color()" stroke-width="1.5" [attr.points]="linePoints()"/>
      </svg>
    }
  `,
})
export class Sparkline {
  data = input<number[]>([]);
  color = input<string>('var(--brand)');

  readonly w = 110;
  readonly h = 44;

  private readonly coords = computed(() => {
    const vals = this.data();
    if (vals.length < 2) return [];
    const max = Math.max(...vals, 1);
    const min = Math.min(...vals, 0);
    const pad = 4;
    const step = (this.w - pad * 2) / (vals.length - 1);
    const norm = (v: number) => this.h - pad - ((v - min) / (max - min || 1)) * (this.h - pad * 2);
    return vals.map((v, i) => ({ x: pad + i * step, y: norm(v) }));
  });

  readonly linePoints = computed(() =>
    this.coords().map(p => `${p.x},${p.y}`).join(' ')
  );

  readonly areaPath = computed(() => {
    const pts = this.coords();
    if (!pts.length) return '';
    const pad = 4;
    const movePts = pts.map(p => `${p.x},${p.y}`).join(' L ');
    return `M ${movePts.split(' L ')[0]} L ${movePts} L ${pts[pts.length - 1].x},${this.h - pad} L ${pts[0].x},${this.h - pad} Z`;
  });
}
