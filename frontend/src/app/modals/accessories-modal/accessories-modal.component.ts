import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { finalize, take } from 'rxjs';

@Component({
  selector: 'app-accessories-modal',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './accessories-modal.component.html',
  styleUrl: './accessories-modal.component.scss',
})
export class AccessoriesModalComponent {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AccessoriesModalComponent>);
  private injectedData: {
    mode: string;
    rowData: any;
  } = inject(MAT_DIALOG_DATA);

  accessoryForm = this.fb.group({
    name: [
      this.injectedData?.rowData?.name,
      [Validators.required, Validators.minLength(2)],
    ],
    category: [this.injectedData?.rowData?.category, [Validators.required]],
    price: [
      this.injectedData?.rowData?.price,
      [Validators.required, Validators.min(0)],
    ],
    quantity_available: [0], // Not shown in template but set as default 0
  });

  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  isSubmitting = signal<boolean>(false);
  editingAccessory = signal<any>(null);

  constructor() {
    if (this.injectedData?.mode === 'edit') {
      this.editingAccessory.set(true);
    }
  }

  isEditMode(): boolean {
    return !!this.editingAccessory();
  }

  // Name validation methods
  isNameInvalid(): boolean {
    const control = this.accessoryForm.get('name');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getNameErrorMessage(): string {
    const control = this.accessoryForm.get('name');
    if (control?.errors?.['required']) return 'Accessory name is required';
    if (control?.errors?.['minlength'])
      return 'Accessory name must be at least 2 characters';
    return '';
  }

  // Category validation methods
  isCategoryInvalid(): boolean {
    const control = this.accessoryForm.get('category');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getCategoryErrorMessage(): string {
    const control = this.accessoryForm.get('category');
    if (control?.errors?.['required']) return 'Category is required';
    return '';
  }

  // Price validation methods
  isPriceInvalid(): boolean {
    const control = this.accessoryForm.get('price');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getPriceErrorMessage(): string {
    const control = this.accessoryForm.get('price');
    if (control?.errors?.['required']) return 'Price is required';
    if (control?.errors?.['min'])
      return 'Price must be greater than or equal to 0';
    return '';
  }

  onSubmit() {
    if (this.accessoryForm.valid) {
      this.isSubmitting.set(true);

      if (this.isEditMode()) {
        this.updateAccessory();
      } else {
        this.createAccessory();
      }
    } else {
      // Mark all fields as touched to show validation errors
      this.accessoryForm.markAllAsTouched();
    }
  }

  createAccessory() {
    const formData = this.accessoryForm.value;
    this.apiService
      .createAccessory(formData)
      .pipe(
        take(1),
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage.set('Accessory created successfully');
          this.isSubmitting.set(false);
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.error);
          this.isSubmitting.set(false);
        },
      });
  }

  updateAccessory() {
    const formData = this.accessoryForm.value;
    this.apiService
      .updateAccessory(this.injectedData?.rowData?.id, formData)
      .pipe(
        take(1),
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage.set('Accessory updated successfully');
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
    this.accessoryForm.reset();
    this.successMessage.set('');
    this.errorMessage.set('');
    this.dialogRef.close();
  }

  // Method to populate form for editing
  setEditingAccessory(accessory: any) {
    this.editingAccessory.set(accessory);
    this.accessoryForm.patchValue({
      name: accessory.name,
      category: accessory.category,
      price: accessory.price,
      quantity_available: accessory.quantity_available || 0,
    });
  }

  // Method to reset form for creating new accessory
  resetForCreate() {
    this.editingAccessory.set(null);
    this.accessoryForm.reset({
      quantity_available: 0,
    });
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}
