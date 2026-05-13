import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

let refreshing = false;

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const storage = inject(StorageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || req.url.includes('/auth/') || refreshing) {
        return throwError(() => err);
      }

      refreshing = true;
      return auth.refresh().pipe(
        switchMap(res => {
          refreshing = false;
          const newToken = res.data?.accessToken;
          if (!newToken) {
            auth.clearAuth();
            return throwError(() => err);
          }
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
        }),
        catchError(refreshErr => {
          refreshing = false;
          auth.clearAuth();
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
