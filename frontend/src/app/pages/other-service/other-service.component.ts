import { NgIf } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { StepIndicatorComponent } from '../../shared/components/step-indicator/step-indicator.component';
import { ActivatedRoute, Router } from '@angular/router';
import { OtherServiceOilFilterComponent } from './steps/other-service-oil-filter/other-service-oil-filter.component';
import { AccessoriesComponent } from '../../components/accessories/accessories.component';
import { AccessoriesStepComponent } from '../battery-service/steps/accessories-step/accessories-step.component';
import { Accessory, OilFilter } from '../../models';
import {
  OtherServiceSummaryComponent,
  OtherServiceSummary,
  CustomerData,
} from './steps/other-service-summary/other-service-summary.component';
import { ApiService } from '../../services/api.service';
import { take } from 'rxjs';
import { getVatExclusive } from '../../utils/vat-calculation';

@Component({
  selector: 'app-other-service',
  imports: [
    NgIf,
    LoadingComponent,
    StepIndicatorComponent,
    OtherServiceOilFilterComponent,
    AccessoriesStepComponent,
    OtherServiceSummaryComponent,
  ],
  templateUrl: './other-service.component.html',
  styleUrl: './other-service.component.scss',
})
export class OtherServiceComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  currentStep = signal(1);
  totalSteps = signal(3);
  steps = ['Oil Filter', 'Accessories', 'Summary'];
  isLoading = signal(false);

  mode = '';
  editData: any;

  // Service data signals
  selectedOilFilter = signal<OilFilter | null>(null);
  selectedAccessories = signal<Accessory[]>([]);
  laborCost = signal<number>(0);
  discount = signal<number>(0);
  customerData = signal<CustomerData | null>(null);
  billNumber = signal<string>('');

  // Computed service summary for the summary component
  serviceSummary = computed((): OtherServiceSummary => {
    const oilFilter = this.selectedOilFilter();
    const accessories = this.selectedAccessories();
    const labor = this.laborCost();
    const discount = this.discount() || 0;

    // Calculate total inclusive price (VAT already included)
    let totalInclusive = labor;

    // Add oil filter cost (inclusive price)
    if (oilFilter) {
      totalInclusive += Number(oilFilter.price);
    }

    // Add accessories cost (inclusive prices)
    accessories.forEach((accessory) => {
      totalInclusive += accessory.price * (accessory.quantity || 1);
    });

    // Apply discount to inclusive total
    const discountedTotal = Math.max(0, totalInclusive - discount);

    // // Extract VAT from discounted total (VAT = 5/100 of inclusive price)
    // // const vatAmount = (discountedTotal * 5) / 100;
    // const vatAmount = (discountedTotal * 5) / 100;
    // const netSubtotal = discountedTotal - vatAmount;

    const { vatAmount, netAmount } = getVatExclusive(discountedTotal);

    return {
      oilFilter: oilFilter,
      accessories: accessories,
      itemsSubtotal: totalInclusive, // Original inclusive total
      discount: discount, // Discount amount
      netSubtotal: netAmount, // Net amount (exclusive of VAT)
      vatAmount: vatAmount, // VAT portion
      totalAmount: discountedTotal, // Final inclusive total
    };
  });

  constructor() {
    // Get router state data
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state?.['item']) {
      this.editData = nav.extras.state['item'];
      console.log('Edit data received:', this.editData);

      if (this.editData.oil_filter_id) {
        this.selectedOilFilter.set({
          brand: this.editData?.oil_filter_brand,
          code: this.editData?.oil_filter_code,
          id: this.editData?.oil_filter_id,
          price: 0, // Will be loaded from API
        });
      }
    }

    // Get query param
    this.route.queryParams.subscribe((params) => {
      this.mode = params['mode'] || null;
    });
  }

  ngOnInit() {
    if (this.mode === 'edit') {
      console.log('Edit mode - loading data:', this.editData);

      this.currentStep.set(3);
      this.loadData();

      if (this.editData?.accessories) {
        this.selectedAccessories.set(this.editData.accessories);
      }

      // Set labor cost and discount from edit data
      this.laborCost.set(parseFloat(this.editData?.labour_cost || '0'));
      this.discount.set(parseFloat(this.editData?.discount || '0'));

      const custData: CustomerData = {
        laborCost: this.editData?.labour_cost?.toString() || '0',
        mobile: this.editData?.customer_mobile || '',
        name: this.editData?.customer_name || '',
        plateNumber:
          this.editData?.vehicle?.plate_number ||
          this.editData?.reference_plate_number ||
          '',
        memo: this.editData?.memo || '',
        discount: parseFloat(this.editData?.discount || '0'),
      };

      this.customerData.set(custData);
      this.billNumber.set(this.editData?.bill_number || '');
    }
  }

  loadData(): void {
    this.apiService
      .getOilFilters()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          const filter = res.filter(
            (el) => el.id === this.editData?.oil_filter_id
          );
          if (filter && filter.length > 0) {
            this.selectedOilFilter.set(filter[0]);
          }
        },
        error: (error) => {
          console.error('Error loading oil filters:', error);
        },
      });
  }

  prevStep() {
    this.currentStep.update((step) => step - 1);
  }

  nextStep() {
    this.currentStep.update((step) => step + 1);
  }

  backToHome() {
    this.router.navigate(['/']);
  }

  // Oil filter selection handler
  filterChange(filter: any | null) {
    console.log('Oil filter selected:', filter);
    this.selectedOilFilter.set(filter);
    this.nextStep();
  }

  // Accessories selection handler
  onAccessoriesChanged(accessories: Accessory[]) {
    this.selectedAccessories.set(accessories);
    console.log('Accessories updated:', this.selectedAccessories());
  }

  onSkipAccessoriesEmit() {
    this.currentStep.update((step) => step + 1);
  }

  gotToNextStep() {
    this.nextStep();
  }

  // Customer data handlers for summary step
  onCustomerDataChanged(data: CustomerData) {
    console.log('Customer data changed:', data);

    this.customerData.set(data);

    // Update labor cost from customer data
    if (data.laborCost) {
      this.laborCost.set(parseFloat(data.laborCost.toString()));
    } else {
      this.laborCost.set(0);
    }

    // Update discount from customer data
    if (data.discount !== undefined) {
      this.discount.set(data.discount);
    } else {
      this.discount.set(0);
    }

    console.log(
      'Updated signals - Labor:',
      this.laborCost(),
      'Discount:',
      this.discount()
    );
  }

  onValidityChanged(isValid: boolean) {
    console.log('Customer form validity:', isValid);
  }

  onSubmitBooking() {
    const customer = this.customerData();
    const summary = this.serviceSummary();

    // console.log('Submitting booking with summary:', summary);
    // console.log('Customer data:', customer);

    // if (!customer) {
    //   console.error('Customer data is missing');
    //   return;
    // }

    // Prepare booking data for other service
    const bookingData = {
      customer: {
        name: customer?.name || '',
        mobile: customer?.mobile || '',
      },
      vehicle: {
        plateNumber: customer?.plateNumber,
        // These will be null for other_service, handled by backend
        brandId: null,
        modelId: null,
      },
      service: {
        type: 'other_service',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        oilFilterId: summary.oilFilter?.id || null,
        subtotal: summary.totalAmount, // Send final total (inclusive, after discount)
        laborCost: parseFloat(customer?.laborCost || '0'),
        discount: summary.discount,
        memo: customer?.memo || null,
        createdBy: this.getCurrentUserId(),
      },
      accessories: summary.accessories.map((acc) => ({
        id: acc.id,
        quantity: acc.quantity || 1,
        price: acc.price,
      })),
    };

    console.log('Final booking data to submit:', bookingData);

    // Call appropriate API method
    if (this.mode === 'edit') {
      this.updateBooking(bookingData);
    } else {
      this.createBooking(bookingData);
    }
  }

  createBooking(bookingData: any): void {
    this.isLoading.set(true);

    this.apiService
      .createBooking(bookingData as any)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.billNumber.set(response.billNumber);
          alert('Booking created successfully');
          console.log('Booking created successfully:', response);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Booking creation failed:', error);
          this.isLoading.set(false);
          // You might want to show an error message to the user here
        },
      });
  }

  updateBooking(bookingData: any): void {
    this.isLoading.set(true);

    this.apiService
      .updateBooking(this.editData?.id, bookingData as any)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          console.log('Booking updated successfully:', res);
          this.isLoading.set(false);

          if (res.success) {
            // You might want to show a success message here
            console.log('Update completed successfully');
          }
        },
        error: (error) => {
          console.error('Booking update failed:', error);
          this.isLoading.set(false);
          // You might want to show an error message to the user here
        },
      });
  }

  private getCurrentUserId(): number | null {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userData') || '{}');
      return userDetails?.userId || null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }
}
