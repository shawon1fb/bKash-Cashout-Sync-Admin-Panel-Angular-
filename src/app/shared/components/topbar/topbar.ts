import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-topbar',
  standalone: true,
  template: `
    <div class="topbar">
      <div style="flex:1;min-width:0">
        <div style="font-size:18px;font-weight:600;letter-spacing:-0.02em">{{ title() }}</div>
        @if (subtitle()) {
          <div style="font-size:12px;color:var(--text-muted);margin-top:1px">{{ subtitle() }}</div>
        }
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <button class="btn btn-ghost btn-icon" (click)="toggleTheme.emit()" title="Toggle theme">
          @if (theme() === 'dark') {
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          } @else {
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>
        <button class="btn btn-ghost btn-icon" title="Notifications">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </button>
      </div>
    </div>
  `,
})
export class Topbar {
  title       = input<string>('');
  subtitle    = input<string>('');
  theme       = input<string>('dark');
  toggleTheme = output<void>();
}
