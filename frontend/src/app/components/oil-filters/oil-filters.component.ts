import { Component, inject, OnInit, signal } from '@angular/core';
import { DataTableComponent } from '../data-table/data-table.component';
import { ApiService } from '../../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';

@Component({
  selector: 'app-oil-filters',
  imports: [DataTableComponent],
  templateUrl: './oil-filters.component.html',
  styleUrl: './oil-filters.component.scss',
})
export class OilFiltersComponent implements OnInit {
  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);

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
    console.log(event);

    // if (event.event === 'add' || event.event === 'edit') {
    //   this.dialog
    //     .open(AddBrandModalComponent, {
    //       width: '500px',
    //       data: {
    //         mode: event.event,
    //         rowData: event?.data,
    //       },
    //     })
    //     .afterClosed()
    //     .subscribe({
    //       next: (res) => {
    //         this.loadBrands();
    //       },
    //     });
    // }
  }
}
