import { computed, Injectable, signal } from '@angular/core';
import { Accessory, Customer, ServiceBooking, Vehicle } from '../models';

interface BookingState {
  customer: Customer | null;
  vehicle: Vehicle | null;
  service: ServiceBooking | null;
  accessories: Accessory[];
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  // Using Angular 17 signals for reactive state management
  private bookingState = signal<BookingState>({
    customer: null,
    vehicle: null,
    service: null,
    accessories: [],
  });

  // Computed values
  currentBooking = computed(() => this.bookingState());
  isBookingComplete = computed(() => {
    const state = this.bookingState();
    return !!(state.customer && state.vehicle && state.service);
  });

  // Update methods
  updateCustomer(customer: Customer) {
    this.bookingState.update((state) => ({ ...state, customer }));
  }

  updateVehicle(vehicle: Vehicle) {
    this.bookingState.update((state) => ({ ...state, vehicle }));
  }

  updateService(service: ServiceBooking) {
    this.bookingState.update((state) => ({ ...state, service }));
  }

  updateAccessories(accessories: Accessory[]) {
    this.bookingState.update((state) => ({ ...state, accessories }));
  }

  addAccessory(accessory: Accessory) {
    this.bookingState.update((state) => ({
      ...state,
      accessories: [...state.accessories, accessory],
    }));
  }

  removeAccessory(accessoryId: number) {
    this.bookingState.update((state) => ({
      ...state,
      accessories: state.accessories.filter((acc) => acc.id !== accessoryId),
    }));
  }

  clearBooking() {
    this.bookingState.set({
      customer: null,
      vehicle: null,
      service: null,
      accessories: [],
    });
  }

  getCurrentBookingData(): BookingState {
    return this.bookingState();
  }
}
