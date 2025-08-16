import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import {
  SideBarComponent,
  SidebarMenuItem,
} from '../../components/side-bar/side-bar.component';
import { NgIf } from '@angular/common';
import { BrandsListComponent } from '../../components/brands-list/brands-list.component';
import { BookingListComponent } from '../../components/booking-list/booking-list.component';
import { ModelListComponent } from '../../components/model-list/model-list.component';
import { OilTypesListComponent } from '../../components/oil-types-list/oil-types-list.component';
import { OilFiltersComponent } from '../../components/oil-filters/oil-filters.component';
import { BatteryTypesComponent } from '../../components/battery-types/battery-types.component';
import { AccessoriesComponent } from '../../components/accessories/accessories.component';
import { UserManagementComponent } from '../../components/user-management/user-management.component';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from '../../components/dashboard/dashboard.component';

@Component({
  selector: 'app-control-panel',
  imports: [
    NgIf,
    SideBarComponent,
    BrandsListComponent,
    BookingListComponent,
    ModelListComponent,
    OilTypesListComponent,
    OilFiltersComponent,
    BatteryTypesComponent,
    AccessoriesComponent,
    UserManagementComponent,
    RouterModule,
    DashboardComponent
  ],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.scss',
})
export class ControlPanelComponent {
  private apiService = inject(ApiService);

  // Sidebar state
  sidebarCollapsed = signal(true);
  addNewEvent = signal<boolean | null>(false);
  activeSection = signal<string>('bookings');

  // Data signals
  brands = signal<any[]>([]);
  models = signal<any[]>([]);
  oilTypes = signal<any[]>([]);
  oilFilters = signal<any[]>([]);
  batteryTypes = signal<any[]>([]);
  accessories = signal<any[]>([]);
  bookings = signal<any[]>([]);

  // Loading states
  loading = signal(false);

  // Sidebar menu items
  menuItems: SidebarMenuItem[] = [
    {
      id: 'bookings',
      label: 'All Bookings',
      icon: 'fas fa-calendar-check',
      slug: 'bookings',
      active: true,
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'fas fa-home',
      slug: 'dashboard',
      active: false,
    },
    {
      id: 'brands',
      label: 'Vehicle Brands',
      icon: 'fas fa-car',
      slug: '',
    },
    {
      id: 'models',
      label: 'Vehicle Models',
      icon: 'fas fa-list',
      slug: '',
    },
    {
      id: 'oils',
      label: 'Oil Types',
      icon: 'fas fa-oil-can',
      slug: '',
    },
    {
      id: 'filters',
      label: 'Oil Filters',
      icon: 'fas fa-filter',
      slug: '',
    },
    {
      id: 'batteries',
      label: 'Battery Types',
      icon: 'fas fa-battery-full',
      slug: '',
    },
    {
      id: 'accessories',
      label: 'Accessories',
      icon: 'fas fa-tools',
      slug: '',
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: 'fas fa-user',
      slug: '',
    },
  ];

  ngOnInit() {
    this.updateMenuCounts();
  }

  // Handle sidebar menu clicks
  onSidebarMenuClick(sectionId: string) {
    this.activeSection.set(sectionId);
    this.addNewEvent.set(null);
  }

  // Handle sidebar toggle
  onSidebarToggle(collapsed: boolean) {
    this.sidebarCollapsed.set(collapsed);
  }

  // Update menu item counts
  private updateMenuCounts() {
    // You can update counts here if needed
    // this.menuItems[0].count = this.brands().length;
  }

  // Get current data based on active section
  getCurrentData() {
    switch (this.activeSection()) {
      case 'brands':
        return this.brands();
      case 'models':
        return this.models();
      case 'oils':
        return this.oilTypes();
      case 'filters':
        return this.oilFilters();
      case 'batteries':
        return this.batteryTypes();
      case 'accessories':
        return this.accessories();
      case 'bookings':
        return this.bookings();
      default:
        return [];
    }
  }

  // Get current section title
  getCurrentTitle() {
    const item = this.menuItems.find(
      (item) => item.id === this.activeSection()
    );
    return item ? item.label : 'Control Panel';
  }

  addNew(): void {
    this.addNewEvent.set(false);
    setTimeout(() => {
      this.addNewEvent.set(true);
    });
  }
}
