import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Accessory,
  BatteryType,
  BookingRequest,
  OilFilter,
  OilType,
  VehicleBrand,
  VehicleModel,
} from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Vehicle endpoints
  getBrands(): Observable<VehicleBrand[]> {
    return this.http.get<VehicleBrand[]>(`${this.baseUrl}/brands`);
  }

  getAllModels(): Observable<VehicleModel[]> {
    return this.http.get<VehicleModel[]>(`${this.baseUrl}/models`);
  }

  getModels(brandId: number): Observable<VehicleModel[]> {
    return this.http.get<VehicleModel[]>(`${this.baseUrl}/models/${brandId}`);
  }

  // Oil service endpoints
  getOilTypes(): Observable<OilType[]> {
    return this.http.get<OilType[]>(`${this.baseUrl}/oil-types`);
  }

  getOilTypesByIntervell(intervell: number): Observable<OilType[]> {
    return this.http.get<OilType[]>(`${this.baseUrl}/oil-types/${intervell}`);
  }

  getOilFilters(): Observable<OilFilter[]> {
    return this.http.get<OilFilter[]>(`${this.baseUrl}/oil-filters`);
  }

  // Battery service endpoints
  getBatteryTypes(): Observable<BatteryType[]> {
    return this.http.get<BatteryType[]>(`${this.baseUrl}/battery-types`);
  }

  // Accessories endpoints
  getAccessories(category?: string): Observable<Accessory[]> {
    const params = category ? `?category=${category}` : '';
    return this.http.get<Accessory[]>(`${this.baseUrl}/accessories${params}`);
  }

  // Customer endpoints
  checkCustomer(mobile?: string, plate?: string): Observable<any[]> {
    const params = new URLSearchParams();
    if (mobile) params.append('mobile', mobile);
    if (plate) params.append('plate', plate);
    return this.http.get<any[]>(`${this.baseUrl}/customer/check?${params}`);
  }

  getCustomerHistory(customerId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/customer/${customerId}/history`
    );
  }

  // Booking endpoints
  createBooking(bookingData: BookingRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/bookings`, bookingData);
  }

  // Settings endpoints
  getSettings(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/settings`);
  }

  /**
   * Get all bookings with optional filters and pagination
   */
  getBookings(queryString?: string): Observable<any> {
    const url = queryString
      ? `${this.baseUrl}/bookings?${queryString}`
      : `${this.baseUrl}/bookings`;
    return this.http.get<any>(url);
  }

  /**
   * Get single booking details by ID
   */
  getBookingById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/bookings/${id}`);
  }

  /**
   * Update booking status
   */
  updateBookingStatus(
    id: number,
    status: 'pending' | 'completed' | 'cancelled'
  ): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/bookings/${id}/status`, {
      status,
    });
  }

  addBrand(brandData: { name: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/brands`, brandData);
  }

  updateBrand(brandId: number, brandData: { name: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/brands/${brandId}/update`, brandData);
  }

  deleteBrand(brandId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/brands/${brandId}/delete`);
  }
}
