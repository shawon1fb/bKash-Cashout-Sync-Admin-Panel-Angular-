import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data['role'] as string | undefined;

  if (!requiredRole) return true;
  const user = auth.currentUser();
  if (!user) return router.createUrlTree(['/login']);
  if (user.role === requiredRole) return true;
  return router.createUrlTree(['/dashboard']);
};
