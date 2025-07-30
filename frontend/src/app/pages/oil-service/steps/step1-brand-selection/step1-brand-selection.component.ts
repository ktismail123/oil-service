import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { VehicleBrand } from '../../../../models';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-step1-brand-selection',
  imports: [NgIf, NgFor, ReactiveFormsModule],
  templateUrl: './step1-brand-selection.component.html',
  styleUrl: './step1-brand-selection.component.scss',
})
export class Step1BrandSelectionComponent {
  @Input() brandForm!: FormGroup;
  @Input() brands: VehicleBrand[] = [];

  @Output() brandChange = new EventEmitter<void>();
  @Output() customBrandChange = new EventEmitter<void>();

  onBrandChange() {
    this.brandChange.emit();
  }

  onCustomBrandChange() {
    this.customBrandChange.emit();
  }
}
