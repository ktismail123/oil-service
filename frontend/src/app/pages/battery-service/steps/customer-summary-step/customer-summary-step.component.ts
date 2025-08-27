import { Component, computed, inject, input, output, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Accessory, BatteryType } from '../../../../models';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { debounceTime, distinctUntilChanged, filter, take } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
export interface CustomerData {
  name: string;
  mobile: string;
  plateNumber: string;
  laborCost: string;
  memo?: string;
  discount: string;
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
  imports: [ReactiveFormsModule, CommonModule, FormFieldComponent, CurrencyPipe],
  templateUrl: './customer-summary-step.component.html',
  styleUrl: './customer-summary-step.component.scss',
})
export class CustomerSummaryStepComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  environment = environment;
  editMode = this.route.snapshot.queryParams['mode'];
  buttonText = this.editMode === 'edit' ? 'Update' : 'Confirm Booking';

  laborCost = input(0);

  // Inputs
  initialCustomerData = input<CustomerData | null>(null);
  serviceSummary = input.required<ServiceSummary>();

  // Outputs
  customerDataChanged = output<CustomerData>();
  validityChanged = output<boolean>();
  submitBooking = output();
  billNumber = input('');
  status = input('');

  // Signals
  customerForm!: FormGroup;
  formattedDate: string;

  constructor() {
    const today = new Date();
    this.formattedDate = today.toISOString().split('T')[0];
  }

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
      name: [''],
      mobile: [
        '',
        [
          Validators.pattern(/^\d{10,15}$/),
        ],
      ],
      plateNumber: ['', [Validators.required, Validators.minLength(1)]],
      laborCost: ['', Validators.required],
      discount: [''],
      memo: [''],
    });
    this.setupPlateNumberCheck();
  }

  private setupPlateNumberCheck() {
    this.customerForm
      .get('plateNumber')
      ?.valueChanges.pipe(
        filter((plateNumber) => plateNumber?.length >= 4), // Adjust minimum length as needed
        distinctUntilChanged(),
        debounceTime(500) // Add debounce to avoid too many API calls
      )
      .subscribe((plateNumber) => {
        console.log('Plate number changed:', plateNumber);
        this.checkUserByPlate(plateNumber);
      });
  }

  checkUserByPlate(plateNumber: string) {
    this.apiService
      .checkCustomerByPlate(plateNumber)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res) {
            this.customerForm.patchValue({
              name: res[0]?.customer_name,
              mobile: res[0]?.customer_mobile,
            });
          }
        },
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
          memo: value.memo || '',
          discount: value?.discount || 0
        });
      }

      this.validityChanged.emit(this.customerForm.valid);
      if (this.customerForm.valid) {
        this.customerDataChanged.emit({
          name: value.name,
          mobile: value.mobile,
          plateNumber: value.plateNumber,
          laborCost: value.laborCost,
          memo: value.memo,
          discount: value.discount
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
        memo: value.memo,
        discount: value.discount
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

  printReceipt(): void {
    const receiptContent = document.getElementById('receipt-content');

    if (receiptContent) {
      const clonedContent = receiptContent.cloneNode(true) as HTMLElement;

      // Remove customer details form section
      const customerDetailsSection = clonedContent.querySelector(
        '.border-b.border-dashed.border-gray-300.pb-4.mb-4.print\\:hidden'
      );
      if (customerDetailsSection) {
        customerDetailsSection.remove();
      }

      const printWindow = window.open('', '_blank', 'width=350,height=1000'); // 80mm ≈ 350px

      if (printWindow) {
        printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tech Lube Receipt</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0mm;
            }
            html, body {
              width: 80mm;
              margin: 0 auto;
              padding: 0;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              background: white;
            }

            /* FORCE ALL TEXT AND BORDERS TO BLACK */
            * {
              color: #000 !important;
              border-color: #000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print-wrapper {
              width: 100%;
              display: flex;
              justify-content: center;
            }

            .receipt-container {
              width: 80mm;
              max-width: 80mm;
              padding: 5mm;
              box-sizing: border-box;
            }

            h1 {
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 4px;
            }

            h3 {
              font-size: 14px;
              font-weight: bold;
              text-align: center;
              margin: 12px 0 8px 0;
            }

            .text-center { text-align: center; }
            .text-xs { font-size: 10px; }
            .text-sm { font-size: 11px; }
            .text-lg { font-size: 14px; font-weight: bold; }

            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: bold; }

            .border-b-2 { border-bottom: 2px dashed #000; }
            .border-b { border-bottom: 1px dashed #000; }
            .border-t-2 { border-top: 2px dashed #000; }

            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-3 { margin-bottom: 12px; }
            .mb-4 { margin-bottom: 16px; }
            .mt-1 { margin-top: 4px; }
            .pb-4 { padding-bottom: 16px; }
            .pt-2 { padding-top: 8px; }
            .pt-4 { padding-top: 16px; }

            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .flex-1 { flex: 1; }
            .text-right { text-align: right; }

            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-2 > * + * { margin-top: 8px; }

            .print\\:hidden, .hidden {
              display: none !important;
            }
            .print\\:block {
              display: block !important;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            <div class="receipt-container">
              ${clonedContent.innerHTML}
            </div>
          </div>
        </body>
        </html>
      `);

        printWindow.document.close();

        printWindow.onload = function () {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        };
      }
    }
  }

  printThermalReceipt() {}

  getTotalAccessoryAmount(): number {
  if (!this.summary().accessories || this.summary().accessories?.length === 0) {
    return 0;
  }

  return this.summary().accessories.reduce((total, item) => {
    const qty = item.quantity ?? 1; // default 1 if not provided
    return total + (item.price * qty);
  }, 0);
}

}
