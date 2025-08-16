import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-service-selection',
  imports: [CommonModule],
  templateUrl: './service-selection.component.html',
  styleUrl: './service-selection.component.scss',
})
export class ServiceSelectionComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private bookingService = inject(BookingService);

  currentTime: string = '';
  currentDate: string = '';
  private timeSubscription: Subscription = new Subscription();

  ngOnInit(): void {
    this.updateTime();
    // Update time every second
    this.timeSubscription = interval(1000).subscribe(() => {
      this.updateTime();
    });
  }

  private updateTime(): void {
    const now = new Date();

    // Format time (HH:MM:SS)
    this.currentTime = now.toLocaleTimeString('en-AE', {
       timeZone: 'Asia/Dubai',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Format date
    this.currentDate = now.toLocaleDateString('en-AE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  selectService(
    serviceType: 'oil_change' | 'battery_replacement' | 'control_panel'
  ) {
    this.bookingService.clearBooking();

    if (serviceType === 'oil_change') {
      this.router.navigate(['/oil-service']);
    } else if (serviceType === 'battery_replacement') {
      this.router.navigate(['/battery-service']);
    } else if (serviceType === 'control_panel') {
      this.router.navigate(['/control-panel']);
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

  ngOnDestroy(): void {
    this.timeSubscription.unsubscribe();
  }
}
