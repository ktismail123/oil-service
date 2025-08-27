import { Component, OnInit, signal, computed, inject } from '@angular/core';
import {
  CommonModule,
  CurrencyPipe,
  DatePipe,
  TitleCasePipe,
} from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

interface Filters {
  year: string;
  month: string;
  day: string;
  status: string;
}

interface DashboardSummary {
  total_revenue: number;
  total_subtotal: number;
  total_vat: number;
  total_bookings: number;
  completed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
}

interface DailyBooking {
  day: number;
  bookings_count: number;
  revenue: number;
  subtotal: number;
}

interface RecentBooking {
  id: number;
  bill_number: string;
  customer_name: string;
  customer_mobile: string;
  service_type: string;
  service_date: string;
  service_time: string;
  total_amount: number;
  status: string;
  plate_number?: string;
  vehicle_info?: string;
  subtotal: number;
}

interface ServiceTypeDistribution {
  service_type: string;
  count: number;
  revenue: number;
  completed_count: number;
  pending_count: number;
  cancelled_count: number;
}

interface DashboardData {
  summary: DashboardSummary;
  daily_bookings: DailyBooking[];
  recent_bookings: RecentBooking[];
  service_type_distribution: ServiceTypeDistribution[];
  monthly_trend: any[];
}

interface MonthOption {
  value: number;
  label: string;
}

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, TitleCasePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  filters: Filters = {
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    day: '',
    status: 'completed',
  };

  dashboardData: DashboardData | null = null;
  loading: boolean = false;
  exporting: boolean = false;

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

  private statusOptions: StatusOption[] = [
    { value: 'completed', label: 'Completed (Paid)', color: 'green' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
    // { value: '', label: 'All Status', color: 'gray' }
  ];

  years: number[] = [];
  days: number[] = [];

  private dashboardService = inject(DashboardService);

  constructor() {}

  ngOnInit(): void {
    this.generateYears();
    this.generateDays();
    this.loadDashboard();
  }

  generateYears() {
    const startYear = 2023;
    const currentYear = new Date().getFullYear();
    const endYear = currentYear + 5;

    this.years = [];
    for (let year = startYear; year <= endYear; year++) {
      this.years.push(year);
    }
  }

  generateDays() {
    this.days = [];
    for (let day = 1; day <= 31; day++) {
      this.days.push(day);
    }
  }

  getMonthOptions(): MonthOption[] {
    return this.monthOptions;
  }

  getStatusOptions(): StatusOption[] {
    return this.statusOptions;
  }

  getDaysInSelectedMonth(): number[] {
    if (!this.filters.year || !this.filters.month) {
      return this.days;
    }

    const year = parseInt(this.filters.year);
    const month = parseInt(this.filters.month);
    const daysInMonth = new Date(year, month, 0).getDate();

    const availableDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      availableDays.push(day);
    }
    return availableDays;
  }

  getStatusDisplayName(status: string): string {
    const statusOption = this.statusOptions.find((s) => s.value === status);
    return statusOption ? statusOption.label : 'All Status';
  }

  getMonthName(monthValue: string): string {
    const month = this.monthOptions.find(
      (m) => m.value.toString() === monthValue
    );
    return month ? month.label : '';
  }

  getFormattedDate(year: string, month: string, day: number): string {
    const date = new Date(parseInt(year), parseInt(month) - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  loadDashboard() {
    this.loading = true;

    const apiFilters = {
      year: this.filters.year || undefined,
      month: this.filters.month || undefined,
      day: this.filters.day || undefined,
      status: this.filters.status || undefined,
    };

    this.dashboardService.getDashboardData(apiFilters).subscribe({
      next: (res: any) => {
        this.dashboardData = res.data;
        this.loading = false;
        console.log('Dashboard data loaded:', this.dashboardData);
      },
      error: (error) => {
        console.error('Dashboard loading failed:', error);
        this.loading = false;
      },
    });
  }

  exportVATReport(): void {
    if (!this.filters.year || !this.filters.month) {
      alert('Please select year and month for VAT report');
      return;
    }

    this.exporting = true;

    const exportFilters = {
      year: this.filters.year,
      month: this.filters.month,
      status: 'completed',
      format: 'vat_report',
    };

    this.dashboardService.exportDashboardData(exportFilters).subscribe({
      next: (response: any) => {
        // Handle JSON response (not blob for VAT report)
        this.exportToExcel(response?.vat_report);
        console.log(response, '--------');

        this.exporting = false;
      },
      error: (error) => {
        console.error('VAT Export failed:', error);
        this.exporting = false;
        alert('VAT Export failed. Please try again.');
      },
    });
  }

  exportToExcel(report: any): void {
    if (!report || !report?.records || report?.records?.length === 0) {
      console.error('No records available to export');
      alert('No records available to export');
      return;
    }

    // Prepare records
    const records = report.records.map((r: any) => ({
      Bill_No: r.bill_number,
      // Service_Type: r.service_type,
      Service_Date: r.service_date
        ? new Date(r.service_date).toLocaleDateString()
        : '',
      Service_Time: r.service_time || '',
      Subtotal: r.subtotal || 0,
      VAT: r.vat_amount || 0,
      // Total: r.total_amount || 0,
      // Status: r.status || '',
      Customer_Name: r.customer_name || '',
      Customer_Mobile: r.customer_mobile || '',
      Plate_Number: r.plate_number || '',
      Vehicle: r.vehicle_info || '',
    }));

    // Prepare summary

    const summary = report.summary
      ? [
          {
            Period: report.summary.period || '',
            // Total_Sales: report.summary.total_sales || 0,
            Total_Before_VAT: report.summary.total_before_vat || 0,
            Total_VAT: report.summary.total_vat || 0,
            Record_Count: report.summary.record_count || 0,
          },
        ]
      : [];

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add sheets with fixed column widths
    if (summary.length > 0) {
      const wsSummary = XLSX.utils.json_to_sheet(summary);
      // Set min width for all summary columns
      wsSummary['!cols'] = new Array(Object.keys(summary[0]).length).fill({
        wch: 20,
      });
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    }

    const wsRecords = XLSX.utils.json_to_sheet(records);
    // Set min width for all records columns
    wsRecords['!cols'] = new Array(Object.keys(records[0]).length).fill({
      wch: 20,
    });
    XLSX.utils.book_append_sheet(wb, wsRecords, 'Records');

    // Trigger download
    // Trigger download with dynamic file name
    const period = report.summary?.period || 'report';
    const fileName = `vat_report_${period.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  exportData(): void {
    if (!this.dashboardData) return;

    this.exporting = true;

    const exportFilters = {
      ...this.filters,
      format: 'general_report',
    };

    this.dashboardService.exportDashboardData(exportFilters).subscribe({
      next: (response: any) => {
        const dataStr = JSON.stringify(response, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;

        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `Dashboard_Report_${timestamp}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.exporting = false;
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.exporting = false;
        alert('Export failed. Please try again.');
      },
    });
  }

  clearFilters(): void {
    this.filters = {
      year: '',
      month: '',
      day: '',
      status: 'completed',
    };
    this.loadDashboard();
  }

  refreshData(): void {
    this.loadDashboard();
  }

  setCurrentMonth(): void {
    const now = new Date();
    this.filters.year = now.getFullYear().toString();
    this.filters.month = (now.getMonth() + 1).toString();
    this.filters.day = '';
    this.loadDashboard();
  }

  setCurrentWeek(): void {
    const now = new Date();
    this.filters.year = now.getFullYear().toString();
    this.filters.month = (now.getMonth() + 1).toString();
    this.filters.day = '';
    this.loadDashboard();
  }

  setToday(): void {
    const now = new Date();
    this.filters.year = now.getFullYear().toString();
    this.filters.month = (now.getMonth() + 1).toString();
    this.filters.day = now.getDate().toString();
    this.loadDashboard();
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  isLargeDatasetWarning(): boolean {
    return !this.filters.year && !this.filters.month;
  }

  getFilterSummary(): string {
    const parts = [];

    if (this.filters.year) parts.push(`Year: ${this.filters.year}`);
    if (this.filters.month) {
      const monthName = this.getMonthName(this.filters.month);
      parts.push(`Month: ${monthName}`);
    }
    if (this.filters.day) parts.push(`Day: ${this.filters.day}`);
    if (this.filters.status) {
      const statusName = this.getStatusDisplayName(this.filters.status);
      parts.push(`Status: ${statusName}`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'No filters applied';
  }
}
