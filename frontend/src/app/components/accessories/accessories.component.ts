import { Component, inject, signal } from '@angular/core';
import {
  DataTableComponent,
  SearchData,
  TableEvent,
} from '../data-table/data-table.component';
import { ApiService } from '../../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { AccessoriesModalComponent } from '../../modals/accessories-modal/accessories-modal.component';
import {
  ACTION_CONFIGS,
  ActionConfig,
  ButtonActions,
} from '../../models/action';

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
  filteredAccessories = signal<any[]>(this.accessories());

  ngOnInit(): void {
    this.loadAccessories();
  }

  loadAccessories(): void {
    this.apiService
      .getAccessories()
      .pipe(take(1))
      .subscribe({
        next: (res: any) => {
          this.accessories.set(res);
          this.filteredAccessories.set(res);
        },
      });
  }

  actionEvents(event: { event: ButtonActions; data?: any }) {
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
      this.filteredAccessories.set(this.accessories());
      return;
    }

    const term = searchData.searchTerm.toLowerCase();
    this.filteredAccessories.set(
      this.accessories().filter(
        (b) =>
          b.name.toLowerCase().includes(term) ||
          b.price.toString().includes(term) ||
          b.id.toString().includes(term)
      )
    );
  }

  refreshData() {
    this.loadAccessories();
  }
}
