import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
 
  const token = localStorage.getItem('token');

  const router = inject(Router);

  if (!token) {
    // Store the attempted URL for redirecting after login
    const returnUrl = state.url;
    router.navigate([''], { queryParams: { returnUrl } });
    return false;
  }

  return true;
};