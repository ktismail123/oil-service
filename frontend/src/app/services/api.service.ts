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

  login(payload: {
    email: string;
    password: string;
    role: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, payload);
  }

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

  createVehicleModel(payload: {
    name: string;
    brand_id: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/models/create`, payload);
  }

  updateVehicleModel(
    payload: { name: string; brand_id: string },
    id: number
  ): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/models/${id}`, payload);
  }

  deleteVehicleModel(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/models/${id}`);
  }

  // Oil service endpoints
  getOilTypes(): Observable<OilType[]> {
    return this.http.get<OilType[]>(`${this.baseUrl}/oil-types`);
  }

  createOilType(payloadData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/oil-types/create`, payloadData);
  }

  updateOilType(id: number, payloadData: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/oil-types/${id}`, payloadData);
  }

  deleteOililType(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/oil-types/${id}`);
  }

  getOilTypesByIntervell(intervell: number): Observable<OilType[]> {
    return this.http.get<OilType[]>(`${this.baseUrl}/oil-types/${intervell}`);
  }

  getOilFilters(): Observable<OilFilter[]> {
    return this.http.get<OilFilter[]>(`${this.baseUrl}/oil-filters`);
  }

  createOilFilter(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/oil-filters/create`, payload);
  }

  updateOilFilter(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/oil-filters/${id}`, payload);
  }

  deleteOilFilter(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/oil-filters/${id}`);
  }

  // Battery service endpoints
  getBatteryTypes(): Observable<BatteryType[]> {
    return this.http.get<BatteryType[]>(`${this.baseUrl}/battery-types`);
  }

  getBatteriesByAmp(amp: number): Observable<BatteryType[]> {
    return this.http.get<BatteryType[]>(`${this.baseUrl}/battery-types/${amp}`);
  }

  createBatteryType(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/battery-types/create`, payload);
  }

  updateBatteryType(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/battery-types/${id}`, payload);
  }

  deleteBatteryType(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/battery-types/${id}`);
  }

  // Accessories endpoints
  getAccessories(category?: string): Observable<Accessory[]> {
    const params = category ? `?category=${category}` : '';
    return this.http.get<Accessory[]>(`${this.baseUrl}/accessories${params}`);
  }

  createAccessory(payload: any): Observable<any>{
    return this.http.post<any>(`${this.baseUrl}/accessories/create`, payload)
  }

  updateAccessory(id: number, payload: any): Observable<any>{
    return this.http.put<any>(`${this.baseUrl}/accessories/${id}`, payload)
  }

  deleteAccessory(id: number): Observable<any>{
    return this.http.delete<any>(`${this.baseUrl}/accessories/${id}`);
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

  updateBooking(id: number, bookingData: BookingRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/bookings/${id}`, bookingData);
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
    return this.http.put<any>(
      `${this.baseUrl}/brands/${brandId}/update`,
      brandData
    );
  }

  deleteBrand(brandId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/brands/${brandId}/delete`);
  }

  createUser(postData: {
    name: string;
    email: string;
    role: string;
    password: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/user/create`, postData);
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/user/all`);
  }
  
  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/user/${id}`);
  }


}
