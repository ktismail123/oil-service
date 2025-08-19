import { Component, inject, signal } from '@angular/core';
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
import { BatteryTypesModalComponent } from '../../modals/battery-types-modal/battery-types-modal.component';

@Component({
  selector: 'app-battery-types',
  imports: [DataTableComponent],
  templateUrl: './battery-types.component.html',
  styleUrl: './battery-types.component.scss',
})
export class BatteryTypesComponent {
  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);
  actionConfig: ActionConfig = ACTION_CONFIGS.EDIT_DELETE;

  batteryTypes = signal<any[]>([]);
  filteredbBatteryTypes = signal<any[]>(this.batteryTypes());

  ngOnInit(): void {
    this.loadBatteryTpes();
  }

  loadBatteryTpes(): void {
    this.apiService
      .getBatteryTypes()
      .pipe(take(1))
      .subscribe({
        next: (res: any) => {
          this.batteryTypes.set(res);
          this.filteredbBatteryTypes.set(res);
        },
      });
  }

  actionEvents(event: { event: ButtonActions; data?: any }) {
    if (event.event === 'add' || event.event === 'edit') {
      this.dialog
        .open(BatteryTypesModalComponent, {
          width: '500px',
          data: {
            mode: event.event,
            rowData: event?.data,
          },
        })
        .afterClosed()
        .subscribe({
          next: (res) => {
            this.loadBatteryTpes();
          },
        });
    }

    if (event.event === 'delete') {
      this.apiService.deleteBatteryType(event.data?.id).subscribe({
        next: (res) => {
          if (res.success) {
            alert('Successfully Deleetd');
            this.loadBatteryTpes();
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
      this.filteredbBatteryTypes.set(this.batteryTypes());
      return;
    }

    const term = searchData.searchTerm.toLowerCase();
    this.filteredbBatteryTypes.set(
      this.batteryTypes().filter(
        (b) =>
          b.brand.toLowerCase().includes(term) ||
          b.capacity.toString().includes(term) ||
          b.price.toString().includes(term) ||
          b.id.toString().includes(term)
      )
    );
  }
}
