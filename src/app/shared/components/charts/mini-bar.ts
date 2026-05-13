import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-mini-bar',
  standalone: true,
  template: `
    <div style="width:100%;height:5px;background:var(--surface-3);border-radius:3px;overflow:hidden">
      <div [style.width.%]="pct()" style="height:100%;background:var(--brand);border-radius:3px"></div>
    </div>
  `,
})
export class MiniBar {
  value = input<number>(0);
  max   = input<number>(1);
  readonly pct = computed(() => Math.min(100, ((this.value() / (this.max() || 1)) * 100)));
}
