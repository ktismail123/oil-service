import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize, take } from 'rxjs';

@Component({
  selector: 'app-battery-types-modal',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './battery-types-modal.component.html',
  styleUrl: './battery-types-modal.component.scss',
})
export class BatteryTypesModalComponent {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);
  private injectedData: {
    mode: string;
    rowData: any;
  } = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<BatteryTypesModalComponent>);
  batteryTypeForm = this.fb.group({
    capacity: [this.injectedData?.rowData?.capacity, [Validators.required, Validators.min(1)]],
    brand: [this.injectedData?.rowData?.brand, [Validators.required, Validators.minLength(2)]],
    price: [this.injectedData?.rowData?.price, [Validators.required, Validators.min(0)]],
    quantity_available: [0], // Not shown in template but included for backend
  });

  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  isSubmitting = signal<boolean>(false);
  editingBatteryType = signal<any>(null);

  constructor() {
    if (this.injectedData?.mode === 'edit') {
      this.editingBatteryType.set(true);
    }
  }

  isEditMode(): boolean {
    return !!this.editingBatteryType();
  }

  // Capacity validation methods
  isCapacityInvalid(): boolean {
    const control = this.batteryTypeForm.get('capacity');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getCapacityErrorMessage(): string {
    const control = this.batteryTypeForm.get('capacity');
    if (control?.errors?.['required']) return 'Capacity is required';
    if (control?.errors?.['min']) return 'Capacity must be greater than 0';
    return '';
  }

  // Brand validation methods
  isBrandInvalid(): boolean {
    const control = this.batteryTypeForm.get('brand');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getBrandErrorMessage(): string {
    const control = this.batteryTypeForm.get('brand');
    if (control?.errors?.['required']) return 'Brand is required';
    if (control?.errors?.['minlength'])
      return 'Brand must be at least 2 characters';
    return '';
  }

  // Price validation methods
  isPriceInvalid(): boolean {
    const control = this.batteryTypeForm.get('price');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getPriceErrorMessage(): string {
    const control = this.batteryTypeForm.get('price');
    if (control?.errors?.['required']) return 'Price is required';
    if (control?.errors?.['min'])
      return 'Price must be greater than or equal to 0';
    return '';
  }

  onSubmit() {
    if (this.batteryTypeForm.valid) {
      this.isSubmitting.set(true);

      if (this.isEditMode()) {
        // Update logic
        this.updateBattteryType();
      } else {
        // Create logic
        this.createBatteryType();
      }
    } else {
      // Mark all fields as touched to show validation errors
      this.batteryTypeForm.markAllAsTouched();
    }
  }

  createBatteryType() {
    const formData = this.batteryTypeForm.value;
    this.apiService
      .createBatteryType(formData)
      .pipe(
        take(1),
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage.set('Battery type created successfully');
          this.isSubmitting.set(false);
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage.set(err.error.error);
          this.isSubmitting.set(false);
        },
      });
  }

  updateBattteryType() {
    const formData = this.batteryTypeForm.value;

    this.apiService
      .updateBatteryType(this.injectedData?.rowData?.id, formData)
      .pipe(
        take(1),
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage.set('Battery type updated successfully');
          this.isSubmitting.set(false);
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage.set(err.error.error);
          this.isSubmitting.set(false);
        },
      });
  }

  closeModal() {
    // Close modal logic
    this.batteryTypeForm.reset();
    this.successMessage.set('');
    this.errorMessage.set('');
    this.dialogRef.close();
  }

  // Method to populate form for editing
  setEditingBatteryType(batteryType: any) {
    this.editingBatteryType.set(batteryType);
    this.batteryTypeForm.patchValue({
      capacity: batteryType.capacity,
      brand: batteryType.brand,
      price: batteryType.price,
      quantity_available: batteryType.quantity_available || 0,
    });
  }

  // Method to reset form for creating new battery type
  resetForCreate() {
    this.editingBatteryType.set(null);
    this.batteryTypeForm.reset({
      quantity_available: 0,
    });
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}
