import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Accessory, OilFilter, OilType } from '../../../../models';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-step7-customer-summary',
  imports: [ReactiveFormsModule, FormFieldComponent, NgIf, NgFor],
  templateUrl: './step7-customer-summary.component.html',
  styleUrl: './step7-customer-summary.component.scss',
})
export class Step7CustomerSummaryComponent {
  @Input() customerForm!: FormGroup;
  @Input() oilForm!: FormGroup;
  @Input() selectedBrandName: string = '';
  @Input() selectedModelName: string = '';
  @Input() serviceInterval: number = 0;
  @Input() selectedOilType: OilType | undefined;
  @Input() selectedFilter: OilFilter | undefined;
  @Input() selectedAccessories: Accessory[] = [];
  @Input() subtotal: number = 0;
  @Input() vatAmount: number = 0;
  @Input() totalAmount: number = 0;
  @Input() oilQuantity: number = 0;
}
