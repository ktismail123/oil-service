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
import {
  VehicleBrand,
  VehicleModel,
  OilType,
  OilFilter,
  Accessory,
  OilPackageSelection,
} from '../../models';

import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { StepIndicatorComponent } from '../../shared/components/step-indicator/step-indicator.component';
import { distinctUntilChanged, filter } from 'rxjs';
import { Step1BrandSelectionComponent } from './steps/step1-brand-selection/step1-brand-selection.component';
import { Step2ModelSelectionComponent } from './steps/step2-model-selection/step2-model-selection.component';
import { Step3ServiceIntervalComponent } from './steps/step3-service-interval/step3-service-interval.component';
import { Step4OilTypeComponent } from './steps/step4-oil-type/step4-oil-type.component';
import { Step5OilFilterComponent } from './steps/step5-oil-filter/step5-oil-filter.component';
import { Step6AccessoriesComponent } from './steps/step6-accessories/step6-accessories.component';
import { Step7CustomerSummaryComponent } from './steps/step7-customer-summary/step7-customer-summary.component';

@Component({
  selector: 'app-oil-service',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    LoadingComponent,
    FormFieldComponent,
    StepIndicatorComponent,
    Step1BrandSelectionComponent,
    Step2ModelSelectionComponent,
    Step3ServiceIntervalComponent,
    Step4OilTypeComponent,
    Step5OilFilterComponent,
    Step6AccessoriesComponent,
    Step7CustomerSummaryComponent
  ],
  templateUrl: './oil-service.component.html',
  styleUrls: ['./oil-service.component.css'],
})
export class OilServiceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private bookingService = inject(BookingService);
  private router = inject(Router);

  // Oil package selection tracking
  private selectedOilPackages = signal<Map<number, OilPackageSelection>>(new Map());

  currentStep = signal(1);
  totalSteps = signal(7);
  isLoading = signal(false);
  isSubmitting = signal(false);

  brands = signal<VehicleBrand[]>([]);
  models = signal<VehicleModel[]>([]);
  oilTypes = signal<OilType[]>([]);
  oilFilters = signal<OilFilter[]>([]);
  accessories = signal<Accessory[]>([]);
  selectedAccessories = signal<Accessory[]>([]);

  // Simple validation flags for each step
  step1Valid = signal(false);
  step2Valid = signal(false);
  step3Valid = signal(false);
  step4Valid = signal(false);
  step5Valid = signal(true); // optional
  step6Valid = signal(true); // Accessories are optional
  step7Valid = signal(false);

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
      case 5:
        return this.step5Valid();
      case 6:
        return this.step6Valid();
      case 7:
        return this.step7Valid();
      default:
        return false;
    }
  });

// Manual trigger signal to force recalculation
private calculationTrigger = signal(0);

subtotal = computed(() => {
  // this.calculationTrigger();
  const result = this.calculateSubtotal(); // This already includes labor cost
  return typeof result === 'number' ? result : 0;
});

vatAmount = computed(() => {
  const sub = this.subtotal();
  return typeof sub === 'number' ? (sub * 5) / 100 : 0;
});

// ✅ FIXED: Simple total calculation (subtotal + VAT only)
totalAmount = computed(() => {
  const sub = this.subtotal(); // Already includes labor cost
  const vat = this.vatAmount();
  
  // ✅ SIMPLE: Just add subtotal + VAT (no additional labor cost)
  return (
    (typeof sub === 'number' ? sub : 0) + (typeof vat === 'number' ? vat : 0)
  );
});

