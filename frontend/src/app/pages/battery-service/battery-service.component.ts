// battery-service.component.ts - Updated Main Component
import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize, take } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { BookingService } from '../../services/booking.service';

import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { StepIndicatorComponent } from '../../shared/components/step-indicator/step-indicator.component';

// Import step components
import { BatteryCapacityStepComponent } from './steps/battery-capacity-step/battery-capacity-step.component';
import { BatteryBrandStepComponent } from './steps/battery-brand-step/battery-brand-step.component';
import { AccessoriesStepComponent } from './steps/accessories-step/accessories-step.component';
import {
  CustomerData,
  CustomerSummaryStepComponent,
  ServiceSummary,
} from './steps/customer-summary-step/customer-summary-step.component';
import { Accessory, BatteryType } from '../../models';
import { getVatExclusive } from '../../utils/vat-calculation';

@Component({
  selector: 'app-battery-service',
  standalone: true,
  imports: [
    CommonModule,
    LoadingComponent,
    StepIndicatorComponent,
    BatteryCapacityStepComponent,
    BatteryBrandStepComponent,
    AccessoriesStepComponent,
    CustomerSummaryStepComponent,
  ],
  templateUrl: './battery-service.component.html',
  styleUrls: ['./battery-service.component.css'],
})
export class BatteryServiceComponent implements OnInit {
  private apiService = inject(ApiService);
  private bookingService = inject(BookingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Step management
  currentStep = signal(1);
  totalSteps = signal(4);
  steps = ['Capacity', 'Brand', 'Accessories', 'Summary'];

  // Loading states
  isLoading = signal(false);
  isSubmitting = signal(false);
  billNumber = signal('');
  createdAt = signal('');

  // Data signals
  batteryTypes = signal<BatteryType[]>([]);
  accessories = signal<Accessory[]>([]);

  // Selection signals
  selectedCapacity = signal<number | null>(null);
  selectedBatteryTypeId = signal<number | null>(null);
  selectedBatteryType = signal<BatteryType | null>(null);
  selectedAccessories = signal<Accessory[]>([]);
  customerData = signal<CustomerData | null>(null);

  // Validation signals
  step1Valid = signal(false);
  step2Valid = signal(false);
  step3Valid = signal(true); // Always valid (optional)
  step4Valid = signal(false);

  mode = '';
  editData: any;

  // Computed properties
  canProceed = computed(() => {
    switch (this.currentStep()) {
      case 1:
        return this.step1Valid();
      case 2:
        return this.step2Valid();
      case 3:
        return this.step3Valid();
      case 4:
        return this.step4Valid();
      default:
        return false;
    }
  });

  capacityOptions = signal<any[]>([]);
  laborCost = signal(0);
  discount = signal(0);

  subtotal = computed(() => {
    let total = 0;

    // Add battery cost
    const batteryType = this.selectedBatteryType();
    if (batteryType?.price) {
      total += Number(batteryType.price);
    }

    // Add accessories cost
    this.selectedAccessories().forEach((acc) => {
      if (acc.price && acc.quantity) {
        total += Number(acc.price) * Number(acc.quantity);
      }
    });
    total += this.laborCost();
    total -= this.discount();
    return total;
  });

  // vatAmount = computed(() => (this.subtotal() * 5) / 100);
  vatAmount = computed(() => {
    const sub = this.subtotal();

    if (typeof sub !== 'number') return 0;

    // ✅ If subtotal already INCLUDES VAT
    const { vatAmount } = getVatExclusive(sub);

    return vatAmount;
  });
  totalAmount = computed(() => this.subtotal() + this.vatAmount());

  constructor() {
    // Get router state data
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state?.['item']) {
      this.editData = nav.extras.state['item'];
      console.log(this.editData);
    }

    // Get query param
    this.route.queryParams.subscribe((params) => {
      this.mode = params['mode'] || null;
    });
  }

  ngOnInit() {
    this.loadBatteryTpes();
    if (this.mode === 'edit') {
      this.patchValues();
    }
  }

  loadBatteryTpes(): void {
    this.apiService
      .getBatteryTypes()
      .pipe(take(1))
      .subscribe({
        next: (res: any) => {
          this.capacityOptions.set(res);
          if (this.mode === 'edit') {
            const selected = this.capacityOptions().find(
              (el) => el.id === this.selectedBatteryTypeId()
            );

            this.selectedBatteryTypeId.set(selected.id);
            this.selectedBatteryType.set(selected);
          }
        },
      });
  }

