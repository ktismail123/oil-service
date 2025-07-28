export interface VehicleBrand {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleModel {
  id: number;
  brand_id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface OilType {
  id: number;
  grade: string;
  brand: string;
  price: number;
  quantity_available?: number;
}

export interface OilFilter {
  id: number;
  code: string;
  brand: string;
  price: number;
  quantity_available?: number;
}

export interface BatteryType {
  id: number;
  capacity: number;
  brand: string;
  price: number;
  quantity_available?: number;
}

export interface Accessory {
  id: number;
  name: string;
  category: 'oil_service' | 'battery_service' | 'general';
  price: number;
  quantity_available?: number;
  quantity?: number;
}

export interface Customer {
  id?: number;
  name: string;
  mobile: string;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  id?: number;
  brandId: number;
  modelId: number;
  plateNumber: string;
  customer_id?: number;
}

export interface ServiceBooking {
  id?: number;
  type: 'oil_change' | 'battery_replacement';
  date: string;
  time: string;
  subtotal: number;
  vat_percentage?: number;
  vat_amount?: number;
  total_amount?: number;
  status?: 'pending' | 'completed' | 'cancelled';
  // Oil service specific
  interval?: number;
  oilTypeId?: number;
  oilQuantity?: number;
  oilFilterId?: number;
  // Battery service specific
  batteryTypeId?: number;
}

export interface BookingRequest {
  customer: Customer;
  vehicle: Vehicle;
  service: ServiceBooking;
  accessories: Accessory[];
}
