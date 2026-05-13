import { Component, input } from '@angular/core';

type StatusValue = 'paid' | 'received' | 'active' | 'inactive';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="pill" [class]="pillClass()">
      <span class="pill-dot"></span>{{ label() }}
    </span>
  `,
})
export class StatusBadge {
  status = input.required<StatusValue>();

  readonly pillClass = () => {
    const map: Record<StatusValue, string> = {
      paid:     'pill-success',
      received: 'pill-warning',
      active:   'pill-info',
      inactive: 'pill-muted',
    };
    return map[this.status()] ?? 'pill-muted';
  };

  readonly label = () => {
    const map: Record<StatusValue, string> = {
      paid: 'Paid', received: 'Received', active: 'Active', inactive: 'Inactive',
    };
    return map[this.status()] ?? this.status();
  };
}
