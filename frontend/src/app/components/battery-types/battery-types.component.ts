import { Component, inject, signal } from '@angular/core';
import { DataTableComponent } from '../data-table/data-table.component';
import { ApiService } from '../../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';

@Component({
  selector: 'app-battery-types',
  imports: [DataTableComponent],
  templateUrl: './battery-types.component.html',
  styleUrl: './battery-types.component.scss'
})
export class BatteryTypesComponent {
 private apiService = inject(ApiService);
  private dialog = inject(MatDialog);

  batteryTypes = signal<any[]>([]);

  ngOnInit(): void {
    this.loadBatteryTpes();
  }

  loadBatteryTpes(): void {
    this.apiService
      .getBatteryTypes()
      .pipe(take(1))
      .subscribe({
        next: (res: any) => [this.batteryTypes.set(res)],
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
