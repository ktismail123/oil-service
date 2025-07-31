import {
  Component,
  inject,
  signal,
  OnInit,
  output,
  input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddBrandModalComponent } from '../../modals/add-brand-modal/add-brand-modal.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { ApiService } from '../../services/api.service';
import { take } from 'rxjs';
import { ACTION_CONFIGS, ActionConfig } from '../../models/action';

@Component({
  selector: 'app-brands-list',
  imports: [DataTableComponent],
  templateUrl: './brands-list.component.html',
  styleUrl: './brands-list.component.scss',
})
export class BrandsListComponent implements OnInit, OnChanges, OnDestroy {
  private apiService = inject(ApiService);

  // Data signals
  brands = signal<any[]>([]);

  actionConfig: ActionConfig = ACTION_CONFIGS.EDIT_DELETE;

  refreshTable = output();
  private dialog = inject(MatDialog);
  addNewEvent = input<boolean | null>(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['addNewEvent'] && this.addNewEvent()) {
      this.actionEvents({ event: 'add' });
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

  actionEvents(action: {
    event: 'add' | 'edit' | 'view' | 'delete';
    data?: any;
  }) {
    console.log(event);

    if (action.event === 'add' || action.event === 'edit') {
      this.dialog
        .open(AddBrandModalComponent, {
          width: '500px',
          data: {
            mode: action.event,
            rowData: action?.data,
          },
        })
        .afterClosed()
        .subscribe({
          next: (res) => {
            this.loadBrands();
          },
        });
    }

    if(action.event === 'delete'){
       this.apiService.deleteBrand(action.data?.id).subscribe({
        next:(res => {
            this.loadBrands();
        })
       })
    }
  }

  ngOnDestroy(): void {}
}
