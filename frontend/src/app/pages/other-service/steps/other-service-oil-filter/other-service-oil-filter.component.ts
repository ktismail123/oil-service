import { NgFor, NgIf } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { SearchPipe } from '../../../../pipes/search.pipe';
import { OilFilter } from '../../../../models';
import { ApiService } from '../../../../services/api.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-other-service-oil-filter',
  imports: [NgIf, NgFor, ReactiveFormsModule, FormsModule, SearchPipe],
  templateUrl: './other-service-oil-filter.component.html',
  styleUrl: './other-service-oil-filter.component.scss',
})
export class OtherServiceOilFilterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  oilFilters = signal<OilFilter[]>([]);
  searchTerm: string = '';
  searchKeys: string[] = ['code', 'brand', 'price'];

  filterForm!: FormGroup;
  filterChange = output();
  selectedOilFilter = input<any>();

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  initForm(): void {
    this.filterForm = this.fb.group({
      id: [this.selectedOilFilter()?.id || ''],
      price: [this.selectedOilFilter()?.price || ''],
      code: [this.selectedOilFilter()?.code || ''],
      brand: [this.selectedOilFilter()?.brand || ''],
    });
  }

  loadData(): void {
    this.apiService.getOilFilters()
    .pipe(
      take(1)
    )
    .subscribe({
      next: (res) => {
        this.oilFilters.set(res);
      },
    });
  }

  onFilterChange(filter?: {id: number, price: string, brand: string, code: string}) {
    this.filterForm.get('id')?.setValue(filter?.id) || null;
    this.filterForm.get('price')?.setValue(filter?.price || null);
    this.filterForm.get('brand')?.setValue(filter?.brand || null);
    this.filterForm.get('code')?.setValue(filter?.code || null);
    this.filterChange.emit(this.filterForm.value);
  }
}
