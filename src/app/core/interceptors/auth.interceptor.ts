import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

const PUBLIC_PATHS = ['/auth/otp/send', '/auth/otp/verify', '/auth/refresh', '/transactions/verify/'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const isPublic = PUBLIC_PATHS.some(p => req.url.includes(p));

  if (isPublic) return next(req);

  const token = storage.get<string>('bk_access_token');
  if (!token) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
