// battery-service.component.ts - Updated Main Component
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { distinctUntilChanged, filter, finalize, take } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { BookingService } from '../../services/booking.service';

import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { StepIndicatorComponent } from '../../shared/components/step-indicator/step-indicator.component';

// Import step components
import {
  BatteryCapacityStepComponent,
  CapacityOption,
} from './steps/battery-capacity-step/battery-capacity-step.component';
import { BatteryBrandStepComponent } from './steps/battery-brand-step/battery-brand-step.component';
import { AccessoriesStepComponent } from './steps/accessories-step/accessories-step.component';
import {
  CustomerData,
  CustomerSummaryStepComponent,
  ServiceSummary,
} from './steps/customer-summary-step/customer-summary-step.component';
import { Accessory, BatteryType } from '../../models';

@Component({
  selector: 'app-battery-service',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
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

  capacityOptions = signal<CapacityOption[]>([]);
  laborCost = signal(0);

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
    return total;
  });

  vatAmount = computed(() => (this.subtotal() * 5) / 100);
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
    // this.loadInitialData();
    if (this.mode === 'edit') {
      this.patchValues();
    }
  }

  patchValues() {
    this.selectedCapacity.set(this.editData?.battery_capacity);
    this.selectedBatteryTypeId.set(this.editData?.battery_type_id);
    this.selectedAccessories.set(this.editData?.accessories);
    this.customerData.set({
      name: this.editData?.customer_name,
      mobile: this.editData?.customer_mobile,
      plateNumber: this.editData?.plate_number,
      laborCost: this.editData?.labour_cost,
    });
    this.currentStep.set(4);
    this.billNumber.set(this.editData?.bill_number);
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
  }

  onStep4ValidityChanged(isValid: boolean) {
    this.step4Valid.set(isValid);
  }

  // Helper methods
  getCapacityLabel(): string {
    const capacity = this.selectedCapacity();
    const option = this.capacityOptions().find((opt) => opt.value === capacity);
    return option ? option.label : '';
  }

  getServiceSummary(): ServiceSummary {
    return {
      capacityLabel: this.getCapacityLabel(),
      batteryType: this.selectedBatteryType(),
      accessories: this.selectedAccessories(),
      subtotal: this.subtotal(),
      vatAmount: this.vatAmount(),
      totalAmount: this.subtotal(),
      // totalAmount: this.totalAmount()
    };
  }

  // Submit booking
  submitBooking() {
    if (!this.canProceed()) return;
    const customer = this.customerData();
    if (!customer) return;
    this.isSubmitting.set(true);

    const bookingData = {
      customer: {
        name: customer.name,
        mobile: customer.mobile,
      },
      vehicle: {
        brandId: 1, // Default brand for battery service
        modelId: 1, // Default model for battery service
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
            alert('Successfyll Updated');
            this.router.navigate(['/control-panel']);
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
            if(res.success){
              this.billNumber.set(res?.billNumber)
            }
            // alert('Successfyll Created');
            this.router.navigate(['/']);
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
