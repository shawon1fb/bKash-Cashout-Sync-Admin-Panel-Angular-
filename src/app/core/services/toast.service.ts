import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  msg: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(type: ToastType, msg: string): void {
    const id = Math.random().toString(36).slice(2);
    this.toasts.update(t => [...t, { id, type, msg }]);
    setTimeout(() => this.toasts.update(t => t.filter(x => x.id !== id)), 4000);
  }

  success(msg: string): void { this.show('success', msg); }
  error(msg: string): void   { this.show('error', msg); }
  info(msg: string): void    { this.show('info', msg); }
}
