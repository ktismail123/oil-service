import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

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
  private injectedData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AddBrandModalComponent>);

  @Output() onClose = new EventEmitter<void>();
  @Output() onBrandAdded = new EventEmitter<any>();

  // Form and state
  brandForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

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
      // if(this.injectedData?.)
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

  // Submit form
  async onSubmit() {
    if (this.brandForm.valid) {
      this.isSubmitting.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      try {
        const brandData = {
          name: this.brandForm.value.name.trim()
        };

        const newBrand = await this.apiService.addBrand(brandData).toPromise();
        
        this.successMessage.set('Brand added successfully!');
        this.onBrandAdded.emit(newBrand);
        
        // Close modal after short delay
        setTimeout(() => {
          this.closeModal();
        }, 1500);

      } catch (error: any) {
        console.error('Error adding brand:', error);
        
        if (error.status === 409) {
          this.errorMessage.set('Brand name already exists');
        } else if (error.status === 400) {
          this.errorMessage.set('Invalid brand data provided');
        } else {
          this.errorMessage.set('Failed to add brand. Please try again.');
        }
      } finally {
        this.isSubmitting.set(false);
      }
    } else {
      this.markFormGroupTouched();
    }
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
    this.brandForm.reset();
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}