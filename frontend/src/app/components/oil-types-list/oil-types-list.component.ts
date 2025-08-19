import { Component, inject, OnInit, signal } from '@angular/core';
import {
  DataTableComponent,
  SearchData,
  TableEvent,
} from '../data-table/data-table.component';
import { ApiService } from '../../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import {
  ACTION_CONFIGS,
  ActionConfig,
  ButtonActions,
} from '../../models/action';
import { OilTypeModalComponent } from '../../modals/oil-type-modal/oil-type-modal.component';

@Component({
  selector: 'app-oil-types-list',
  imports: [DataTableComponent],
  templateUrl: './oil-types-list.component.html',
  styleUrl: './oil-types-list.component.scss',
})
export class OilTypesListComponent implements OnInit {
  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);

  actionConfig: ActionConfig = ACTION_CONFIGS.EDIT_DELETE;

  oilTypes = signal<any[]>([]);
  filteredoilTypes = signal<any[]>(this.oilTypes());

  ngOnInit(): void {
    this.loadOilTypes();
  }

  loadOilTypes(): void {
    this.apiService
      .getOilTypes()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.oilTypes.set(res);
          this.filteredoilTypes.set(res);
        },
      });
  }

  actionEvents(event: { event: ButtonActions; data?: any }) {
    if (event.event === 'add' || event.event === 'edit') {
      this.dialog
        .open(OilTypeModalComponent, {
          width: '500px',
          disableClose: true,
          data: {
            mode: event.event,
            rowData: event?.data
          },
        })
        .afterClosed()
        .subscribe({
          next: (res) => {
            this.loadOilTypes();
          },
        });
    }

    if (event.event === 'delete') {
      this.apiService.deleteOililType(event.data?.id).subscribe({
        next: (res) => {
          if (res.success) {
            alert('Successfully Deleetd');
            this.loadOilTypes();
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
      this.filteredoilTypes.set(this.oilTypes());
      return;
    }

    const term = searchData.searchTerm.toLowerCase();
    this.filteredoilTypes.set(
      this.oilTypes().filter(
        (b) =>
          b.name.toLowerCase().includes(term) ||
          b.brand.toLowerCase().includes(term) ||
          b.grade.toLowerCase().includes(term) ||
          b.grade.toLowerCase().includes(term) ||
          b.service_interval.toLowerCase().includes(term) ||
          b.price_1l.toString().includes(term) ||
          b.price_4l.toString().includes(term) ||
          b.id.toString().includes(term)
      )
    );
  }
}
