import { Component, inject, OnInit, signal } from '@angular/core';
import { DataTableComponent } from '../data-table/data-table.component';
import { ApiService } from '../../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { ACTION_CONFIGS, ActionConfig } from '../../models/action';
import { OilTypeModalComponent } from '../../modals/oil-type-modal/oil-type-modal.component';

@Component({
  selector: 'app-oil-types-list',
  imports: [DataTableComponent],
  templateUrl: './oil-types-list.component.html',
  styleUrl: './oil-types-list.component.scss',
})
export class OilTypesListComponent implements OnInit{
  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);

  actionConfig: ActionConfig = ACTION_CONFIGS.EDIT_DELETE;
  

  oilTypes = signal<any[]>([]);

  ngOnInit(): void {
    this.loadOilTypes();
  }

  loadOilTypes(): void {
    this.apiService
      .getOilTypes()
      .pipe(take(1))
      .subscribe({
        next: (res) => [this.oilTypes.set(res)],
      });
  }

  actionEvents(event: {
    event: 'add' | 'edit' | 'view' | 'delete';
    data?: any;
  }) {

    if (event.event === 'add' || event.event === 'edit') {
      this.dialog
        .open(OilTypeModalComponent, {
          width: '500px',
          data: {
            mode: event.event,
            rowData: event?.data,
          },
        })
        .afterClosed()
        .subscribe({
          next: (res) => {
            this.loadOilTypes();
          },
        });
    }


    if(event.event === 'delete'){
      this.apiService.deleteOililType(event.data?.id).subscribe({
        next:(res => {
          if(res.success){
            alert('Successfully Deleetd');
            this.loadOilTypes();
          }
        })
      })
    }
  }
}
