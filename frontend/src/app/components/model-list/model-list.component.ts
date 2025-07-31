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

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
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

  models = signal<any[]>([]);
}
