import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  totalBookings?: number;
  totalRevenue?: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  inProgressBookings: number;
  avgBookingValue: number;
  revenueGrowth: number;
  bookingsGrowth: number;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  bookings: number;
}

export interface TopService {
  name: string;
  count: number;
  revenue: number;
}

export interface UserStats {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  bookings: number;
  revenue: number;
  avgBookingValue: number;
}

export interface RecentActivity {
  id: number;
  serviceType: string;
  serviceDate: string;
  status: string;
  totalAmount: number;
  customerName: string;
  createdByName: string;
  createdAt: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  monthlyTrend: MonthlyTrend[];
  topServices: TopService[];
  userStats: UserStats[];
  recentActivity: RecentActivity[];
  filters: {
    userId: string | null;
    dateRange: string;
    startDate: string;
    endDate: string;
  };
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
}

export interface DashboardFilters {
  userId?: string | null;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  
  // Configure your API base URL here
  private readonly apiUrl = environment.apiUrl; // Adjust this to match your backend API URL
  
  /**
   * Get dashboard data with optional filters
   */
 getDashboardData(filters: any): Observable<any> {
    let params = new HttpParams();
    if (filters.year) params = params.set('year', filters.year);
    if (filters.month) params = params.set('month', filters.month);
    if (filters.userId) params = params.set('userId', filters.userId);

    return this.http.get(`${this.apiUrl}/dashboard`, { params });
  }

  /**
   * Get users list for filtering
   */
 

  /**
   * Get all bookings data (using your existing endpoint)
   */
  getAllBookings(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key].toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/bookings`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching bookings:', error);
          return throwError(() => new Error('Failed to load bookings. Please try again.'));
        })
      );
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format number for display
   */
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  /**
   * Calculate percentage change
   */
  calculateGrowth(current: number, previous: number): { value: number; isPositive: boolean } {
    if (previous === 0) return { value: 0, isPositive: true };
    
    const growth = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(growth * 10) / 10),
      isPositive: growth > 0
    };
  }

  /**
   * Export dashboard data as CSV
   */
  exportDashboardData(data: DashboardData): void {
    const csvContent = this.generateCSVExport(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private generateCSVExport(data: DashboardData): string {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Revenue', this.formatCurrency(data.metrics.totalRevenue)],
      ['Total Bookings', data.metrics.totalBookings.toString()],
      ['Completed Bookings', data.metrics.completedBookings.toString()],
      ['Pending Bookings', data.metrics.pendingBookings.toString()],
      ['Cancelled Bookings', data.metrics.cancelledBookings.toString()],
      ['Average Booking Value', this.formatCurrency(data.metrics.avgBookingValue)],
      ['Revenue Growth', `${data.metrics.revenueGrowth}%`],
      ['Bookings Growth', `${data.metrics.bookingsGrowth}%`],
      [''], // Empty row
      ['Top Services', ''],
      ...data.topServices.map(service => [service.name, this.formatCurrency(service.revenue)]),
      [''], // Empty row
      ['User Performance', ''],
      ...data.userStats.map(user => [`${user.userName} (${user.userRole})`, this.formatCurrency(user.revenue)])
    ];

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}