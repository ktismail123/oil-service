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
import {
  DataTableComponent,
  SearchData,
  TableEvent,
} from '../data-table/data-table.component';
import { ApiService } from '../../services/api.service';
import { take } from 'rxjs';
import {
  ACTION_CONFIGS,
  ActionConfig,
  ButtonActions,
} from '../../models/action';

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
  // filtered list
  filteredBrands = signal<any[]>(this.brands());

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
        next: (res) => {
          this.brands.set(res);
          this.filteredBrands.set(res);
        },
      });
  }

  actionEvents(action: { event: ButtonActions; data?: any }) {

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

    if (action.event === 'delete') {
      this.apiService.deleteBrand(action.data?.id).subscribe({
        next: (res) => {
          this.loadBrands();
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
      this.filteredBrands.set(this.brands());
      return;
    }

    const term = searchData.searchTerm.toLowerCase();
    this.filteredBrands.set(
      this.brands().filter(
        (b) =>
          b.name.toLowerCase().includes(term) || b.id.toString().includes(term)
      )
    );
  }

  refreshData(){
    this.loadBrands();
  }

  ngOnDestroy(): void {}
}
