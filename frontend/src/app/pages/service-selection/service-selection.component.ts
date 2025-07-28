import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-selection',
  imports: [ButtonComponent,CommonModule ],
  templateUrl: './service-selection.component.html',
  styleUrl: './service-selection.component.css'
})
export class ServiceSelectionComponent {
private router = inject(Router);
  private bookingService = inject(BookingService);
  currentDate = new Date();

  selectService(serviceType: 'oil_change' | 'battery_replacement') {
    this.bookingService.clearBooking();
    
    if (serviceType === 'oil_change') {
      this.router.navigate(['/oil-service']);
    } else if (serviceType === 'battery_replacement') {
      this.router.navigate(['/battery-service']);
    }
  }
}
