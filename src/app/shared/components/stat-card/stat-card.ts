import { Component, input } from '@angular/core';
import { Sparkline } from '../sparkline/sparkline';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [Sparkline],
  template: `
    @if (loading()) {
      <div class="stat">
        <div class="skel" style="width:80px;height:11px;margin-bottom:12px"></div>
        <div class="skel" style="width:140px;height:28px"></div>
        <div class="skel" style="width:60px;height:16px;margin-top:8px"></div>
      </div>
    } @else {
      <div class="stat">
        <div class="stat-label">{{ label() }}</div>
        <div class="stat-value">
          @if (currency()) { <span class="stat-cur">৳</span> }
          <span>{{ value() }}</span>
        </div>
        @if (trend()) {
          <div class="stat-trend" [class.up]="trendDir() !== 'down'" [class.down]="trendDir() === 'down'">
            @if (trendDir() === 'down') {
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            } @else {
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            }
            {{ trend() }}
          </div>
        }
        @if (icon()) {
          <div class="stat-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="iconPath()"></svg>
          </div>
        }
        @if (sparkData().length >= 2) {
          <app-sparkline [data]="sparkData()" class="stat-spark" />
        }
      </div>
    }
  `,
})
export class StatCard {
  label    = input.required<string>();
  value    = input.required<string | number>();
  currency = input<boolean>(false);
  trend    = input<string | null>(null);
  trendDir = input<'up' | 'down'>('up');
  icon     = input<string | null>(null);
  sparkData = input<number[]>([]);
  loading  = input<boolean>(false);

  readonly iconPath = () => {
    const map: Record<string, string> = {
      wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M20 12v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14"/><circle cx="16" cy="13" r="1"/>',
      transactions: '<path d="M7 10h14M7 10l4-4M7 10l4 4M17 14H3M17 14l-4-4M17 14l-4 4"/>',
      agents: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
      clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      'trending-up': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    };
    return map[this.icon() ?? ''] ?? '';
  };
}
