import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  CommonModule,
  CurrencyPipe,
  DatePipe,
  NgClass,
  TitleCasePipe,
} from '@angular/common';
import { NgIf, NgFor } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { finalize, take } from 'rxjs';

@Component({
  selector: 'app-booking-details-modal',
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, NgClass],
  templateUrl: './booking-details-modal.component.html',
  styleUrl: './booking-details-modal.component.scss',
})
export class BookingDetailsModalComponent {
  injectedData = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<BookingDetailsModalComponent>);
  private apiService = inject(ApiService);

  statusUpdating = false;
  statusUpdateMessage = '';
  statusUpdateSuccess = false;
  showCancelConfirmation = false;

  // Helper methods for component logic
  getServiceTypeDisplay(): string {
    return this.injectedData.service_type?.replace('_', ' ') || 'Unknown';
  }

  getStatusColor(): string {
    switch (this.injectedData.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  hasServiceItems(): boolean {
    return !!(
      this.injectedData.battery_capacity ||
      this.injectedData.oil_filter_code ||
      (this.injectedData.accessories &&
        this.injectedData.accessories.length > 0)
    );
  }

  getTotalAccessoriesValue(): number {
    if (!this.injectedData.accessories) return 0;

    return this.injectedData.accessories.reduce(
      (total: number, accessory: any) => {
        return total + parseFloat(accessory.price) * accessory.quantity;
      },
      0
    );
  }

  cancelStatus(): void {
    this.showCancelConfirmation = true;
  }

  private getCurrentUserId(): number | null {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userData') || '{}');
      return userDetails?.userId || null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  updateBookingStatus(newStatus: 'pending' | 'completed' | 'cancelled') {
    if (confirm(`Are you sure you want to change status to ${newStatus}`)) {
      this.statusUpdating = true;
      this.statusUpdateMessage = '';
      this.showCancelConfirmation = false;

      const updateData = {
        bookingId: this.injectedData?.id,
        status: newStatus,
        updatedBy: this.getCurrentUserId(),
      };

      this.apiService
        .updateBookingStatus(
          updateData.bookingId,
          updateData.status,
          updateData.updatedBy as number
        )
        .pipe(
          take(1),
          finalize(() => {
            this.statusUpdating = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.injectedData.status = newStatus;
              alert('Succesfully Updated');
              this.dialogRef.close();
            }
          },
        });
    }
  }

  getServiceTypeDisplayName(serviceType: string): string {
    switch (serviceType) {
      case 'oil_change':
        return 'Oil Change';
      case 'battery_replacement':
        return 'Battery Replacement';
      case 'other_service':
        return 'Other Service';
      default:
        return serviceType.replace('_', ' ');
    }
  }

  // Add these methods
  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Paid';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }
}
