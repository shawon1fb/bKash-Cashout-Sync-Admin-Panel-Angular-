import { Component, input } from '@angular/core';
import { Sparkline } from '../sparkline/sparkline';
import { IconPipe } from '../../pipes/icon.pipe';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [Sparkline, IconPipe],
  host: { style: 'display: block; height: 100%;' },
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="icon()! | icon"></svg>
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
  label     = input.required<string>();
  value     = input.required<string | number>();
  currency  = input<boolean>(false);
  trend     = input<string | null>(null);
  trendDir  = input<'up' | 'down'>('up');
  icon      = input<string | null>(null);
  sparkData = input<number[]>([]);
  loading   = input<boolean>(false);
}
