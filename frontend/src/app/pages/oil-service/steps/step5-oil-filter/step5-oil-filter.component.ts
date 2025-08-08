import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OilFilter } from '../../../../models';
import { NgFor, NgIf } from '@angular/common';
import { SearchPipe } from '../../../../pipes/search.pipe';

@Component({
  selector: 'app-step5-oil-filter',
  imports: [NgIf, NgFor, ReactiveFormsModule, FormsModule, SearchPipe],
  templateUrl: './step5-oil-filter.component.html',
  styleUrl: './step5-oil-filter.component.scss',
})
export class Step5OilFilterComponent {
  @Input() filterForm!: FormGroup;
  @Input() oilFilters: OilFilter[] = [];
  searchTerm: string = '';
  searchKeys: string[] = ['code', 'brand', 'price'];

  @Output() filterChange = new EventEmitter<void>();

  onFilterChange() {
    this.filterChange.emit();
  }
}
