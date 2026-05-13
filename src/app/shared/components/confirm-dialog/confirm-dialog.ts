import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="dialog-backdrop" (click)="close.emit()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div style="padding:20px 22px 12px">
          <div style="display:flex;gap:14px;align-items:flex-start">
            <div [style.background]="isDanger() ? 'var(--danger-soft)' : 'var(--info-soft)'" [style.color]="isDanger() ? 'var(--danger)' : 'var(--info)'" style="width:38px;height:38px;border-radius:50%;display:grid;place-items:center;flex-shrink:0">
              @if (isDanger()) {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              } @else {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              }
            </div>
            <div style="flex:1;padding-top:4px">
              <div style="font-size:15px;font-weight:600">{{ title() }}</div>
              <div style="font-size:13px;color:var(--text-2);margin-top:6px;line-height:1.55">{{ message() }}</div>
            </div>
          </div>
        </div>
        <div style="padding:14px 22px;border-top:1px solid var(--divider);display:flex;justify-content:flex-end;gap:8px">
          <button class="btn" (click)="close.emit()">Cancel</button>
          <button class="btn" [class.btn-danger]="isDanger()" [class.btn-primary]="!isDanger()" (click)="confirm.emit()">{{ confirmLabel() }}</button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialog {
  title        = input<string>('Confirm');
  message      = input<string>('');
  confirmLabel = input<string>('Confirm');
  isDanger     = input<boolean>(false);
  close        = output<void>();
  confirm      = output<void>();
}
