import { Component, inject, OnInit, signal } from '@angular/core';
import { DataTableComponent } from '../data-table/data-table.component';
import { ApiService } from '../../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';

@Component({
  selector: 'app-model-list',
  imports: [DataTableComponent],
  templateUrl: './model-list.component.html',
  styleUrl: './model-list.component.scss',
})
export class ModelListComponent implements OnInit{
  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);

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
