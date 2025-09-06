import { Component, inject, OnInit, signal } from '@angular/core';
import {
  DataTableComponent,
  SearchData,
  TableEvent,
} from '../data-table/data-table.component';
import { ApiService } from '../../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { OilFilterModalComponent } from '../../modals/oil-filter-modal/oil-filter-modal.component';
import {
  ACTION_CONFIGS,
  ActionConfig,
  ButtonActions,
} from '../../models/action';

@Component({
  selector: 'app-oil-filters',
  imports: [DataTableComponent],
  templateUrl: './oil-filters.component.html',
  styleUrl: './oil-filters.component.scss',
})
export class OilFiltersComponent implements OnInit {
  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);
  actionConfig: ActionConfig = ACTION_CONFIGS.EDIT_DELETE;

  oilFilters = signal<any[]>([]);
  filteredoilFilters = signal<any[]>(this.oilFilters());

  ngOnInit(): void {
    this.loadOilFilters();
  }

  loadOilFilters(): void {
    this.apiService
      .getOilFilters()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.oilFilters.set(res);
          this.filteredoilFilters.set(res);
        },
      });
  }

  actionEvents(event: { event: ButtonActions; data?: any }) {
    if (event.event === 'add' || event.event === 'edit') {
      this.dialog
        .open(OilFilterModalComponent, {
          width: '500px',
          data: {
            mode: event.event,
            rowData: event?.data,
          },
        })
        .afterClosed()
        .subscribe({
          next: (res) => {
            this.loadOilFilters();
          },
        });
    }

    if (event.event === 'delete') {
      this.apiService.deleteOilFilter(event.data?.id).subscribe({
        next: (res) => {
          if (res.success) {
            alert('Successfully Deleetd');
            this.loadOilFilters();
          }
        },
      });
    }
  }

  onTableEvent(event: TableEvent) {
    switch (event.type) {
      case 'search':
        this.handleSearchEvent(event.data as SearchData);
        break;
    }
  }

  private handleSearchEvent(searchData: SearchData) {
    if (!searchData || !searchData.searchTerm?.trim()) {
      // empty search -> reset to original data
      this.filteredoilFilters.set(this.oilFilters());
      return;
    }

    const term = searchData.searchTerm.toLowerCase();
    this.filteredoilFilters.set(
      this.oilFilters().filter(
        (b) =>
          b.brand.toLowerCase().includes(term) ||
          b.code.toLowerCase().includes(term) ||
          b.price.toString().includes(term) ||
          b.id.toString().includes(term)
      )
    );
  }

  refreshData() {
    this.loadOilFilters();
  }
}
