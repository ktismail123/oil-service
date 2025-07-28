import { NgFor, TitleCasePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  SimpleChanges,
  ViewChild,
  input,
  OnChanges,
  Signal,
  effect,
  computed,
  output,
} from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    TitleCasePipe,
    NgFor,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent implements AfterViewInit {
  displayedColumns = input<string[]>(['action']); // signal input
  rowDatas = input<any[]>(); // signal input
  addNew = output<{ event: 'add'| 'edit', data?: any }>();

  dataSource = new MatTableDataSource<any>([]);

  combinedColumns = computed(() => [...this.displayedColumns(), 'action']);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  constructor() {
    // reactively update dataSource when rowDatas changes
    effect(() => {
      const data = this.rowDatas();
      if (data) {
        this.dataSource.data = data;
      }
    });
  }

  onEdit(row: any) {
    this.addNew.emit({ event: 'edit', data: row });
  }

  onDelete(row: any) {
    console.log('Delete:', row);
    // Emit event or confirm delete
  }

  onAdd() {
    this.addNew.emit({ event: 'add' });
  }
}