private calculateSubtotal(): number {
  let total = 0;

  try {
    // Oil cost
    const oilTotalPrice = this.oilForm?.get('totalPrice')?.value || 0;
    if (oilTotalPrice > 0) {
      total += Number(oilTotalPrice);
    }

    // Filter cost
    const filterId = this.filterForm?.get('filterId')?.value;
    if (filterId) {
      const filter = this.oilFilters().find((f) => f.id == filterId);
      if (filter && filter.price) {
        total += Number(filter.price);
      }
    }

    // Accessories cost
    const accessories = this.selectedAccessories();
    if (accessories && Array.isArray(accessories)) {
      accessories.forEach((acc) => {
        if (acc && acc.price && acc.quantity) {
          total += Number(acc.price) * Number(acc.quantity);
        }
      });
    }

    // ✅ Labor cost (included in subtotal)
    const laborCost = this.laborCostSignal();
    console.log(laborCost, '---------');
    
    total += Number(laborCost);

    console.log('Final subtotal (including labor):', total);
  } catch (error) {
    console.error('Error calculating subtotal:', error);
    return 0;
  }
console.log(total, '+++++++++++');

  return total || 0;
}

  private laborCostSignal = signal(0);

  brandForm!: FormGroup;
  modelForm!: FormGroup;
  intervalForm!: FormGroup;
  oilForm!: FormGroup;
  filterForm!: FormGroup;
  customerForm!: FormGroup;

  serviceIntervals = [
    { value: 5000, label: '5,000 KM' },
    { value: 10000, label: '10,000 KM' },
    { value: 0, label: 'Custom KM' },
  ];

  steps = [
    'Brand',
    'Model',
    'Interval',
    'Oil',
    'Filter',
    'Accessories',
    'Summary',
  ];

  ngOnInit() {
    this.initializeForms();
    this.loadInitialData();
  }

  private initializeForms() {
    this.brandForm = this.fb.group({
      brandId: [''],
      customBrand: [''],
    });

    this.modelForm = this.fb.group({
      modelId: [''],
      customModel: [''],
    });

    this.intervalForm = this.fb.group({
      interval: [''],
      customInterval: [''],
    });

    // Updated oil form to handle new package structure
    this.oilForm = this.fb.group({
      oilTypeId: [''],
      quantity: [4, [Validators.min(0.5), Validators.max(20)]],
      totalPrice: [0],
      requiredQuantity: [4, [Validators.min(0.5), Validators.max(20)]],
      oilQuantityDetails:[]
      // Dynamic controls for bulk quantities will be added as needed
    });

    this.filterForm = this.fb.group({
      filterId: [''],
    });

    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
      plateNumber: ['', Validators.required],
      laborCost: [0, [Validators.required]]
    });

    // Subscribe to customer form changes for step 7 validation
    this.customerForm.valueChanges.subscribe(() => {
      this.step7Valid.set(this.customerForm.valid);
    });
    this.customerForm.get('laborCost')?.valueChanges.subscribe(value => {
    this.laborCostSignal.set(value || 0);
    // this.triggerCalculation(); // Trigger recalculation
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

  // ✅ Manual trigger methods to update calculations
private triggerCalculation() {
  this.calculationTrigger.update(val => val + 1);
}

  private async loadInitialData() {
    this.isLoading.set(true);
    try {
      const [brands, filters, accessories] = await Promise.all([
        this.apiService.getBrands().toPromise(),
        this.apiService.getOilFilters().toPromise(),
        this.apiService.getAccessories('oil_service').toPromise(),
      ]);
      this.brands.set(brands || []);
      this.oilFilters.set(filters || []);
      this.accessories.set(
        (accessories || []).map((acc) => ({ ...acc, quantity: 0 }))
      );
    } catch (error) {
      console.error('Data loading failed:', error);
    } finally {
      this.isLoading.set(false);
    }
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

  nextStep() {
    if (!this.canProceed()) {
      return;
    }
    if (this.currentStep() < this.totalSteps()) {
      this.currentStep.update((step) => step + 1);

      // Load models when moving to step 2
      if (this.currentStep() === 2) {
        const brandId = this.brandForm.get('brandId')?.value;
        if (brandId) {
          this.loadModels(brandId);
        }
      }

      // Load oil types when moving to step 4
      if(this.currentStep() === 4){
        const interval = this.intervalForm.get('interval')?.value;
        const customInterval = this.intervalForm.get('customInterval')?.value;
        const serviceInterval = interval === 0 ? customInterval : interval;
        
        if(serviceInterval){
          this.loadOilTypes(serviceInterval);
        }
      }
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update((step) => step - 1);
    }
  }

  // Step 1: Brand Selection
  onBrandChange() {
    const brandId = this.brandForm.get('brandId')?.value;
    if (brandId) {
      this.brandForm.get('customBrand')?.setValue('');
      this.loadModels(brandId);
      this.resetFromStep(2); // Reset subsequent steps
    }
    this.validateStep1();
  }

  onCustomBrandChange() {
    const customBrand = this.brandForm.get('customBrand')?.value;
    if (customBrand && customBrand.trim().length > 0) {
      this.brandForm.get('brandId')?.setValue('');
      this.models.set([]);
      this.resetFromStep(2); // Reset subsequent steps
    }
    this.validateStep1();
  }

  private validateStep1() {
    const brandId = this.brandForm.get('brandId')?.value;
    const customBrand = this.brandForm.get('customBrand')?.value?.trim();
    this.step1Valid.set(!!(brandId || customBrand));
  }

  // Step 2: Model Selection
  onModelChange() {
    this.validateStep2();
  }

  onCustomModelChange() {
    const customModel = this.modelForm.get('customModel')?.value;
    if (customModel && customModel.trim().length > 0) {
      this.modelForm.get('modelId')?.setValue('');
    }
    this.validateStep2();
  }

  private validateStep2() {
    const modelId = this.modelForm.get('modelId')?.value;
    const customModel = this.modelForm.get('customModel')?.value?.trim();
    this.step2Valid.set(!!(modelId || customModel));
  }

  private async loadModels(brandId: number) {
    try {
      const models = await this.apiService.getModels(brandId).toPromise();
      this.models.set(models || []);
    } catch (error) {
      console.error('Model loading failed:', error);
      this.models.set([]);
    }
  }

  private async loadOilTypes(interval: number) {
    try {
      const oilTypes = await this.apiService.getOilTypesByIntervell(interval).toPromise();
      this.oilTypes.set(oilTypes || []);
    } catch (error) {
      console.error('Oil Types loading failed:', error);
      this.oilTypes.set([]);
    }
  }

  // Step 3: Service Interval
  onIntervalChange() {
    const interval = this.intervalForm.get('interval')?.value;
    const customControl = this.intervalForm.get('customInterval');

    if (interval === 0) {
      customControl?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      customControl?.clearValidators();
      customControl?.setValue('');
    }
    customControl?.updateValueAndValidity();
    this.validateStep3();
  }

  private validateStep3() {
    const interval = this.intervalForm.get('interval')?.value;
    if (interval === 0) {
      const customInterval = this.intervalForm.get('customInterval')?.value;
      this.step3Valid.set(!!(customInterval && customInterval > 0));
    } else {
      this.step3Valid.set(!!interval);
    }
  }

  // Step 4: Oil Type Selection (Updated for new package structure)
  onOilTypeChange() {
    this.validateStep4();
  }

  onOilQuantityChange() {
    this.validateStep4();
  }

  // Updated validation for step 4 to handle package selections
  private validateStep4() {
    console.log(this.oilForm.value);
    
    const oilTypeId = this.oilForm.get('oilTypeId')?.value;
    const totalPrice = this.oilForm.get('totalPrice')?.value;
    const quantity = this.oilForm.get('quantity')?.value;
    const requiredQuantity = Number(this.oilForm.get('requiredQuantity')?.value);
    console.log(!!(oilTypeId && totalPrice && totalPrice > 0  && (quantity >= requiredQuantity)));
    
    
    // Oil is valid if we have an oil type selected with valid price and quantity
    this.step4Valid.set(!!(oilTypeId && totalPrice && totalPrice > 0 && (quantity >= requiredQuantity)));
  }

  // Method to update oil form when packages are selected (called from Step4 component)
  updateOilSelection(oilTypeId: number, totalQuantity: number, totalPrice: number) {
    this.oilForm.patchValue({
      oilTypeId: oilTypeId,
      quantity: totalQuantity,
      totalPrice: totalPrice
    });
    this.validateStep4();
  }

  // Step 5: Filter Selection
  onFilterChange() {
    this.validateStep5();
  }

  private validateStep5() {
    // Filter is optional, so always valid
    this.step5Valid.set(true);
  }

  // Step 6: Accessories (Optional - always valid)
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
      this.modelForm.reset();
    }
    if (step <= 3) {
      this.step3Valid.set(false);
      this.intervalForm.reset();
    }
    if (step <= 4) {
      this.step4Valid.set(false);
      this.oilForm.patchValue({ 
        oilTypeId: '', 
        quantity: 4, 
        totalPrice: 0,
        requiredQuantity: 4 
      });
      // Clear package selections
      this.selectedOilPackages.set(new Map());
    }
    if (step <= 5) {
      this.step5Valid.set(true);
      this.filterForm.reset();
    }
    if (step <= 6) {
      this.selectedAccessories.set([]);
    }
    if (step <= 7) {
      this.step7Valid.set(false);
      this.customerForm.reset();
    }
  }



  async submitBooking() {
    console.log(this.canProceed());
    
    if (!this.canProceed()) {
      return;
    }

    this.isSubmitting.set(true);
    console.log(this.oilForm.value);
    
    try {
      const bookingData = {
        customer: {
          name: this.customerForm.get('name')?.value,
          mobile: this.customerForm.get('mobile')?.value,
        },
        vehicle: {
          brandId: this.brandForm.get('brandId')?.value,
          customBrand: this.brandForm.get('customBrand')?.value,
          modelId: this.modelForm.get('modelId')?.value,
          customModel: this.modelForm.get('customModel')?.value,
          plateNumber: this.customerForm.get('plateNumber')?.value,
        },
        service: {
          type: 'oil_change' as const,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0],
          interval: this.getServiceInterval(),
          oilTypeId: this.oilForm.get('oilTypeId')?.value,
          oilQuantity: this.oilForm.get('quantity')?.value,
          oilTotalPrice: this.oilForm.get('totalPrice')?.value,
          oilRequiredQuantity: this.oilForm.get('requiredQuantity')?.value,
          oilQuantityDetails: this.oilForm.get('oilQuantityDetails')?.value,
          oilFilterId: this.filterForm.get('filterId')?.value,
          subtotal: this.subtotal(),
          vatAmount: this.vatAmount(),
          totalAmount: this.totalAmount(),
          // Include package details for backend processing
          oilPackageDetails: this.getSelectedOilPackageDetails(),
        },
        accessories: this.selectedAccessories(),
      };

      const response = await this.apiService
        .createBooking(bookingData)
        .toPromise();
      alert(
        `Booking created successfully! Total: AED ${this.subtotal().toFixed(
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

  // Helper method to get oil package details for backend
  private getSelectedOilPackageDetails() {
    const oilTypeId = this.oilForm.get('oilTypeId')?.value;
    if (!oilTypeId) return null;

    const packageSelection = this.selectedOilPackages().get(oilTypeId);
    
    return {
      oilTypeId: oilTypeId,
      requiredQuantity: this.oilForm.get('requiredQuantity')?.value,
      totalQuantity: this.oilForm.get('quantity')?.value,
      totalPrice: this.oilForm.get('totalPrice')?.value,
      packageSelection: packageSelection || null
    };
  }

  getServiceInterval(): number {
    const interval = this.intervalForm.get('interval')?.value;
    if (interval === 0) {
      return this.intervalForm.get('customInterval')?.value || 0;
    }
    return interval || 0;
  }

  getSelectedBrandName(): string {
    const brandId = this.brandForm.get('brandId')?.value;
    const customBrand = this.brandForm.get('customBrand')?.value;

    if (brandId) {
      return this.brands().find((b) => b.id === brandId)?.name || '';
    }
    return customBrand || '';
  }

  getSelectedModelName(): string {
    const modelId = this.modelForm.get('modelId')?.value;
    const customModel = this.modelForm.get('customModel')?.value;

    if (modelId) {
      return this.models().find((m) => m.id === modelId)?.name || '';
    }
    return customModel || '';
  }

  getSelectedOilType(): OilType | undefined {
    const id = this.oilForm.get('oilTypeId')?.value;
    return this.oilTypes().find((o) => o.id == id); // Use == for type flexibility
  }

  getSelectedFilter(): OilFilter | undefined {
    const id = this.filterForm.get('filterId')?.value;
    return this.oilFilters().find((f) => f.id == id);
  }

  // Helper method to get oil details for summary display
  getOilSummaryDetails() {
    const oilType = this.getSelectedOilType();
    const quantity = this.oilForm.get('quantity')?.value;
    const totalPrice = this.oilForm.get('totalPrice')?.value;
    const requiredQuantity = this.oilForm.get('requiredQuantity')?.value;

    return {
      oilType,
      quantity,
      totalPrice,
      requiredQuantity
    };
  }

  backToHome() {
    this.router.navigate(['/']);
  }

  onBrandChangeAndProceed() {
    this.onBrandChange();
    if (this.step1Valid()) {
      setTimeout(() => this.nextStep(), 300); // Small delay for better UX
    }
  }

  onCustomBrandChangeAndProceed() {
    this.onCustomBrandChange();
    if (this.step1Valid()) {
      setTimeout(() => this.nextStep(), 300);
    }
  }

  onModelChangeAndProceed() {
    this.onModelChange();
    if (this.step2Valid()) {
      setTimeout(() => this.nextStep(), 300);
    }
  }

  onCustomModelChangeAndProceed() {
    this.onCustomModelChange();
    if (this.step2Valid()) {
      setTimeout(() => this.nextStep(), 300);
    }
  }

  onIntervalChangeAndProceed() {
    this.onIntervalChange();
    if (this.step3Valid()) {
      setTimeout(() => this.nextStep(), 300);
    }
  }

  onOilTypeChangeAndProceed() {
    this.onOilTypeChange();
    if (this.step4Valid()) {
      setTimeout(() => this.nextStep(), 300);
    }
  }

  onFilterChangeAndProceed() {
    this.onFilterChange();
    if (this.step5Valid()) {
      setTimeout(() => this.nextStep(), 300);
    }
  }

  onAccessoriesCompleteAndProceed() {
    // This would be called when user indicates they're done with accessories
    // For example, clicking a "Continue" button or selecting "No more accessories"
    if (this.step6Valid()) {
      setTimeout(() => this.nextStep(), 300);
    }
  }
}
