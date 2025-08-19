import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize, take } from 'rxjs';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-oil-type-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './oil-type-modal.component.html',
  styleUrls: ['./oil-type-modal.component.scss'],
})
export class OilTypeModalComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private dialogRef = inject(MatDialogRef<OilTypeModalComponent>);
  private injectedData: { mode: string; rowData: any } = inject(MAT_DIALOG_DATA);

  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  editingOilType = signal(false);

  oilTypeForm: FormGroup;

  constructor() {
    if (this.injectedData?.mode === 'edit') {
      this.editingOilType.set(true);
    }

    const data = this.injectedData?.rowData || {};

    this.oilTypeForm = this.fb.group({
      name: [data?.name || ''],
      grade: [data?.grade || '', [Validators.required]],
      brand: [data?.brand || '', [Validators.required]],
      service_interval: [data?.service_interval || '', [Validators.required]],
      package_1l_available: [data?.package_1l_available ?? '0', [Validators.required]],
      package_4l_available: [data?.package_4l_available ?? '0', [Validators.required]],
      bulk_available: [data?.bulk_available ?? '0', [Validators.required]],
      price_1l: [data?.price_1l ?? '', [Validators.required, Validators.min(0)]],
      price_4l: [data?.price_4l ?? '', [Validators.required, Validators.min(0)]],
      price_per_liter: [data?.price_per_liter ?? '', [Validators.required, Validators.min(0)]],
    });
  }

  isEditMode(): boolean {
    return this.editingOilType();
  }

  // Generic check for invalid form controls
  isInvalid(controlName: string): boolean {
    const control = this.oilTypeForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.oilTypeForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return `${this.getLabel(controlName)} is required`;
    if (control.errors['min']) return `${this.getLabel(controlName)} must be greater than 0`;
    if (control.errors['minlength']) return `${this.getLabel(controlName)} is too short`;
    return '';
  }

  getLabel(controlName: string): string {
    const labels: Record<string, string> = {
      name: 'Oil name',
      grade: 'Grade',
      brand: 'Brand',
      service_interval: 'Service interval',
      package_1l_available: '1L Package availability',
      package_4l_available: '4L Package availability',
      bulk_available: 'Bulk availability',
      price_1l: 'Price for 1L',
      price_4l: 'Price for 4L',
      price_per_liter: 'Price per liter',
    };
    return labels[controlName] || controlName;
  }

  onSubmit() {
    // Mark all controls as touched to show validation errors
    if (this.oilTypeForm.invalid) {
      Object.values(this.oilTypeForm.controls).forEach(control => {
        control.markAsTouched();
        control.updateValueAndValidity();
      });
      return;
    }

    // Set 'name' = 'grade' automatically
    const gradeValue = this.oilTypeForm.get('grade')?.value;
    this.oilTypeForm.controls['name'].setValue(gradeValue);

    this.isSubmitting.set(true);
    const formData = this.oilTypeForm.value;

    if (this.isEditMode()) {
      this.apiService.updateOilType(this.injectedData?.rowData?.id, formData).subscribe({
        next: () => {
          this.successMessage.set('Oil type updated successfully');
          this.isSubmitting.set(false);
          this.closeModal(true);
        },
        error: () => {
          this.errorMessage.set('Failed to update oil type');
          this.isSubmitting.set(false);
        },
      });
    } else {
      this.apiService
        .createOilType(formData)
        .pipe(
          take(1),
          finalize(() => this.isSubmitting.set(false))
        )
        .subscribe({
          next: () => {
            this.successMessage.set('Oil type created successfully');
            this.closeModal(true);
          },
          error: () => {
            this.errorMessage.set('Failed to create oil type');
          },
        });
    }
  }

  closeModal(refresh = false) {
    this.dialogRef.close(refresh); // optionally pass true to indicate refresh needed
  }
}
