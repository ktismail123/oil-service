import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VehicleModel } from '../../../../models';
import { NgFor, NgIf } from '@angular/common';
import { SearchPipe } from '../../../../pipes/search.pipe';

@Component({
  selector: 'app-step2-model-selection',
  imports: [NgIf, NgFor, ReactiveFormsModule, FormsModule, SearchPipe],
  templateUrl: './step2-model-selection.component.html',
  styleUrl: './step2-model-selection.component.scss',
})
export class Step2ModelSelectionComponent {
  @Input() modelForm!: FormGroup;
  @Input() models: VehicleModel[] = [];
  @Input() selectedBrandName: string = '';

  searchTerm: string = '';
  searchKeys: string[] = ['name'];

  @Output() modelChange = new EventEmitter<void>();
  @Output() customModelChange = new EventEmitter<void>();

  onModelChange() {
    this.modelChange.emit();
  }

  onCustomModelChange() {
    this.customModelChange.emit();
  }
}
