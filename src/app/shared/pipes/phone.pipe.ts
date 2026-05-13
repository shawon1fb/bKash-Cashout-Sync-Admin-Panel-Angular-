import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'phone', standalone: true, pure: true })
export class PhonePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    return value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
  }
}
