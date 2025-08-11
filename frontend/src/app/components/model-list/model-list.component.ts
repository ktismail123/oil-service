import { Component, inject, OnInit, signal } from '@angular/core';
import { DataTableComponent } from '../data-table/data-table.component';
import { ApiService } from '../../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { VehicleModelModalComponent } from '../../modals/vehicle-model-modal/vehicle-model-modal.component';
import { ACTION_CONFIGS, ActionConfig } from '../../models/action';

@Component({
  selector: 'app-model-list',
  imports: [DataTableComponent],
  templateUrl: './model-list.component.html',
  styleUrl: './model-list.component.scss',
})
export class ModelListComponent implements OnInit {
  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);

  actionConfig: ActionConfig = ACTION_CONFIGS.EDIT_DELETE;
  

  models = signal<any[]>([]);

  ngOnInit(): void {
    this.loadModels();
  }

  loadModels(): void {
    this.apiService
      .getAllModels()
      .pipe(take(1))
      .subscribe({
        next: (res) => [this.models.set(res)],
      });
  }

  actionEvents(event: {
    event: 'add' | 'edit' | 'view' | 'delete';
    data?: any;
  }) {

    if (event.event === 'add' || event.event === 'edit') {
      this.dialog
        .open(VehicleModelModalComponent, {
          width: '500px',
          data: {
            mode: event.event,
            rowData: event?.data,
          },
        })
        .afterClosed()
        .subscribe({
          next: (res) => {
            this.loadModels();
          },
        });
    }

    if(event.event === 'delete'){
      this.apiService.deleteVehicleModel(event.data?.id).subscribe({
        next:(res => {
          if(res.success){
            alert('Successfully Deleetd');
            this.loadModels();
          }
        })
      })
    }
  }
}
