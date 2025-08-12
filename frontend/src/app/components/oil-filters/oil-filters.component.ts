import { Component, inject, OnInit, signal } from '@angular/core';
import { DataTableComponent } from '../data-table/data-table.component';
import { ApiService } from '../../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { OilFilterModalComponent } from '../../modals/oil-filter-modal/oil-filter-modal.component';
import { ACTION_CONFIGS, ActionConfig } from '../../models/action';

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

  ngOnInit(): void {
    this.loadOilFilters();
  }

  loadOilFilters(): void {
    this.apiService
      .getOilFilters()
      .pipe(take(1))
      .subscribe({
        next: (res) => [this.oilFilters.set(res)],
      });
  }

  actionEvents(event: {
    event: 'add' | 'edit' | 'view' | 'delete';
    data?: any;
  }) {

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

    if(event.event === 'delete'){
      this.apiService.deleteOilFilter(event.data?.id).subscribe({
        next:(res => {
          if(res.success){
            alert('Successfully Deleetd');
            this.loadOilFilters();
          }
        })
      })
    }
  }
}
