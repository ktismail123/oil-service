import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize, take } from 'rxjs';

@Component({
  selector: 'app-oil-type-modal',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './oil-type-modal.component.html',
  styleUrl: './oil-type-modal.component.scss',
})
export class OilTypeModalComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private dialogRef = inject(MatDialogRef<OilTypeModalComponent>);
  private injectedData: {
    mode: string;
    rowData: any;
  } = inject(MAT_DIALOG_DATA);

  formData = this.injectedData?.rowData;

  oilTypeForm = this.fb.group({
    name: [
      this.formData?.name || '',
      [Validators.required, Validators.minLength(2)],
    ],
    grade: [this.formData?.grade || '', [Validators.required]],
    brand: [this.formData?.brand || '', [Validators.required]],
    service_interval: [
      this.formData?.service_interval || '',
      [Validators.required],
    ],
    package_1l_available: [
      this.formData?.package_1l_available || '0',
      [Validators.required],
    ],
    package_4l_available: [
      this.formData?.package_4l_available || '0',
      [Validators.required],
    ],
    bulk_available: [
      this.formData?.bulk_available || '0',
      [Validators.required],
    ],
    price_1l: [
      this.formData?.price_1l || '',
      [Validators.required, Validators.min(0)],
    ],
    price_4l: [
      this.formData?.price_4l || '',
      [Validators.required, Validators.min(0)],
    ],
    price_per_liter: [
      this.formData?.price_per_liter || '',
      [Validators.required, Validators.min(0)],
    ],
  });

  brands = signal<any[]>([]);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  isSubmitting = signal<boolean>(false);
  editingOilType = signal<any>(null);

  constructor() {
    if (this.injectedData?.mode === 'edit') {
      this.editingOilType.set(true);
    }
  }

  isEditMode(): boolean {
    return !!this.editingOilType();
  }

  // Validation methods
  isNameInvalid(): boolean {
    const control = this.oilTypeForm.get('name');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getNameErrorMessage(): string {
    const control = this.oilTypeForm.get('name');
    if (control?.errors?.['required']) return 'Oil name is required';
    if (control?.errors?.['minlength'])
      return 'Oil name must be at least 2 characters';
    return '';
  }

  isGradeInvalid(): boolean {
    const control = this.oilTypeForm.get('grade');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getGradeErrorMessage(): string {
    const control = this.oilTypeForm.get('grade');
    if (control?.errors?.['required']) return 'Grade is required';
    return '';
  }

  isBrandInvalid(): boolean {
    const control = this.oilTypeForm.get('brand');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getBrandErrorMessage(): string {
    const control = this.oilTypeForm.get('brand');
    if (control?.errors?.['required']) return 'Brand selection is required';
    return '';
  }

  isServiceIntervalInvalid(): boolean {
    const control = this.oilTypeForm.get('service_interval');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getServiceIntervalErrorMessage(): string {
    const control = this.oilTypeForm.get('service_interval');
    if (control?.errors?.['required']) return 'Service interval is required';
    return '';
  }

  isPrice1lInvalid(): boolean {
    const control = this.oilTypeForm.get('price_1l');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getPrice1lErrorMessage(): string {
    const control = this.oilTypeForm.get('price_1l');
    if (control?.errors?.['required']) return 'Price for 1L is required';
    if (control?.errors?.['min']) return 'Price must be greater than 0';
    return '';
  }

  isPrice4lInvalid(): boolean {
    const control = this.oilTypeForm.get('price_4l');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getPrice4lErrorMessage(): string {
    const control = this.oilTypeForm.get('price_4l');
    if (control?.errors?.['required']) return 'Price for 4L is required';
    if (control?.errors?.['min']) return 'Price must be greater than 0';
    return '';
  }

  isPricePerLiterInvalid(): boolean {
    const control = this.oilTypeForm.get('price_per_liter');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getPricePerLiterErrorMessage(): string {
    const control = this.oilTypeForm.get('price_per_liter');
    if (control?.errors?.['required']) return 'Price per liter is required';
    if (control?.errors?.['min']) return 'Price must be greater than 0';
    return '';
  }

  onSubmit() {
    if (this.oilTypeForm.valid) {
      this.isSubmitting.set(true);
      const formData = this.oilTypeForm.value;

      if (this.isEditMode()) {
        // Update logic
        this.apiService
          .updateOilType(this.injectedData?.rowData?.id, formData)
          .subscribe({
            next: (response) => {
              this.successMessage.set('Oil type updated successfully');
              this.isSubmitting.set(false);
              // Close modal or refresh data
            },
            error: (error) => {
              this.errorMessage.set('Failed to update oil type');
              this.isSubmitting.set(false);
            },
          });
      } else {
        this.apiService
          .createOilType(formData)
          .pipe(
            take(1),
            finalize(() => {
              this.isSubmitting.set(false);
            })
          )
          .subscribe({
            next: (response) => {
              this.successMessage.set('Oil type created successfully');
              this.isSubmitting.set(false);
              // Close modal or refresh data
            },
            error: (error) => {
              this.errorMessage.set('Failed to create oil type');
              this.isSubmitting.set(false);
            },
          });
      }
    }
  }

  closeModal() {
    this.dialogRef.close();
  }
}
