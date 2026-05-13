import { Injectable, signal, effect, inject } from '@angular/core';
import { StorageService } from './storage.service';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storage = inject(StorageService);

  readonly theme = signal<Theme>((this.storage.get<Theme>('bk_theme')) || 'dark');

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.className = t === 'light' ? 'light' : '';
      this.storage.set('bk_theme', t);
    });
  }

  toggle(): void {
    this.theme.update(t => t === 'dark' ? 'light' : 'dark');
  }
}
