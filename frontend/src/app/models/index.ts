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
  name: string;
  grade: string;
  brand: string;
  service_interval: number;
  package_1l_available: boolean;
  package_4l_available: boolean;
  bulk_available: boolean;
  price_1l: number;
  price_4l: number;
  price_per_liter: number;
  status: 'active' | 'inactive';
  quantity_available: number;
  created_at: string; // or Date
  updated_at: string; // or Date
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

export interface OilPackageSelection {
  oilTypeId: number;
  package4L: boolean;
  package1L: boolean;
  bulkQuantity: number;
  totalQuantity: number;
  totalPrice: number;
}