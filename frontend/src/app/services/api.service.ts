import { HttpClient, HttpParams } from '@angular/common/http';
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

// Interface for booking response
export interface BookingResponse {
  success: boolean;
  data: any[];
  pagination: {
    current_page: number;
    per_page: number;
    total_records: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  filters: any;
  debug_info?: string;
}

// Interface for delete response
export interface DeleteResponse {
  success: boolean;
  message?: string;
}

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

  getOilTypesByIntervell(intervell: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/oil-types/${intervell}`);
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

  createAccessory(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/accessories/create`, payload);
  }

  updateAccessory(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/accessories/${id}`, payload);
  }

  deleteAccessory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/accessories/${id}`);
  }

  // Customer endpoints
  checkCustomer(mobile?: string, plate?: string): Observable<any[]> {
    const params = new URLSearchParams();
    if (mobile) params.append('mobile', mobile);
    if (plate) params.append('plate', plate);
    return this.http.get<any[]>(`${this.baseUrl}/customer/check?${params}`);
  }

checkCustomerByPlate(plate: string): Observable<any[]> {
  const params = new URLSearchParams();
  params.append('plate', plate);
  return this.http.get<any[]>(`${this.baseUrl}/customer?${params}`);
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

  deleteBooking(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/bookings/${id}`);
  }

  // Settings endpoints
  getSettings(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/settings`);
  }

  /**
   * Get all bookings with optional filters and pagination
   */
  getBookings(params?: any): Observable<BookingResponse> {
    let httpParams = new HttpParams();

    // Add parameters to HTTP request
    if (params) {
      Object.keys(params).forEach((key) => {
        if (
          params[key] !== null &&
          params[key] !== undefined &&
          params[key] !== ''
        ) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    console.log('API Service - Making request with params:', params);
    console.log('HTTP Params:', httpParams.toString());

    return this.http.get<BookingResponse>(`${this.baseUrl}/bookings`, {
      params: httpParams,
    });
  }

  /**
   * Get single booking details by ID
   */
  getBookingById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/bookings/${id}`);
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

  updateeUser(id: number, postData: {
    name: string;
    email: string;
    role: string;
    password: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/user/${id}`, postData);
  }



  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/user/all`);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/user/${id}`);
  }

  updateBookingStatus(bookingId: number, status: 'pending' | 'completed' | 'cancelled', updatedBy?: number): Observable<any> {
  return this.http.put(`${this.baseUrl}/bookings/${bookingId}/status`, {
    status,
    updatedBy
  });
}
}