  patchValues() {
    this.selectedCapacity.set(this.editData?.battery_capacity);
    this.selectedBatteryTypeId.set(this.editData?.battery_type_id);

    this.selectedAccessories.set(this.editData?.accessories);
    this.customerData.set({
      name: this.editData?.customer?.name,
      mobile: this.editData?.customer?.mobile,
      plateNumber: this.editData?.vehicle?.plate_number,
      laborCost: this.editData?.labour_cost,
      memo: this.editData?.memo,
      discount: this.editData?.discount,
    });
    this.laborCost.set(this.editData?.laborCost);
    this.discount.set(this.editData?.discount);
    this.currentStep.set(4);
    this.billNumber.set(this.editData?.bill_number);
    this.createdAt.set(this.editData?.created_at);
  }

  private async loadInitialData() {
    this.isLoading.set(true);
    try {
      const [batteryTypes, accessories] = await Promise.all([
        this.apiService.getBatteryTypes().toPromise(),
        this.apiService.getAccessories('battery_service').toPromise(),
      ]);

      this.batteryTypes.set(batteryTypes || []);
      this.accessories.set(
        (accessories || []).map((acc) => ({ ...acc, quantity: 0 }))
      );
    } catch (error) {
      console.error('Data loading failed:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Step navigation
  nextStep() {
    if (this.canProceed() && this.currentStep() < this.totalSteps()) {
      this.currentStep.update((step) => step + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update((step) => step - 1);
    }
  }

  // Event handlers
  onCapacitySelected(capacity: number) {
    this.selectedCapacity.set(capacity);
    // Reset subsequent selections
    this.selectedBatteryTypeId.set(null);
    this.selectedBatteryType.set(null);
    this.step2Valid.set(false);
  }

  onStep1ValidityChanged(isValid: boolean) {
    this.step1Valid.set(isValid);
  }

  onBrandSelected(batteryType: BatteryType) {
    this.selectedBatteryTypeId.set(batteryType.id);
    this.selectedBatteryType.set(batteryType);
    this.currentStep.update((step) => step + 1);
  }

  onStep2ValidityChanged(isValid: boolean) {
    this.step2Valid.set(isValid);
  }

  onAccessoriesChanged(accessories: Accessory[]) {
    this.selectedAccessories.set(accessories);
  }

  onSkipAccessoriesEmit() {
    this.currentStep.update((step) => step + 1);
  }

  onCustomerDataChanged(data: CustomerData) {
    this.customerData.set(data);
    this.laborCost.set(Number(data?.laborCost));
    this.discount.set(Number(data?.discount));
  }

  onStep4ValidityChanged(isValid: boolean) {
    this.step4Valid.set(isValid);
  }

  // Helper methods
  getCapacityLabel(): string {
    const capacity = this.selectedCapacity();
    console.log(this.capacityOptions(), ',---------------');
    console.log(capacity, ',---------------');

    const option = this.capacityOptions().find(
      (opt) => opt.capacity === capacity
    );
    return option ? option.capacity : '';
  }

  getServiceSummary(): ServiceSummary {
    return {
      capacityLabel: this.getCapacityLabel(),
      batteryType: this.selectedBatteryType(),
      accessories: this.selectedAccessories(),
      subtotal: this.subtotal(),
      vatAmount: this.vatAmount(),
      totalAmount: this.totalAmount(),
      // totalAmount: this.totalAmount()
    };
  }

  // Submit booking
  submitBooking() {
    if (!this.canProceed()) return;
    const customer = this.customerData();
    if (!customer) return;
    this.isSubmitting.set(true);

    let userData: any = null;

    try {
      const stored = localStorage.getItem('userData');
      if (stored) {
        userData = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to parse userData from localStorage:', error);
      userData = null; // fallback
    }

    const bookingData = {
      customer: {
        name: customer.name,
        mobile: customer.mobile,
      },
      vehicle: {
        brandId: null, // Default brand for battery service
        modelId: null, // Default model for battery service
        plateNumber: customer.plateNumber,
      },
      service: {
        type: 'battery_replacement' as const,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        batteryTypeId: this.selectedBatteryTypeId(),
        subtotal: this.subtotal(),
        vatAmount: this.vatAmount(),
        totalAmount: this.subtotal(),
        laborCost: this.laborCost(),
        memo: customer.memo,
        createdBy: userData?.userId,
        discount: this.discount(),
      },
      accessories: this.selectedAccessories(),
    };

    if (this.mode === 'edit') {
      this.apiService
        .updateBooking(this.editData?.id, bookingData as any)
        .pipe(
          take(1),
          finalize(() => {
            this.isSubmitting.set(true);
          })
        )
        .subscribe({
          next: (res) => {
            alert('Successfully Updated');
          },
        });
    } else {
      this.apiService
        .createBooking(bookingData as any)
        .pipe(
          take(1),
          finalize(() => {
            this.isSubmitting.set(true);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              alert('Successfully Created');
              this.billNumber.set(res?.billNumber);
              this.createdAt.set(res?.created_at);
            }
          },
        });
    }
  }

  backToHome() {
    this.router.navigate(['/']);
  }

  gotToNextStep() {
    this.currentStep.update((step) => step + 1);
  }
}
