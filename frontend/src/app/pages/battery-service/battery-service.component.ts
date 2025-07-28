import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ApiService } from '../../services/api.service';
import { BookingService } from '../../services/booking.service';
import { BatteryType, Accessory } from '../../models';

import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { StepIndicatorComponent } from '../../shared/components/step-indicator/step-indicator.component';
import { distinctUntilChanged, filter } from 'rxjs';

@Component({
  selector: 'app-battery-service',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    LoadingComponent,
    FormFieldComponent,
    StepIndicatorComponent,
  ],
  templateUrl: './battery-service.component.html',
  styleUrls: ['./battery-service.component.css'],
})
export class BatteryServiceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private bookingService = inject(BookingService);
  private router = inject(Router);

  currentStep = signal(1);
  totalSteps = signal(4);  // Updated to 4 steps
  isLoading = signal(false);
  isSubmitting = signal(false);

  batteryTypes = signal<BatteryType[]>([]);
  accessories = signal<Accessory[]>([]);
  selectedAccessories = signal<Accessory[]>([]);

  // Updated validation flags for 4 steps
  step1Valid = signal(false); // Step 1: Capacity selection
  step2Valid = signal(false); // Step 2: Brand selection  
  step3Valid = signal(true);  // Step 3: Accessories (optional)
  step4Valid = signal(false); // Step 4: Customer details

  // Simple computed to check if current step is valid
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

  subtotal = computed(() => {
    const result = this.calculateSubtotal();
    return typeof result === 'number' ? result : 0;
  });
  vatAmount = computed(() => {
    const sub = this.subtotal();
    return typeof sub === 'number' ? (sub * 15) / 100 : 0;
  });
  totalAmount = computed(() => {
    const sub = this.subtotal();
    const vat = this.vatAmount();
    return (
      (typeof sub === 'number' ? sub : 0) + (typeof vat === 'number' ? vat : 0)
    );
  });

  capacityForm!: FormGroup;
  brandForm!: FormGroup;
  customerForm!: FormGroup;

  capacityOptions = signal([
    {
      value: 80,
      label: '80 Amp',
      description: 'Suitable for small to medium cars',
    },
    { value: 90, label: '90 Amp', description: 'Suitable for medium cars' },
    {
      value: 110,
      label: '110 Amp',
      description: 'Suitable for large cars and SUVs',
    },
  ]);

  // Available battery brands grouped by capacity
  batteryBrands = computed(() => {
    const selectedCapacity = this.capacityForm?.get('capacity')?.value;
    if (!selectedCapacity) return [];

    return this.batteryTypes().filter(
      (battery) => battery.capacity === selectedCapacity
    );
  });

  steps = ['Capacity', 'Brand', 'Accessories', 'Summary']; // Updated steps

  ngOnInit() {
    this.initializeForms();
    this.loadInitialData();
  }

  private initializeForms() {
    this.capacityForm = this.fb.group({
      capacity: [''],
    });

    this.brandForm = this.fb.group({
      batteryTypeId: [''],
    });

    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
      plateNumber: ['', Validators.required],
    });

    // Subscribe to customer form changes for step 4 validation
    this.customerForm.valueChanges.subscribe(() => {
      this.step4Valid.set(this.customerForm.valid);
    });

    this.customerForm
      .get('mobile')
      ?.valueChanges.pipe(
        filter((value) => value?.length === 10),
        distinctUntilChanged()
      )
      .subscribe((mobile) => {
        this.getUserDetails(mobile);
      });
  }

  getUserDetails(mobile: number) {
    this.apiService.checkCustomer(mobile.toString()).subscribe({
      next: (res) => {
        const result = res[0];
        this.customerForm.patchValue({
          name: result?.name || '',
          plateNumber: result?.plate_number || '',
        });
      },
    });
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

  nextStep() {
    if (!this.canProceed()) {
      return;
    }
    if (this.currentStep() < this.totalSteps()) {
      this.currentStep.update((step) => step + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update((step) => step - 1);
    }
  }

  // Step 1: Capacity Selection (previously step 2)
  selectCapacity(capacity: number) {
    this.capacityForm.get('capacity')?.setValue(capacity);
    // Clear previously selected battery brand when capacity changes
    this.brandForm.get('batteryTypeId')?.setValue('');
    this.validateStep1();
    this.resetFromStep(2); // Reset subsequent steps
  }

  private validateStep1() {
    const capacity = this.capacityForm.get('capacity')?.value;
    this.step1Valid.set(!!capacity);
  }

  // Step 2: Battery Brand Selection (previously step 3)
  selectBatteryBrand(batteryType: BatteryType) {
    this.brandForm.get('batteryTypeId')?.setValue(batteryType.id);
    this.validateStep2();
  }

  private validateStep2() {
    const batteryTypeId = this.brandForm.get('batteryTypeId')?.value;
    this.step2Valid.set(!!batteryTypeId);
  }

  // Step 3: Accessories (previously step 4) - Optional, always valid
  addAccessory(accessory: Accessory) {
    const current = this.selectedAccessories();
    const index = current.findIndex((a) => a.id === accessory.id);

    if (index >= 0) {
      const updated = [...current];
      updated[index] = {
        ...updated[index],
        quantity: (updated[index].quantity || 0) + 1,
      };
      this.selectedAccessories.set(updated);
    } else {
      this.selectedAccessories.set([...current, { ...accessory, quantity: 1 }]);
    }
  }

  removeAccessory(accessoryId: number) {
    const current = this.selectedAccessories();
    const index = current.findIndex((a) => a.id === accessoryId);

    if (index >= 0) {
      const updated = [...current];
      if ((updated[index].quantity || 0) > 1) {
        updated[index] = {
          ...updated[index],
          quantity: updated[index].quantity! - 1,
        };
      } else {
        updated.splice(index, 1);
      }
      this.selectedAccessories.set(updated);
    }
  }

  // Helper method to reset validation from a specific step
  private resetFromStep(step: number) {
    if (step <= 2) {
      this.step2Valid.set(false);
      this.brandForm.reset();
    }
    if (step <= 3) {
      this.selectedAccessories.set([]);
    }
    if (step <= 4) {
      this.step4Valid.set(false);
      this.customerForm.reset();
    }
  }

  private calculateSubtotal(): number {
    let total = 0;

    try {
      // Add battery cost
      const batteryTypeId = this.brandForm?.get('batteryTypeId')?.value;

      console.log('Battery calculation:', {
        batteryTypeId,
        batteryTypes: this.batteryTypes(),
      }); // Debug log

      if (batteryTypeId) {
        const battery = this.batteryTypes().find((b) => b.id == batteryTypeId); // Use == instead of === for type flexibility
        console.log('Found battery:', battery); // Debug log
        if (battery && battery.price) {
          const batteryCost = Number(battery.price);
          total += batteryCost;
          console.log('Battery cost added:', batteryCost); // Debug log
        }
      }

      // Add accessories cost
      const accessories = this.selectedAccessories();
      console.log('Accessories calculation:', accessories); // Debug log

      if (accessories && Array.isArray(accessories)) {
        accessories.forEach((acc) => {
          if (acc && acc.price && acc.quantity) {
            const accessoryCost = Number(acc.price) * Number(acc.quantity);
            total += accessoryCost;
            console.log(
              'Accessory cost added:',
              accessoryCost,
              'for',
              acc.name
            ); // Debug log
          }
        });
      }

      console.log('Final total:', total); // Debug log
    } catch (error) {
      console.error('Error calculating subtotal:', error);
      return 0;
    }

    return total || 0;
  }

  async submitBooking() {
    if (!this.canProceed()) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      const bookingData = {
        customer: {
          name: this.customerForm.get('name')?.value,
          mobile: this.customerForm.get('mobile')?.value,
        },
        vehicle: {
          brandId: 1, // Default brand for battery service
          modelId: 1, // Default model for battery service
          plateNumber: this.customerForm.get('plateNumber')?.value,
        },
        service: {
          type: 'battery_replacement' as const,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0],
          batteryTypeId: this.brandForm.get('batteryTypeId')?.value,
          subtotal: this.subtotal(),
          vatAmount: this.vatAmount(),
          totalAmount: this.totalAmount(),
        },
        accessories: this.selectedAccessories(),
      };

      const response = await this.apiService
        .createBooking(bookingData)
        .toPromise();
      alert(
        `Booking created successfully! Total: AED ${this.totalAmount().toFixed(
          2
        )}`
      );
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  getSelectedCapacity(): number {
    return this.capacityForm.get('capacity')?.value;
  }

  getSelectedBatteryType(): BatteryType | undefined {
    const batteryTypeId = this.brandForm.get('batteryTypeId')?.value;
    return this.batteryTypes().find((battery) => battery.id == batteryTypeId);
  }

  getCapacityLabel(): string {
    const capacity = this.getSelectedCapacity();
    const option = this.capacityOptions().find((opt) => opt.value === capacity);
    return option ? option.label : '';
  }

  getBatteryPrice(): number {
    const battery = this.getSelectedBatteryType();
    return battery?.price ? Number(battery.price) : 0;
  }

  formatPrice(price: any): string {
    const numPrice = Number(price) || 0;
    return numPrice.toFixed(2);
  }

  backToHome() {
    this.router.navigate(['/']);
  }
}