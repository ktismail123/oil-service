import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { BatteryType } from '../../../../models';
import { CommonModule } from '@angular/common';
import { SearchPipe } from '../../../../pipes/search.pipe';
import { ApiService } from '../../../../services/api.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-battery-brand-step',
  imports: [ReactiveFormsModule, CommonModule, SearchPipe, FormsModule],
  templateUrl: './battery-brand-step.component.html',
  styleUrl: './battery-brand-step.component.scss',
})
export class BatteryBrandStepComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  // Inputs
  selectedCapacity = input.required<number>();
  capacityLabel = input.required<string>();
  batteryTypes = input<BatteryType[]>([]);
  initialBatteryTypeId = input<number | null>(null);

  // Outputs
  brandSelected = output<BatteryType>();
  validityChanged = output<boolean>();

  searchTerm: string = '';
  searchKeys: string[] = ['brand', 'price'];

  // Signals
  brandForm!: FormGroup;

  availableBrands = signal<any[]>([]);

  selectedCapacityLabel = computed(() => this.capacityLabel());

  isValid = computed(() => !!this.brandForm?.get('batteryTypeId')?.value);

  ngOnInit() {
    this.initializeForm();
    this.subscribeToChanges();
    this.loadBatteriesByAmp();
    console.log(this.initialBatteryTypeId());
    
  }

  loadBatteriesByAmp(): void {
    this.apiService
      .getBatteriesByAmp(this.selectedCapacity())
      .pipe(take(1))
      .subscribe({
        next: (res: any) => [this.availableBrands.set(res)],
      });
  }

  private initializeForm() {
    this.brandForm = this.fb.group({
      batteryTypeId: [this.initialBatteryTypeId()],
    });
  }

  private subscribeToChanges() {
    this.brandForm.get('batteryTypeId')?.valueChanges.subscribe((value) => {
      this.validityChanged.emit(!!value);
      if (value) {
        const selectedBattery = this.availableBrands().find(
          (b) => b.id == value
        );
        if (selectedBattery) {
          this.brandSelected.emit(selectedBattery);
        }
      }
    });
  }

  selectBatteryBrand(battery: BatteryType) {
    this.brandForm.get('batteryTypeId')?.setValue(battery.id);
  }

  getSelectedBatteryType(): BatteryType | null {
    const batteryTypeId = this.brandForm.get('batteryTypeId')?.value;
    return (
      this.availableBrands().find((battery) => battery.id == batteryTypeId) ||
      null
    );
  }

  formatPrice(price: number): any {
    // return price.toFixed(2);
    return price;
  }

  onBrandSelected() {}
}
