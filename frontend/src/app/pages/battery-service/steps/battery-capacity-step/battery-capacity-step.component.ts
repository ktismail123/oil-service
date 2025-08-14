import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, OnChanges, output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SearchPipe } from '../../../../pipes/search.pipe';
import { ApiService } from '../../../../services/api.service';
import { take } from 'rxjs';

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
  private apiService = inject(ApiService);

  // Inputs
  initialCapacity = input<number | null>(null);
  
  // Outputs
  capacitySelected = output<number>();
  validityChanged = output<boolean>();
  capacityChange = output();

  // Signals
  capacityOptions = input<any[]>([]);

  capacityForm!: FormGroup;
   searchTerm: string = '';
  searchKeys: string[] = ['capacity'];
  
  isValid = computed(() => !!this.capacityForm?.get('capacity')?.value);

  ngOnInit() {
    this.initializeForm();
    this.subscribeToChanges();
    // this.loadBatteryTpes();
  }

  // loadBatteryTpes(): void {
  //   this.apiService
  //     .getBatteryTypes()
  //     .pipe(take(1))
  //     .subscribe({
  //       next: (res: any) => {
  //         this.capacityOptions.set(res)
  //       }
  //     });
  // }

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
