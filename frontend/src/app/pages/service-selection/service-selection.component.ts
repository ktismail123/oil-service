import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-selection',
  imports: [CommonModule],
  templateUrl: './service-selection.component.html',
  styleUrl: './service-selection.component.css',
})
export class ServiceSelectionComponent {
  private router = inject(Router);
  private bookingService = inject(BookingService);
  currentDate = new Date();

  selectService(
    serviceType: 'oil_change' | 'battery_replacement' | 'control_panel'
  ) {
    this.bookingService.clearBooking();

    if (serviceType === 'oil_change') {
      this.router.navigate(['/oil-service']);
    } else if (serviceType === 'battery_replacement') {
      this.router.navigate(['/battery-service']);
    } else if (serviceType === 'control_panel') {
      this.router.navigate(['/control_panel']);
    }
  }

  logout(): void {
    // Implement logout logic
    console.log('Logging out...');

    // Clear session data
    // localStorage.removeItem('authToken');
    // sessionStorage.clear();

    // Redirect to login page
    // this.router.navigate(['/login']);

    // Or show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
      // Perform logout
      localStorage.clear();
      this.router.navigateByUrl('');
      console.log('User confirmed logout');
    }
  }
}
