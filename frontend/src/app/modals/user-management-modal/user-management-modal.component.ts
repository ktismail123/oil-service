import { Component, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-user-management-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management-modal.component.html',
  styleUrl: './user-management-modal.component.scss'
})
export class UserManagementModalComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private dialoagRef = inject(MatDialogRef<UserManagementModalComponent>);

  // Signals for state management
  private _isEditMode = signal(false);
  private _userData = signal<any>(null);
  private _successMessage = signal<string>('');
  private _errorMessage = signal<string>('');
  private _isSubmitting = signal(false);

  // Form definition
  userForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['manager', [Validators.required]]
  });

  // Available roles
  roles = [
    { value: 'manager', label: 'Manager' },
    { value: 'technician', label: 'Technician' }
  ];

  // Computed properties
  isEditMode = computed(() => this._isEditMode());
  userData = computed(() => this._userData());
  successMessage = computed(() => this._successMessage());
  errorMessage = computed(() => this._errorMessage());
  isSubmitting = computed(() => this._isSubmitting());

  // Form control getters
  get nameControl() { return this.userForm.get('name'); }
  get emailControl() { return this.userForm.get('email'); }
  get passwordControl() { return this.userForm.get('password'); }
  get roleControl() { return this.userForm.get('role'); }

  // Validation computed properties
  isNameInvalid = computed(() => 
    this.nameControl?.invalid && (this.nameControl?.dirty || this.nameControl?.touched)
  );

  isEmailInvalid = computed(() => 
    this.emailControl?.invalid && (this.emailControl?.dirty || this.emailControl?.touched)
  );

  isPasswordInvalid = computed(() => 
    this.passwordControl?.invalid && (this.passwordControl?.dirty || this.passwordControl?.touched)
  );

  isRoleInvalid = computed(() => 
    this.roleControl?.invalid && (this.roleControl?.dirty || this.roleControl?.touched)
  );

  // Form state computed properties
  hasFormChanged = computed(() => {
    if (!this.isEditMode()) return false;
    
    const currentValues = this.userForm.value;
    const originalData = this.userData();
    
    if (!originalData) return false;
    
    return (
      currentValues.name !== originalData.name ||
      currentValues.email !== originalData.email ||
      currentValues.password !== originalData.password ||
      currentValues.role !== originalData.role
    );
  });

  isSubmitDisabled = computed(() => 
    this.userForm.invalid || 
    this.isSubmitting() || 
    (this.isEditMode() && !this.hasFormChanged())
  );

  showResetButton = computed(() => 
    this.isEditMode() && this.hasFormChanged() && !this.isSubmitting()
  );

  // Modal title and subtitle
  getModalTitle(): string {
    return this.isEditMode() ? 'Edit User' : 'Add New User';
  }

  getModalSubtitle(): string {
    return this.isEditMode() 
      ? 'Update user information and permissions' 
      : 'Create a new user account with appropriate role';
  }

  // Submit button text and icon
  getSubmitButtonText(): string {
    if (this.isSubmitting()) {
      return this.isEditMode() ? 'Updating...' : 'Creating...';
    }
    return this.isEditMode() ? 'Update User' : 'Create User';
  }

  getSubmitButtonIcon(): string {
    return this.isEditMode() ? 'fas fa-save' : 'fas fa-user-plus';
  }

  // Error message getters
  getNameErrorMessage(): string {
    const control = this.nameControl;
    if (control?.hasError('required')) return 'Name is required';
    if (control?.hasError('minlength')) return 'Name must be at least 2 characters';
    if (control?.hasError('maxlength')) return 'Name cannot exceed 50 characters';
    return '';
  }

  getEmailErrorMessage(): string {
    const control = this.emailControl;
    if (control?.hasError('required')) return 'Email is required';
    if (control?.hasError('email')) return 'Please enter a valid email address';
    return '';
  }

  getPasswordErrorMessage(): string {
    const control = this.passwordControl;
    if (control?.hasError('required')) return 'Password is required';
    if (control?.hasError('minlength')) return 'Password must be at least 8 characters';
    return '';
  }

  getRoleErrorMessage(): string {
    const control = this.roleControl;
    if (control?.hasError('required')) return 'Role is required';
    return '';
  }

  // Public methods to set modal state
  setEditMode(userData: any) {
    this._isEditMode.set(true);
    this._userData.set(userData);
    this.userForm.patchValue({
      name: userData.name,
      email: userData.email,
      password: '', // Don't prefill password in edit mode
      role: userData.role
    });
    this.clearMessages();
  }

  setCreateMode() {
    this._isEditMode.set(false);
    this._userData.set(null);
    this.userForm.reset({ role: 'technician' }); // Default to technician
    this.clearMessages();
  }

  // Form actions
  onSubmit() {
    if (this.userForm.valid && !this.isSubmitting()) {
      this._isSubmitting.set(true);
      this.clearMessages();

      // Simulate API call
      setTimeout(() => {
        try {
          const formData = this.userForm.value;
          
          if (this.isEditMode()) {
            // Update user logic here
            console.log('Updating user:', formData);
            this._successMessage.set(`User "${formData.name}" has been updated successfully!`);
          } else {
            // Create user logic here
            console.log('Creating user:', formData);
            this.apiService.createUser(formData).subscribe({
              next:(res => {
                this._successMessage.set(`User "${formData.name}" has been created successfully!`);
              })
            })
          }

          

        } catch (error) {
          this._errorMessage.set('An error occurred while processing the request. Please try again.');
        } finally {
          this._isSubmitting.set(false);
        }
      }, 1500);
    }
  }

  resetForm() {
    if (this.isEditMode() && this.userData()) {
      this.userForm.patchValue({
        name: this.userData()?.name,
        email: this.userData()?.email,
        password: '',
        role: this.userData()?.role
      });
    } else {
      this.userForm.reset({ role: 'technician' });
    }
    this.clearMessages();
  }

  closeModal() {
    this.clearMessages();
    this.userForm.reset();
    this.dialoagRef.close();
    
    // Emit close event or call parent method
    console.log('Modal closed');
  }

  private clearMessages() {
    this._successMessage.set('');
    this._errorMessage.set('');
  }
}