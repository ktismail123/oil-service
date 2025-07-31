import { NgFor, NgIf, TitleCasePipe, NgClass, DatePipe } from '@angular/common';
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
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

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
    DatePipe
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent implements AfterViewInit {
  // Input signals
  displayedColumns = input<string[]>(['id', 'customer', 'vehicle', 'service_type', 'service_date', 'oil_quantity', 'subtotal', 'vat', 'total', 'status']);
  rowDatas = input<any[]>();
  showAddButton = input<boolean>(false);
  
  // Output signals
  addNew = output<{ event: 'add' | 'edit' | 'view' | 'delete', data?: any }>();

  dataSource = new MatTableDataSource<any>([]);

  // Predefined columns that have custom templates
  predefinedColumns = ['id', 'customer', 'vehicle', 'service_type', 'service_date', 'oil_quantity', 'subtotal', 'vat', 'total', 'status'];

  // Action menu state
  activeMenuId: number | null = null;

  // Computed signal for custom columns (columns not in predefined list)
  customDisplayedColumns = computed(() => 
    this.displayedColumns().filter(col => !this.predefinedColumns.includes(col) && col !== 'action')
  );

  // Computed signal for all columns including action
  getAllColumns = computed(() => [...this.displayedColumns(), 'action']);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    
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

  // Filter methods
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearSearch() {
    this.dataSource.filter = '';
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Utility methods for formatting
  formatServiceType(serviceType: string): string {
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

  // Paginator helper methods
  getStartIndex(): number {
    if (!this.paginator) return 0;
    return this.paginator.pageIndex * this.paginator.pageSize;
  }

  getEndIndex(): number {
    if (!this.paginator) return 0;
    const endIndex = (this.paginator.pageIndex + 1) * this.paginator.pageSize;
    return Math.min(endIndex, this.getTotalCount());
  }

  getTotalCount(): number {
    return this.dataSource.filteredData.length;
  }
  
}