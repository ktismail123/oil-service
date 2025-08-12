import { Component, inject, signal } from '@angular/core';
import { DataTableComponent } from '../data-table/data-table.component';
import { ApiService } from '../../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { AccessoriesModalComponent } from '../../modals/accessories-modal/accessories-modal.component';
import { ACTION_CONFIGS, ActionConfig } from '../../models/action';

@Component({
  selector: 'app-accessories',
  imports: [DataTableComponent],
  templateUrl: './accessories.component.html',
  styleUrl: './accessories.component.scss',
})
export class AccessoriesComponent {
  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);

  actionConfig: ActionConfig = ACTION_CONFIGS.EDIT_DELETE;

  accessories = signal<any[]>([]);

  ngOnInit(): void {
    this.loadAccessories();
  }

  loadAccessories(): void {
    this.apiService
      .getAccessories()
      .pipe(take(1))
      .subscribe({
        next: (res: any) => [this.accessories.set(res)],
      });
  }

  actionEvents(event: {
    event: 'add' | 'edit' | 'view' | 'delete';
    data?: any;
  }) {
    if (event.event === 'add' || event.event === 'edit') {
      this.dialog
        .open(AccessoriesModalComponent, {
          width: '500px',
          data: {
            mode: event.event,
            rowData: event?.data,
          },
        })
        .afterClosed()
        .subscribe({
          next: (res) => {
            this.loadAccessories();
          },
        });
    }

    if (event.event === 'delete') {
      this.apiService.deleteAccessory(event.data?.id).subscribe({
        next: (res) => {
          if (res.success) {
            alert('Successfully Deleetd');
            this.loadAccessories();
          }
        },
      });
    }
  }
}
