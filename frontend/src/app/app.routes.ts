import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
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
    path: 'control-panel',
    loadComponent: () => import('./pages/control-panel/control-panel.component')
      .then(m => m.ControlPanelComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
