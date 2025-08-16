import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface User {
  id: string;
  name: string;
  role: string;
}

interface Filters {
  year: string;
  month: string;
  userId: string;
}

interface DashboardSummary {
  total_revenue: number;
  total_bookings: number;
  total_users_in_system: number;
}

interface UserPerformance {
  id: string;
  name: string;
  role: string;
  revenue: number;
  bookings_count: number;
}

interface DashboardData {
  summary: DashboardSummary;
  user_performance: UserPerformance[];
}

interface MonthOption {
  value: number;
  label: string;
}
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  filters: Filters = {
    year: '',
    month: '',
    userId: '',
  };

  users: User[] = [];
  dashboardData: DashboardData | null = null;
  loading: boolean = false;

  private monthOptions: MonthOption[] = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  years: number[] = [];

  constructor() {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadDashboard();
    this.generateYears();
  }

  generateYears() {
    const startYear = 2025;
    const currentYear = new Date().getFullYear();
    const endYear = currentYear + 5; // you can extend 5 years ahead

    this.years = [];
    for (let year = startYear; year <= endYear; year++) {
      this.years.push(year);
    }
  }

  getMonthOptions(): MonthOption[] {
    return this.monthOptions;
  }

  trackByUserId(index: number, user: UserPerformance): string {
    return user.id;
  }

  getPerformanceClass(revenue: number): string {
    // Define performance thresholds (these should be configurable)
    const highThreshold = 50000;
    const mediumThreshold = 25000;

    if (revenue >= highThreshold) {
      return 'high';
    } else if (revenue >= mediumThreshold) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  getPerformanceText(revenue: number): string {
    const performanceClass = this.getPerformanceClass(revenue);

    switch (performanceClass) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'N/A';
    }
  }

  private dashboardService = inject(DashboardService);
  private apiService = inject(ApiService);
  isLoading = signal<any>(false);

  loadDashboard() {
    this.loading = true;

    this.dashboardService.getDashboardData(this.filters).subscribe({
      next: (res: any) => {
        this.dashboardData = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  loadUsers() {
    this.apiService.getUsers().subscribe((res: any) => {
      this.users = res.data;
    });
  }

  // Helper method for currency formatting in template
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  // Helper method for number formatting in template
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  // Method to clear all filters
  clearFilters(): void {
    this.filters = {
      year: '',
      month: '',
      userId: '',
    };
    this.loadDashboard();
  }

  // Method to export data (placeholder)
  exportData(): void {
    if (!this.dashboardData) return;

    console.log('Exporting dashboard data...', this.dashboardData);
    // Implement actual export functionality here
  }

  // Method to refresh data
  refreshData(): void {
    this.loadDashboard();
  }

  // Method to get filtered user performance data
  getFilteredUserPerformance(): UserPerformance[] {
    if (!this.dashboardData) return [];

    let filtered = this.dashboardData.user_performance;

    // Apply filters if needed (this would typically be done on the backend)
    if (this.filters.userId) {
      filtered = filtered.filter((user) => user.id === this.filters.userId);
    }

    return filtered;
  }

  // Method to calculate average revenue
  getAverageRevenue(): number {
    if (
      !this.dashboardData ||
      this.dashboardData.user_performance.length === 0
    ) {
      return 0;
    }

    const total = this.dashboardData.user_performance.reduce(
      (sum, user) => sum + user.revenue,
      0
    );

    return total / this.dashboardData.user_performance.length;
  }

  // Method to get top performer
  getTopPerformer(): UserPerformance | null {
    if (
      !this.dashboardData ||
      this.dashboardData.user_performance.length === 0
    ) {
      return null;
    }

    return this.dashboardData.user_performance.reduce((top, current) =>
      current.revenue > top.revenue ? current : top
    );
  }

    scrollToTop(): void {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }
}
