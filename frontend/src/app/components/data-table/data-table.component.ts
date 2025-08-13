import { NgFor, NgIf, TitleCasePipe, NgClass, DatePipe, NgStyle } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ViewChild,
  input,
  Signal,
  effect,
  computed,
  output,
} from '@angular/core';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActionConfig } from '../../models/action';

// Interface for pagination data
export interface PaginationData {
  pageIndex: number;
  pageSize: number;
  length: number;
}

// Interface for search data
export interface SearchData {
  searchTerm: string;
}

// Interface for table events
export interface TableEvent {
  type: 'pagination' | 'search';
  data: PaginationData | SearchData;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    TitleCasePipe,
    NgFor,
    NgIf,
    NgClass,
    MatIconModule,
    MatButtonModule,
    DatePipe,
    NgStyle
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent implements AfterViewInit {
  // Input signals
  displayedColumns = input<string[]>(['id', 'customer', 'vehicle', 'service_type', 'service_date', 'oil_quantity', 'subtotal', 'vat', 'total', 'status']);
  rowDatas = input<any[]>();
  showAddButton = input<boolean>(false);
  refreshButton = input<boolean>(false);
  height = input<string>('80px');
  
  // NEW: Pagination inputs from parent (API response)
  totalRecords = input<number>(0);
  currentPage = input<number>(0);
  pageSize = input<number>(10);
  loading = input<boolean>(false);
  
  // Output signals
  addNew = output<{ event: 'add' | 'edit' | 'view' | 'delete', data?: any }>();
  refreshTable = output();
  
  // NEW: Output for pagination and search events
  tableEvent = output<TableEvent>();

  // Action Configuration Input
  actionConfig = input<ActionConfig>({
    showView: true,
    showEdit: true,
    showDelete: true
  });

  dataSource = new MatTableDataSource<any>([]);

  // Predefined columns that have custom templates
  predefinedColumns = ['id', 'customer', 'vehicle', 'service_type', 'service_date', 'oil_quantity', 'subtotal', 'vat', 'total', 'status'];

  // Action menu state
  activeMenuId: number | null = null;

  // Search state
  private searchTimeout: any;
  currentSearchTerm = '';

  // Computed signal for custom columns (columns not in predefined list)
  customDisplayedColumns = computed(() => 
    this.displayedColumns().filter(col => !this.predefinedColumns.includes(col) && col !== 'action')
  );

  // Computed signal for all columns including action
  getAllColumns = computed(() => [...this.displayedColumns(), 'action']);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    // Don't set paginator for dataSource since we're handling pagination externally
    // this.dataSource.paginator = this.paginator;
    
    // Configure paginator with external data
    effect(() => {
      if (this.paginator) {
        this.paginator.length = this.totalRecords();
        this.paginator.pageIndex = this.currentPage();
        this.paginator.pageSize = this.pageSize();
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', () => {
      this.closeActionMenu();
    });
  }

  constructor() {
    // Reactively update dataSource when rowDatas changes
    effect(() => {
      const data = this.rowDatas();
      if (data) {
        this.dataSource.data = data;
        // Disable client-side pagination and filtering since we handle it server-side
        this.dataSource.paginator = null;
        this.dataSource.filter = '';
      }
    });
  }

  // NEW: Handle pagination events
  onPageChange(event: PageEvent) {
    console.log('Page change event:', event);
    
    this.tableEvent.emit({
      type: 'pagination',
      data: {
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
        length: event.length
      }
    });
  }

  // Action menu methods
  toggleActionMenu(id: number, event: Event) {
    event.stopPropagation();
    this.activeMenuId = this.activeMenuId === id ? null : id;
  }

  closeActionMenu() {
    this.activeMenuId = null;
  }

  // Action methods
  onView(row: any) {
    this.addNew.emit({ event: 'view', data: row });
  }

  onEdit(row: any) {
    this.addNew.emit({ event: 'edit', data: row });
  }

  onDelete(row: any) {
    this.addNew.emit({ event: 'delete', data: row });
  }

  onAdd() {
    this.addNew.emit({ event: 'add' });
  }

  refresh() {
    this.refreshTable.emit();
  }

  // UPDATED: Filter methods - now emit search events instead of local filtering
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.currentSearchTerm = filterValue.trim();
    
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Debounce search to avoid too many API calls
    this.searchTimeout = setTimeout(() => {
      this.emitSearchEvent(this.currentSearchTerm);
    }, 500); // 500ms delay
  }

  clearSearch() {
    this.currentSearchTerm = '';
    this.emitSearchEvent('');
  }

  // NEW: Emit search event
  private emitSearchEvent(searchTerm: string) {
    console.log('Search event:', searchTerm);
    
    this.tableEvent.emit({
      type: 'search',
      data: {
        searchTerm: searchTerm
      }
    });
  }

  // Utility methods for formatting
  formatServiceType(service: string): string {
    const serviceType = service === 'battery_replacement' ? 'battery' : 'service'
    return serviceType.replace(/_/g, ' ').toUpperCase();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Method to get nested values from object
  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj) || '';
  }

  // UPDATED: Paginator helper methods - now use external data
  getStartIndex(): number {
    const pageIndex = this.currentPage();
    const pageSize = this.pageSize();
    return pageIndex * pageSize;
  }

  getEndIndex(): number {
    const pageIndex = this.currentPage();
    const pageSize = this.pageSize();
    const total = this.totalRecords();
    const endIndex = (pageIndex + 1) * pageSize;
    return Math.min(endIndex, total);
  }

  getTotalCount(): number {
    return this.totalRecords();
  }

  // Properties for custom delete modal
  showDeleteConfirmation = false;
  itemToDelete: any = null;

  // Method to show delete confirmation (replace confirmDelete)
  confirmDelete(element: any) {
    this.itemToDelete = element;
    this.showDeleteConfirmation = true;
  }

  // Get display name for item being deleted
  getDeleteItemName(): string {
    if (!this.itemToDelete) return '';
    
    return this.itemToDelete.customer_name || 
           this.itemToDelete.name || 
           this.itemToDelete.title || 
           `Record #${this.itemToDelete.id}` ||
           'this item';
  }

  // Cancel delete operation
  cancelDelete() {
    this.showDeleteConfirmation = false;
    this.itemToDelete = null;
  }

  // Proceed with delete operation
  proceedDelete() {
    if (this.itemToDelete) {
      this.onDelete(this.itemToDelete);
      this.cancelDelete();
    }
  }

  // Custom action handler
  onCustomAction(actionKey: string, element: any) {
    // this.addNew.emit({ 
    //   event: 'custom', 
    //   data: element, 
    //   customAction: actionKey 
    // });
  }

  // Check if action should be disabled
  isActionDisabled(actionKey: string, element: any): boolean {
    const config = this.actionConfig();
    const disableCondition = config?.disableConditions?.[actionKey];
    return disableCondition ? disableCondition(element) : false;
  }
}