import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize, take } from 'rxjs';

@Component({
  selector: 'app-oil-filter-modal',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './oil-filter-modal.component.html',
  styleUrl: './oil-filter-modal.component.scss',
})
export class OilFilterModalComponent {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<OilFilterModalComponent>);

  private injectedData: {
    mode: string;
    rowData: any;
  } = inject(MAT_DIALOG_DATA);

    oilFilterForm = this.fb.group({
    code: [this.injectedData?.rowData?.code || '', [Validators.required, Validators.minLength(3)]],
    brand: [this.injectedData?.rowData?.brand || '', [Validators.required, Validators.minLength(2)]],
    price: [this.injectedData?.rowData?.price || '', [Validators.required, Validators.min(0)]],
    quantity_available: [0, [Validators.min(0)]],
  });

  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  isSubmitting = signal<boolean>(false);
  editingOilFilter = signal<any>(null);

  constructor() {
    if (this.injectedData?.mode === 'edit') {
      this.editingOilFilter.set(true);
    }
  }

  isEditMode(): boolean {
    return !!this.editingOilFilter();
  }

  // Code validation methods
  isCodeInvalid(): boolean {
    const control = this.oilFilterForm.get('code');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getCodeErrorMessage(): string {
    const control = this.oilFilterForm.get('code');
    if (control?.errors?.['required']) return 'Filter code is required';
    if (control?.errors?.['minlength'])
      return 'Filter code must be at least 3 characters';
    return '';
  }

  // Brand validation methods
  isBrandInvalid(): boolean {
    const control = this.oilFilterForm.get('brand');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getBrandErrorMessage(): string {
    const control = this.oilFilterForm.get('brand');
    if (control?.errors?.['required']) return 'Brand is required';
    if (control?.errors?.['minlength'])
      return 'Brand must be at least 2 characters';
    return '';
  }

  // Price validation methods
  isPriceInvalid(): boolean {
    const control = this.oilFilterForm.get('price');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getPriceErrorMessage(): string {
    const control = this.oilFilterForm.get('price');
    if (control?.errors?.['required']) return 'Price is required';
    if (control?.errors?.['min'])
      return 'Price must be greater than or equal to 0';
    return '';
  }

  // Quantity validation methods
  isQuantityInvalid(): boolean {
    const control = this.oilFilterForm.get('quantity_available');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getQuantityErrorMessage(): string {
    const control = this.oilFilterForm.get('quantity_available');
    if (control?.errors?.['min'])
      return 'Quantity must be greater than or equal to 0';
    return '';
  }

  onSubmit() {
    if (this.oilFilterForm.valid) {
      this.isSubmitting.set(true);
      const formData = this.oilFilterForm.value;

      if (this.isEditMode()) {
        // Update logic
        this.apiService
          .updateOilFilter(this.injectedData?.rowData?.id, formData)
          .pipe(
            take(1),
            finalize(() => {
              this.isSubmitting.set(false);
            })
          )
          .subscribe({
            next: (response) => {
              this.successMessage.set('Oil filter updated successfully');
              this.isSubmitting.set(false);
              this.closeModal();
            },
            error: (err) => {
              this.errorMessage.set(err.error.error);
              this.isSubmitting.set(false);
            },
          });
      } else {
        // Create logic
        this.apiService
          .createOilFilter(formData)
          .pipe(
            take(1),
            finalize(() => {
              this.isSubmitting.set(false);
            })
          )
          .subscribe({
            next: (response) => {
              this.successMessage.set('Oil filter created successfully');
              this.isSubmitting.set(false);
              this.closeModal();
            },
            error: (err) => {
              this.errorMessage.set(err.error.error);
              this.isSubmitting.set(false);
            },
          });
      }
    } else {
      // Mark all fields as touched to show validation errors
      this.oilFilterForm.markAllAsTouched();
    }
  }

  closeModal() {
    // Close modal logic
    this.oilFilterForm.reset();
    this.successMessage.set('');
    this.errorMessage.set('');
    this.dialogRef.close();
  }

  // Method to populate form for editing
  setEditingOilFilter(oilFilter: any) {
    this.editingOilFilter.set(oilFilter);
    this.oilFilterForm.patchValue({
      code: oilFilter.code,
      brand: oilFilter.brand,
      price: oilFilter.price,
      quantity_available: oilFilter.quantity_available || 0,
    });
  }

  // Method to reset form for creating new oil filter
  resetForCreate() {
    this.editingOilFilter.set(null);
    this.oilFilterForm.reset({
      quantity_available: 0,
    });
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}
