import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VehicleBrand } from '../../../../models';
import { NgFor, NgIf } from '@angular/common';
import { SearchPipe } from '../../../../pipes/search.pipe';

@Component({
  selector: 'app-step1-brand-selection',
  imports: [NgIf, NgFor, ReactiveFormsModule, FormsModule, SearchPipe],
  templateUrl: './step1-brand-selection.component.html',
  styleUrl: './step1-brand-selection.component.scss',
})
export class Step1BrandSelectionComponent {
  @Input() brandForm!: FormGroup;
  @Input() brands: VehicleBrand[] = [];

  searchTerm: string = '';
  searchKeys: string[] = ['name'];

  @Output() brandChange = new EventEmitter<void>();
  @Output() customBrandChange = new EventEmitter<void>();

  onBrandChange() {
    this.brandChange.emit();
  }

  onCustomBrandChange() {
    this.customBrandChange.emit();
  }
  
}
