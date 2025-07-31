import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { ApiService } from '../../services/api.service';
import { take } from 'rxjs';
import { DataTableComponent } from '../data-table/data-table.component';

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

@Component({
  selector: 'app-booking-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    LoadingComponent,
    FormFieldComponent,
    CurrencyPipe,
    DataTableComponent
  ],
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.css']
})
export class BookingListComponent implements OnInit {
  serviceData: ServiceData[] = [];
  private apiService = inject(ApiService);

   displayedColumns = [
    'id', 'customer', 'vehicle', 'service_type', 
    'service_date', 'oil_quantity', 'subtotal', 
    'vat', 'total', 'status'
  ];


  ngOnInit() {
    // Replace this with your actual API call
    this.apiService.getBookings()
    .pipe(
      take(1)
    )
    .subscribe({
      next:(res => {
        this.serviceData = res.data;
      })
    })
  }

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

  onTableAction(event: any) {
    switch(event.event) {
      case 'add':
        // Handle add new record
        break;
      case 'edit':
        // Handle edit record
        console.log('Edit:', event.data);
        break;
      case 'view':
        // Handle view record
        console.log('View:', event.data);
        break;
      case 'delete':
        // Handle delete record
        console.log('Delete:', event.data);
        break;
    }
  }
}