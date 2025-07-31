import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface InjectedData {
  mode: 'add' | 'edit';
  rowData?: {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
  };
}

@Component({
  selector: 'app-add-brand-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-brand-modal.component.html',
  styleUrls: ['./add-brand-modal.component.scss']
})
export class AddBrandModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private injectedData = inject<InjectedData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AddBrandModalComponent>);

  @Output() onClose = new EventEmitter<void>();
  @Output() onBrandAdded = new EventEmitter<any>();
  @Output() onBrandUpdated = new EventEmitter<any>();

  // Form and state
  brandForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  
  // Mode and data signals
  isEditMode = signal(false);
  brandData = signal<any>(null);

  constructor() {
    this.brandForm = this.fb.group({
      name: ['', [
        Validators.required, 
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s-]+$/) // Only letters, spaces, and hyphens
      ]]
    });
  }

  ngOnInit(): void {
    // Check if we have injected data for edit mode
    if (this.injectedData) {
      this.isEditMode.set(this.injectedData.mode === 'edit');
      
      if (this.isEditMode() && this.injectedData.rowData) {
        this.brandData.set(this.injectedData.rowData);
        this.populateForm();
      }
    }
  }

  // Populate form with existing data for edit mode
  private populateForm() {
    const data = this.brandData();
    if (data) {
      this.brandForm.patchValue({
        name: data.name
      });
    }
  }

  // Get modal title based on mode
  getModalTitle(): string {
    return this.isEditMode() ? 'Edit Vehicle Brand' : 'Add New Vehicle Brand';
  }

  // Get modal subtitle based on mode
  getModalSubtitle(): string {
    return this.isEditMode() 
      ? 'Update the brand information' 
      : 'Create a new brand for your vehicle inventory';
  }

  // Get submit button text based on mode and state
  getSubmitButtonText(): string {
    if (this.isSubmitting()) {
      return this.isEditMode() ? 'Updating...' : 'Adding...';
    }
    return this.isEditMode() ? 'Update Brand' : 'Add Brand';
  }

  // Get submit button icon based on mode
  getSubmitButtonIcon(): string {
    return this.isEditMode() ? 'fas fa-save' : 'fas fa-plus';
  }

  // Form validation helpers
  get nameControl() {
    return this.brandForm.get('name');
  }

  get isNameInvalid() {
    return this.nameControl?.invalid && (this.nameControl?.dirty || this.nameControl?.touched);
  }

  getNameErrorMessage(): string {
    const control = this.nameControl;
    if (control?.errors?.['required']) {
      return 'Brand name is required';
    }
    if (control?.errors?.['minlength']) {
      return 'Brand name must be at least 2 characters long';
    }
    if (control?.errors?.['maxlength']) {
      return 'Brand name cannot exceed 50 characters';
    }
    if (control?.errors?.['pattern']) {
      return 'Brand name can only contain letters, spaces, and hyphens';
    }
    return '';
  }

  // Check if form has changes (for edit mode)
  hasFormChanged(): boolean {
    if (!this.isEditMode()) return true;
    
    const currentData = this.brandData();
    const formValue = this.brandForm.value;
    
    return currentData?.name !== formValue.name?.trim();
  }

  // Submit form
  async onSubmit() {
    if (this.brandForm.valid) {
      this.isSubmitting.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      try {
        const brandDataToSubmit = {
          name: this.brandForm.value.name.trim()
        };

        let result;
        if (this.isEditMode()) {
          // Update existing brand
          const currentData = this.brandData();
          result = await this.apiService.updateBrand(currentData.id, brandDataToSubmit).toPromise();
          
          this.successMessage.set('Brand updated successfully!');
          this.onBrandUpdated.emit(result);
        } else {
          // Add new brand
          result = await this.apiService.addBrand(brandDataToSubmit).toPromise();
          
          this.successMessage.set('Brand added successfully!');
          this.onBrandAdded.emit(result);
        }
        
        // Close modal after short delay
        setTimeout(() => {
          this.closeModal();
        }, 1500);

      } catch (error: any) {
        console.error(`Error ${this.isEditMode() ? 'updating' : 'adding'} brand:`, error);
        
        if (error.status === 409) {
          this.errorMessage.set('Brand name already exists');
        } else if (error.status === 400) {
          this.errorMessage.set('Invalid brand data provided');
        } else if (error.status === 404 && this.isEditMode()) {
          this.errorMessage.set('Brand not found');
        } else {
          const action = this.isEditMode() ? 'update' : 'add';
          this.errorMessage.set(`Failed to ${action} brand. Please try again.`);
        }
      } finally {
        this.isSubmitting.set(false);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  // Check if submit button should be disabled
  isSubmitDisabled(): boolean {
    return this.brandForm.invalid || 
           this.isSubmitting() || 
           (this.isEditMode() && !this.hasFormChanged());
  }

  // Mark all form fields as touched to show validation errors
  private markFormGroupTouched() {
    Object.keys(this.brandForm.controls).forEach(key => {
      const control = this.brandForm.get(key);
      control?.markAsTouched();
    });
  }

  // Close modal
  closeModal() {
    this.dialogRef.close();
  }

  // Reset form
  resetForm() {
    if (this.isEditMode()) {
      // In edit mode, reset to original values
      this.populateForm();
    } else {
      // In add mode, clear the form
      this.brandForm.reset();
    }
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  // Check if we can show the reset button
  showResetButton(): boolean {
    return this.isEditMode() ? this.hasFormChanged() : this.brandForm.dirty;
  }
}