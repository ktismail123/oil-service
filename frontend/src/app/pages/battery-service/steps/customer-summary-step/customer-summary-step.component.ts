import { Component, computed, inject, input, output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Accessory, BatteryType } from '../../../../models';
import { CommonModule } from '@angular/common';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
export interface CustomerData {
  name: string;
  mobile: string;
  plateNumber: string;
  laborCost: string;
}

export interface ServiceSummary {
  capacityLabel: string;
  batteryType: BatteryType | null;
  accessories: Accessory[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
}

@Component({
  selector: 'app-customer-summary-step',
  imports: [ReactiveFormsModule, CommonModule, FormFieldComponent],
  templateUrl: './customer-summary-step.component.html',
  styleUrl: './customer-summary-step.component.scss',
})
export class CustomerSummaryStepComponent {
  private fb = inject(FormBuilder);

  // Inputs
  initialCustomerData = input<CustomerData | null>(null);
  serviceSummary = input.required<ServiceSummary>();

  // Outputs
  customerDataChanged = output<CustomerData>();
  validityChanged = output<boolean>();
  submitBooking = output();

  // Signals
  customerForm!: FormGroup;

  // Computed
  summary = computed(() => this.serviceSummary());
  isValid = computed(() => this.customerForm?.valid || false);

  ngOnInit() {
    this.initializeForm();
    this.subscribeToChanges();
    this.loadInitialData();
  }

  private initializeForm() {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      mobile: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{10,15}$/),
          Validators.minLength(10),
        ],
      ],
      plateNumber: ['', [Validators.required, Validators.minLength(1)]],
      laborCost: ['', [Validators.required]],
    });
  }

  private subscribeToChanges() {
    this.customerForm.valueChanges.subscribe((value) => {
      console.log(value);
      
      if (value.laborCost || value.laborCost == '') {
        this.customerDataChanged.emit({
          name: value.name || '',
          mobile: value.mobile || '',
          plateNumber: value.plateNumber || '',
          laborCost: value.laborCost || 0,
        });
      }

      this.validityChanged.emit(this.customerForm.valid);
      if (this.customerForm.valid) {
        this.customerDataChanged.emit({
          name: value.name,
          mobile: value.mobile,
          plateNumber: value.plateNumber,
          laborCost: value.laborCost,
        });
      }
    });

    // Also emit validity on status changes (for validation errors)
    this.customerForm.statusChanges.subscribe(() => {
      this.validityChanged.emit(this.customerForm.valid);
    });
  }

  private loadInitialData() {
    const initial = this.initialCustomerData();
    if (initial) {
      this.customerForm.patchValue(initial);
    }
  }

  formatPrice(price: number): any {
    return price;
  }

  getCustomerData(): CustomerData | null {
    if (this.customerForm.valid) {
      const value = this.customerForm.value;
      return {
        name: value.name,
        mobile: value.mobile,
        plateNumber: value.plateNumber,
        laborCost: value.laborCost,
      };
    }
    return null;
  }

  getFormErrors(): { [key: string]: string[] } {
    const errors: { [key: string]: string[] } = {};

    Object.keys(this.customerForm.controls).forEach((key) => {
      const control = this.customerForm.get(key);
      if (control && control.errors && control.touched) {
        errors[key] = [];

        if (control.errors['required']) {
          errors[key].push(`${this.getFieldDisplayName(key)} is required`);
        }
        if (control.errors['minlength']) {
          errors[key].push(`${this.getFieldDisplayName(key)} is too short`);
        }
        if (control.errors['pattern']) {
          if (key === 'mobile') {
            errors[key].push(
              'Please enter a valid mobile number (10-15 digits)'
            );
          }
        }
      }
    });

    return errors;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      name: 'Customer Name',
      mobile: 'Mobile Number',
      plateNumber: 'Plate Number',
    };
    return displayNames[fieldName] || fieldName;
  }

  onSubmitBooking() {
    this.submitBooking.emit();
  }

  printReceipt() {}

  printThermalReceipt() {}
}
