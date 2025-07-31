import {
  Component,
  inject,
  signal,
  OnInit,
  output,
  input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddBrandModalComponent } from '../../modals/add-brand-modal/add-brand-modal.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { ApiService } from '../../services/api.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-brands-list',
  imports: [DataTableComponent],
  templateUrl: './brands-list.component.html',
  styleUrl: './brands-list.component.scss',
})
export class BrandsListComponent implements OnInit, OnChanges {
  private apiService = inject(ApiService);


  // Data signals
  brands = signal<any[]>([]);

  refreshTable = output();
  private dialog = inject(MatDialog);
  addNewEvent = input<boolean | null>(false);

  ngOnChanges(changes: SimpleChanges): void {
    console.log(this.addNewEvent());
    
  if (changes['addNewEvent'] && this.addNewEvent()) {
    this.addNewBrand({ event: 'add' });
  }
}

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.apiService
      .getBrands()
      .pipe(take(1))
      .subscribe({
        next: (res) => [this.brands.set(res)],
      });
  }

  addNewBrand(event: { event: 'add' | 'edit' | 'view' | 'delete', data?: any }) {
    this.dialog
      .open(AddBrandModalComponent, {
        width: '500px',
        data:{
          mode : event.event,
          rowData: event?.data
        }
      })
      .afterClosed()
      .subscribe({
        next: (res) => {
          this.loadBrands();
        },
      });
  }
}
