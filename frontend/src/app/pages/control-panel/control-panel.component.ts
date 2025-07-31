import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { SideBarComponent, SidebarMenuItem } from '../../components/side-bar/side-bar.component';
import { NgFor, NgIf } from '@angular/common';
import { BrandsListComponent } from '../../components/brands-list/brands-list.component';
import { BookingListComponent } from '../../components/booking-list/booking-list.component';
import { ModelListComponent } from '../../components/model-list/model-list.component';
import { OilTypesListComponent } from '../../components/oil-types-list/oil-types-list.component';
import { OilFiltersComponent } from "../../components/oil-filters/oil-filters.component";
import { BatteryTypesComponent } from "../../components/battery-types/battery-types.component";

@Component({
  selector: 'app-control-panel',
  imports: [NgIf, SideBarComponent, NgFor,
    BrandsListComponent,
    BookingListComponent,
    ModelListComponent,
    OilTypesListComponent,
    OilFiltersComponent, BatteryTypesComponent],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.scss'
})
export class ControlPanelComponent {
private apiService = inject(ApiService);

  // Sidebar state
  sidebarCollapsed = signal(false);
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
      id: 'brands',
      label: 'Vehicle Brands',
      icon: 'fas fa-car',
      slug:''
    },
    {
      id: 'models',
      label: 'Vehicle Models',
      icon: 'fas fa-list',
      slug:''
    },
    {
      id: 'oils',
      label: 'Oil Types',
      icon: 'fas fa-oil-can',
      slug:''
    },
    {
      id: 'filters',
      label: 'Oil Filters',
      icon: 'fas fa-filter',
      slug:''
    },
    {
      id: 'batteries',
      label: 'Battery Types',
      icon: 'fas fa-battery-full',
      slug:''
    },
    {
      id: 'accessories',
      label: 'Accessories',
      icon: 'fas fa-tools',
      slug:''
    }
  ];

  ngOnInit() {
    // this.loadData('brands');
    this.updateMenuCounts();
  }

  // Handle sidebar menu clicks
  onSidebarMenuClick(sectionId: string) {
    this.activeSection.set(sectionId);
    this.loadData(sectionId);
    this.addNewEvent.set(null)
  }

  // Handle sidebar toggle
  onSidebarToggle(collapsed: boolean) {
    this.sidebarCollapsed.set(collapsed);
  }

  // Load data based on section
  async loadData(section: string) {
    this.loading.set(true);
    
    try {
      switch (section) {
        case 'brands':
          // const brands = await this.apiService.getBrands().toPromise();
          // this.brands.set(brands || []);
          // break;
          
        case 'models':
          // const models = await this.apiService.getModels(1).toPromise(); // Load all models
          // this.models.set(models || []);
          // break;
          
        // case 'oils':
        //   const oils = await this.apiService.getOilTypes().toPromise();
        //   this.oilTypes.set(oils || []);
        //   break;
          
        case 'filters':
          // const filters = await this.apiService.getOilFilters().toPromise();
          // this.oilFilters.set(filters || []);
          // break;
          
        case 'batteries':
          // const batteries = await this.apiService.getBatteryTypes().toPromise();
          // this.batteryTypes.set(batteries || []);
          // break;
          
        case 'accessories':
          const accessories = await this.apiService.getAccessories().toPromise();
          this.accessories.set(accessories || []);
          break;
          
        case 'bookings':
          // Load bookings (you'll need to create this API endpoint)
          // const bookings = await this.apiService.getBookings().toPromise();
          // this.bookings.set(bookings || []);
          break;
      }
    } catch (error) {
      console.error(`Error loading ${section}:`, error);
    } finally {
      this.loading.set(false);
    }
  }

  // Update menu item counts
  private updateMenuCounts() {
    // You can update counts here if needed
    // this.menuItems[0].count = this.brands().length;
  }

  // Get current data based on active section
  getCurrentData() {
    switch (this.activeSection()) {
      case 'brands': return this.brands();
      case 'models': return this.models();
      case 'oils': return this.oilTypes();
      case 'filters': return this.oilFilters();
      case 'batteries': return this.batteryTypes();
      case 'accessories': return this.accessories();
      case 'bookings': return this.bookings();
      default: return [];
    }
  }

  // Get current section title
  getCurrentTitle() {
    const item = this.menuItems.find(item => item.id === this.activeSection());
    return item ? item.label : 'Control Panel';
  }

  addNew(): void {
    this.addNewEvent.set(false);
    setTimeout(() => {
    this.addNewEvent.set(true);
    });
  }
}
