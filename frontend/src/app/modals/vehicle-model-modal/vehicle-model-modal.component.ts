import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { finalize, pipe, take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-vehicle-model-modal',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './vehicle-model-modal.component.html',
  styleUrl: './vehicle-model-modal.component.scss',
})
export class VehicleModelModalComponent implements OnInit {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<VehicleModelModalComponent>);
  private injectedData: {
    mode: string;
    rowData: { brand_id: number; name: string, id: number };
  } = inject(MAT_DIALOG_DATA);

  modelForm!: FormGroup;

  brands = signal<any[]>([]);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  isSubmitting = signal<boolean>(false);
  editingModel = signal<any>(false);

  ngOnInit(): void {
    this.loadBrands();
    this.inifForm();
  }

  inifForm() {
    if (this.injectedData?.mode === 'edit') {
      this.editingModel.set(true);
    }
    this.modelForm = this.fb.group({
      brand_id: [
        this.injectedData?.rowData?.brand_id || '',
        [Validators.required, Validators.minLength(1)],
      ],
      name: [this.injectedData?.rowData?.name || '', [Validators.required]],
    });
  }

  isEditMode(): boolean {
    return !!this.editingModel();
  }

  loadBrands(): void {
    this.apiService
      .getBrands()
      .pipe(take(1))
      .subscribe({
        next: (res) => [this.brands.set(res)],
      });
  }

  isModelNameInvalid(): boolean {
    const control = this.modelForm.get('name');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getModelNameErrorMessage(): string {
    const control = this.modelForm.get('name');
    if (control?.errors?.['required']) return 'Model name is required';
    if (control?.errors?.['minlength'])
      return 'Model name must be at least 2 characters';
    return '';
  }

  isBrandNameInvalid(): boolean {
    const control = this.modelForm.get('brand_id');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getBrandNameErrorMessage(): string {
    const control = this.modelForm.get('brand_id');
    if (control?.errors?.['required']) return 'Brand selection is required';
    return '';
  }

  onSubmit() {
    if (this.modelForm.valid) {
      this.isSubmitting.set(true);

      // Your submit logic here
      if (this.isEditMode()) {
        this.updateModel();
      } else {
        this.createModel();
      }
    }
  }

  closeModal() {
    this.dialogRef.close();
  }

  createModel() {
    const formData = this.modelForm.value;
    this.apiService
      .createVehicleModel(formData)
      .pipe(
        take(1),
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.successMessage.set('Successfully Added');
            this.closeModal();
          }
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.error);
        },
      });
  }

  updateModel(){
     const formData = this.modelForm.value;
    this.apiService
      .updateVehicleModel(formData, this.injectedData?.rowData?.id)
      .pipe(
        take(1),
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.successMessage.set('Successfully Updated');
            this.closeModal();
          }
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.error);
        },
      });
  }
}
