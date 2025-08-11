import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SearchPipe } from '../../../../pipes/search.pipe';

export interface CapacityOption {
  value: number;
  label: string;
  description: string;
}


@Component({
  selector: 'app-battery-capacity-step',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, SearchPipe],
  templateUrl: './battery-capacity-step.component.html',
  styleUrl: './battery-capacity-step.component.scss'
})
export class BatteryCapacityStepComponent {

  private fb = inject(FormBuilder);

  // Inputs
  initialCapacity = input<number | null>(null);
  
  // Outputs
  capacitySelected = output<number>();
  validityChanged = output<boolean>();
  capacityChange = output();

  // Signals
  capacityOptions = signal<CapacityOption[]>([
    { value: 80, label: '80 Amp', description: 'Suitable for small to medium cars' },
    { value: 90, label: '90 Amp', description: 'Suitable for medium cars' },
    { value: 110, label: '110 Amp', description: 'Suitable for large cars and SUVs' },
  ]);

  capacityForm!: FormGroup;
   searchTerm: string = '';
  searchKeys: string[] = ['name'];
  
  isValid = computed(() => !!this.capacityForm?.get('capacity')?.value);

  ngOnInit() {
    this.initializeForm();
    this.subscribeToChanges();
  }

  private initializeForm() {
    this.capacityForm = this.fb.group({
      capacity: [this.initialCapacity()]
    });
  }

  private subscribeToChanges() {
    this.capacityForm.get('capacity')?.valueChanges.subscribe(value => {
      this.validityChanged.emit(!!value);
      if (value) {
        this.capacitySelected.emit(value);
      }
    });
  }

  selectCapacity(capacity: number) {
    this.capacityForm.get('capacity')?.setValue(capacity);
  }

  getSelectedCapacity(): number | null {
    return this.capacityForm.get('capacity')?.value || null;
  }

  onCapacityChange() {
    this.capacityChange.emit();
  }

}
