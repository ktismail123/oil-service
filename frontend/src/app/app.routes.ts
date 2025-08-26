import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/auth/login/login.component')
      .then(m => m.LoginComponent),
       canActivate: [guestGuard],
  },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      {
        path: 'select-service',
        loadComponent: () => import('./pages/service-selection/service-selection.component')
          .then(m => m.ServiceSelectionComponent)
      },
      {
        path: 'oil-service',
        loadComponent: () => import('./pages/oil-service/oil-service.component')
          .then(m => m.OilServiceComponent)
      },
      {
        path: 'battery-service',
        loadComponent: () => import('./pages/battery-service/battery-service.component')
          .then(m => m.BatteryServiceComponent)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./components/booking-list/booking-list.component')
          .then(m => m.BookingListComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'control-panel',
        loadComponent: () => import('./pages/control-panel/control-panel.component')
          .then(m => m.ControlPanelComponent)
      },
      {
        path: 'other-service',
        loadComponent: () => import('./pages/other-service/other-service.component')
          .then(m => m.OtherServiceComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
