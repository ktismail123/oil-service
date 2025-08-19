import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { ApiService } from '../../services/api.service';
import { finalize, take } from 'rxjs';
import { DataTableComponent, TableEvent, PaginationData, SearchData } from '../data-table/data-table.component';
import { ACTION_CONFIGS, ActionConfig } from '../../models/action';
import { MatDialog } from '@angular/material/dialog';
import { EditOilServiceBookingComponent } from '../../modals/edit-oil-service-booking/edit-oil-service-booking.component';
import { Router } from '@angular/router';

interface ServiceData {
  id: number;
  service_type: string;
  service_date: string;
  service_time: string;
  service_interval: number;
  oil_quantity: string;
  subtotal: string;
  vat_percentage: string;
  vat_amount: string;
  total_amount: string;
  status: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_mobile: string;
  plate_number: string;
  brand_name: string;
  model_name: string;
  accessories: any[];
}

// Interface for API response
interface BookingResponse {
  success: boolean;
  data: ServiceData[];
  pagination: {
    current_page: number;
    per_page: number;
    total_records: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  filters: any;
}

@Component({
  selector: 'app-booking-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    LoadingComponent,
    FormFieldComponent,
    CurrencyPipe,
    DataTableComponent,
    FormsModule
  ],
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.css'],
})
export class BookingListComponent implements OnInit {
  // Data properties
  serviceData: ServiceData[] = [];
  
  // Pagination properties
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;
  
  // Search and filter properties
  currentSearchTerm = '';
  selectedStatus = '';
  selectedServiceType = '';
  
  // UI state
  loading = false;
  
  // Injected services
  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  // Table configuration
  displayedColumns = [
    'bill_number',
    'customer',
    'vehicle',
    'service_type',
    'service_date',
    'oil_quantity',
    'subtotal',
  ];

  actionConfig: ActionConfig = ACTION_CONFIGS.EDIT_DELETE;

  ngOnInit() {
    this.loadBookings();
  }

  // Handle table events (pagination and search)
  onTableEvent(event: TableEvent) {
    
    switch (event.type) {
      case 'pagination':
        this.handlePaginationEvent(event.data as PaginationData);
        break;
      case 'search':
        this.handleSearchEvent(event.data as SearchData);
        break;
    }
  }

  // Handle pagination events
  private handlePaginationEvent(paginationData: PaginationData) {
    console.log('Pagination event:', paginationData);
    
    this.currentPage = paginationData.pageIndex;
    this.pageSize = paginationData.pageSize;
    
    // Reload data with new pagination
    this.loadBookings();
  }

  // Handle search events
  private handleSearchEvent(searchData: SearchData) {
    console.log('Search event:', searchData);
    
    this.currentSearchTerm = searchData.searchTerm;
    this.currentPage = 0; // Reset to first page when searching
    
    // Reload data with search term
    this.loadBookings();
  }

  // Load bookings from API with current filters and pagination
  loadBookings() {
    this.loading = true;
    
    const params = {
      page: this.currentPage + 1, // Convert to 1-based for API
      limit: this.pageSize,
      search: this.currentSearchTerm,
      status: this.selectedStatus,
      service_type: this.selectedServiceType
    };

    console.log('Loading bookings with params:', params);

    this.apiService
      .getBookings(params)
      .pipe(
        take(1),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response: BookingResponse) => {
          console.log('API response:', response);
          
          if (response.success) {
            this.serviceData = response.data || [];
            this.totalRecords = response.pagination?.total_records || 0;
            
            // Update pagination info from API response
            this.currentPage = (response.pagination?.current_page || 1) - 1; // Convert to 0-based
            this.pageSize = response.pagination?.per_page || 10;
            
            console.log('Updated data:', {
              records: this.serviceData.length,
              total: this.totalRecords,
              currentPage: this.currentPage,
              pageSize: this.pageSize
            });
          } else {
            console.error('API returned error:', response);
            this.serviceData = [];
            this.totalRecords = 0;
          }
        },
        error: (error) => {
          console.error('Error loading bookings:', error);
          this.serviceData = [];
          this.totalRecords = 0;
          
          // Show user-friendly error message
          alert('Error loading bookings: ' + (error.message || 'Please try again later'));
        }
      });
  }

  // Handle table action events (add, edit, view, delete)
  onTableAction(event: any) {
    console.log('Table action:', event);
    
    switch (event.event) {
      case 'add':
        this.handleAdd();
        break;
      case 'edit':
        this.handleEdit(event.data);
        break;
      case 'view':
        this.handleView(event.data);
        break;
      case 'delete':
        this.handleDelete(event.data);
        break;
    }
  }

  // Handle add new record
  private handleAdd() {
    console.log('Add new booking');
    // Navigate to add booking page or open modal
    this.router.navigate(['/oil-service'], {
      queryParams: { mode: 'add' }
    });
  }

  // Handle edit record
  private handleEdit(data: ServiceData) {
    console.log('Edit booking:', data);
    
    if (data?.service_type === 'oil_change') {
      this.router.navigate(['/oil-service'], {
        queryParams: { mode: 'edit' },
        state: { item: data },
      });
    } else {
      this.router.navigate(['/battery-service'], {
        queryParams: { mode: 'edit' },
        state: { item: data },
      });
    }
  }

  // Handle view record
  private handleView(data: ServiceData) {
    console.log('View booking:', data);
    
    // You can either navigate to a view page or open a modal
    if (data?.service_type === 'oil_change') {
      this.router.navigate(['/oil-service'], {
        queryParams: { mode: 'view' },
        state: { item: data },
      });
    } else {
      this.router.navigate(['/battery-service'], {
        queryParams: { mode: 'view' },
        state: { item: data },
      });
    }
  }

  // Handle delete record
  private handleDelete(data: ServiceData) {
    console.log('Delete booking:', data);
    
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete booking #${data.id} for ${data.customer_name}?`);
    
    if (confirmed) {
      this.deleteBooking(data.id);
    }
  }

  // Delete booking API call
  deleteBooking(id: number) {
    this.loading = true;
    
    this.apiService
      .deleteBooking(id)
      .pipe(
        take(1),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            alert('Booking deleted successfully');
            // Reload current page data
            this.loadBookings();
          } else {
            alert('Failed to delete booking: ' + (res.message || 'Unknown error'));
          }
        },
        error: (error) => {
          console.error('Error deleting booking:', error);
          alert('Error deleting booking: ' + (error.message || 'Please try again later'));
        }
      });
  }

  // Alternative method using modal for editing
  editBookingModal(data: ServiceData): void {
    this.dialog.open(EditOilServiceBookingComponent, {
      width: '500px',
      data: {
        mode: 'edit',
        rowData: data,
      },
    }).afterClosed().subscribe(result => {
      if (result) {
        // Reload data if modal returned success
        this.loadBookings();
      }
    });
  }

  // Utility methods for formatting (if needed in template)
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatServiceType(serviceType: string): string {
    return serviceType.replace('_', ' ').toUpperCase();
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Method to refresh data (can be called from template)
  refreshData() {
    this.loadBookings();
  }

  // Method to reset filters (can be called from template)
  resetFilters() {
    this.currentSearchTerm = '';
    this.selectedStatus = '';
    this.selectedServiceType = '';
    this.currentPage = 0;
    this.loadBookings();
  }
}