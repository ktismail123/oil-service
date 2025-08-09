import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';

export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = localStorage.getItem('token');

  if (token) {
    // User is already authenticated, redirect to service selection
    if (token) {
      // router.navigate(['/control-panel']);
      router.navigate(['/select-service']);
    } else {
    }
    return false;
  }

  return true;
};