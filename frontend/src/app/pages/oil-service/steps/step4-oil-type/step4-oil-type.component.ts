import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  signal,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { OilType } from '../../../../models';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { SearchPipe } from '../../../../pipes/search.pipe';

export interface OilPackageSelection {
  oilTypeId: number;
  package4L: boolean;
  package1L: boolean;
  bulkQuantity: number;
  totalQuantity: number;
  totalPrice: number;
}

// Extended interface for internal use with quantities
interface ExtendedOilPackageSelection extends OilPackageSelection {
  package4L_count: number; // Internal count for 4L packages
  package1L_count: number; // Internal count for 1L packages
}

@Component({
  selector: 'app-step4-oil-type',
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    FormFieldComponent,
    NgClass,
    FormsModule,
    SearchPipe,
  ],
  templateUrl: './step4-oil-type.component.html',
  styleUrl: './step4-oil-type.component.scss',
})
export class Step4OilTypeComponent implements OnInit, OnChanges, OnDestroy {
  @Input() oilForm!: FormGroup;
  @Input() oilTypes: OilType[] = [];
  @Input() selectedIntervell!: number;

  searchTerm: string = '';
  searchKeys: string[] = ['brand', 'grade', 'name'];

  viscosityOptions: string[] = [];

  reqOilQnyForm = new FormGroup({
    requiredOilQuantity: new FormControl(4),
  });

  @Output() oilTypeChange = new EventEmitter<void>();
  @Output() oilQuantityChange = new EventEmitter<void>();

  selectedOilId = signal<number | null>(null);
  requiredQuantity = signal<number>(0);
  packageSelections = signal<Map<number, ExtendedOilPackageSelection>>(
    new Map()
  );
  private isInitialized = false;

  errorMessage = signal('');

  ngOnInit(): void {
    this.populateExistingData();
    this.isInitialized = true;
    this.updateViscosityOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-populate data when oilForm or oilTypes change
    if (this.isInitialized && (changes['oilForm'] || changes['oilTypes'])) {
      this.populateExistingData();
      this.updateViscosityOptions();
    }
  }

  private updateViscosityOptions(): void {
    this.viscosityOptions =
      this.selectedIntervell === 5000
        ? ['20W-50']
        : this.getDefaultViscosityOptions();
  }

  private getDefaultViscosityOptions(): string[] {
    return ['5W-30', '5W-40', '10W-30', '10W-40', '15W-40', '20W-50'];
  }

  private populateExistingData(): void {
    if (!this.oilForm) return;

    // Get existing form values
    const existingOilTypeId = this.oilForm.get('oilTypeId')?.value;
    const existingRequiredQuantity =
      this.oilForm.get('requiredQuantity')?.value;
    const existingOilQuantityDetails =
      this.oilForm.get('oilQuantityDetails')?.value;


    // Populate required quantity
    if (existingRequiredQuantity) {
      this.reqOilQnyForm
        .get('requiredOilQuantity')
        ?.setValue(existingRequiredQuantity);
      this.requiredQuantity.set(existingRequiredQuantity);
    }

    // Populate selected oil type
    if (existingOilTypeId) {
      this.selectedOilId.set(existingOilTypeId);

      // If we have detailed package selection data, restore it
      if (existingOilQuantityDetails) {
        this.populatePackageSelection(
          existingOilTypeId,
          existingOilQuantityDetails
        );
      } else {
        // If no detailed data, try to reverse-engineer from basic form values
        this.reconstructPackageSelection(existingOilTypeId);
      }
    }
  }

  private populatePackageSelection(oilTypeId: number, details: any): void {
    const oil = this.oilTypes.find((o) => o.id === oilTypeId);
    if (!oil) return;

    const extendedSelection: ExtendedOilPackageSelection = {
      oilTypeId: oilTypeId,
      package4L: details.package4L || false,
      package1L: details.package1L || false,
      bulkQuantity: details.bulkQuantity || 0,
      totalQuantity: details.totalQuantity || 0,
      totalPrice: details.totalPrice || 0,
      package4L_count: details.package4L_count || 0,
      package1L_count: details.package1L_count || 0,
    };

    // If we don't have the count data, try to calculate it from boolean flags and quantities
    if (!details.package4L_count && details.package4L) {
      extendedSelection.package4L_count = this.calculatePackageCount(
        details.totalQuantity - details.bulkQuantity,
        oil,
        '4L'
      );
    }

    if (!details.package1L_count && details.package1L) {
      extendedSelection.package1L_count = this.calculatePackageCount(
        details.totalQuantity -
          details.bulkQuantity -
          extendedSelection.package4L_count * 4,
        oil,
        '1L'
      );
    }

    const newSelections = new Map(this.packageSelections());
    newSelections.set(oilTypeId, extendedSelection);
    this.packageSelections.set(newSelections);

  }

  private reconstructPackageSelection(oilTypeId: number): void {
    const oil = this.oilTypes.find((o) => o.id === oilTypeId);
    if (!oil) return;

    const totalQuantity = this.oilForm.get('quantity')?.value || 0;
    const totalPrice = this.oilForm.get('totalPrice')?.value || 0;

    if (totalQuantity === 0) {
      // No existing data to reconstruct
      return;
    }

    // Try to reverse-engineer the package selection based on price and quantity
    const extendedSelection: ExtendedOilPackageSelection = {
      oilTypeId: oilTypeId,
      package4L: false,
      package1L: false,
      bulkQuantity: 0,
      totalQuantity: totalQuantity,
      totalPrice: totalPrice,
      package4L_count: 0,
      package1L_count: 0,
    };

    // Simple reconstruction logic - this could be made more sophisticated
    // For now, assume it's all bulk if bulk is available, otherwise try packages
    if (oil.bulk_available && oil.price_per_liter > 0) {
      const bulkCost = totalQuantity * oil.price_per_liter;
      if (Math.abs(bulkCost - totalPrice) < 0.01) {
        extendedSelection.bulkQuantity = totalQuantity;
      }
    }

    // If not bulk, try to figure out package combination
    if (extendedSelection.bulkQuantity === 0) {
      this.reconstructPackageCombination(
        extendedSelection,
        oil,
        totalQuantity,
        totalPrice
      );
    }

    const newSelections = new Map(this.packageSelections());
    newSelections.set(oilTypeId, extendedSelection);
    this.packageSelections.set(newSelections);

  }

  private reconstructPackageCombination(
    selection: ExtendedOilPackageSelection,
    oil: OilType,
    totalQuantity: number,
    totalPrice: number
  ): void {
    // Try different combinations to match the total quantity and price
    if (oil.package_4l_available && oil.package_1l_available) {
      for (let pkg4L = Math.floor(totalQuantity / 4); pkg4L >= 0; pkg4L--) {
        const remaining = totalQuantity - pkg4L * 4;
        if (remaining >= 0 && oil.package_1l_available) {
          const pkg1L = Math.ceil(remaining);
          const calculatedPrice = pkg4L * oil.price_4l + pkg1L * oil.price_1l;

          if (Math.abs(calculatedPrice - totalPrice) < 0.01) {
            selection.package4L_count = pkg4L;
            selection.package1L_count = pkg1L;
            selection.package4L = pkg4L > 0;
            selection.package1L = pkg1L > 0;
            break;
          }
        }
      }
    } else if (oil.package_4l_available) {
      const pkg4L = Math.ceil(totalQuantity / 4);
      const calculatedPrice = pkg4L * oil.price_4l;
      if (Math.abs(calculatedPrice - totalPrice) < 0.01) {
        selection.package4L_count = pkg4L;
        selection.package4L = true;
      }
    } else if (oil.package_1l_available) {
      const pkg1L = Math.ceil(totalQuantity);
      const calculatedPrice = pkg1L * oil.price_1l;
      if (Math.abs(calculatedPrice - totalPrice) < 0.01) {
        selection.package1L_count = pkg1L;
        selection.package1L = true;
      }
    }
  }

  private calculatePackageCount(
    remainingQuantity: number,
    oil: OilType,
    packageType: '4L' | '1L'
  ): number {
    if (packageType === '4L' && oil.package_4l_available) {
      return Math.floor(remainingQuantity / 4);
    } else if (packageType === '1L' && oil.package_1l_available) {
      return Math.ceil(remainingQuantity);
    }
    return 0;
  }

  getExtendedSelection(oilId: number): ExtendedOilPackageSelection {
    const selection = this.packageSelections().get(oilId);
    if (selection) return selection;

    const defaultSelection: ExtendedOilPackageSelection = {
      oilTypeId: oilId,
      package4L: false,
      package1L: false,
      bulkQuantity: 0,
      totalQuantity: 0,
      totalPrice: 0,
      package4L_count: 0,
      package1L_count: 0,
    };

    const newSelections = new Map(this.packageSelections());
    newSelections.set(oilId, defaultSelection);
    this.packageSelections.set(newSelections);

    return defaultSelection;
  }

  getSelectedOilDetails() {
    const id = this.selectedOilId();
    return id ? this.oilTypes.find((oil) => oil.id === id) : null;
  }

  selectOilType(oilId: number) {
    this.selectedOilId.set(oilId);
    this.oilForm.get('oilTypeId')?.setValue(oilId);
    this.updateFormValues();
    this.oilTypeChange.emit();
  }

  increase4LPackage(oilId: number) {
    const selection = this.getExtendedSelection(oilId);
    selection.package4L_count += 1;
    selection.package4L = selection.package4L_count > 0;
    this.updatePackageSelection(oilId, selection);
  }

  decrease4LPackage(oilId: number) {
    const selection = this.getExtendedSelection(oilId);
    if (selection.package4L_count > 0) {
      selection.package4L_count -= 1;
      selection.package4L = selection.package4L_count > 0;
      this.updatePackageSelection(oilId, selection);
    }
  }

  increase1LPackage(oilId: number) {
    const selection = this.getExtendedSelection(oilId);
    selection.package1L_count += 1;
    selection.package1L = selection.package1L_count > 0;
    this.updatePackageSelection(oilId, selection);
  }

  decrease1LPackage(oilId: number) {
    const selection = this.getExtendedSelection(oilId);
    if (selection.package1L_count > 0) {
      selection.package1L_count -= 1;
      selection.package1L = selection.package1L_count > 0;
      this.updatePackageSelection(oilId, selection);
    }
  }

  onBulkQuantityChange(oilId: number, event: any) {
    const selection = this.getExtendedSelection(oilId);
    selection.bulkQuantity = parseFloat(event.target.value) || 0;
    this.updatePackageSelection(oilId, selection);
  }

  onRequiredQuantityChange() {
    const quantity = this.reqOilQnyForm.get('requiredOilQuantity')?.value || 0;
    this.requiredQuantity.set(quantity);
    this.updateFormValues();
  }

  private updatePackageSelection(
    oilId: number,
    selection: ExtendedOilPackageSelection
  ) {
    const oil = this.oilTypes.find((o) => o.id === oilId);
    if (!oil) return;

    let totalQuantity = 0;
    let totalPrice = 0;

    if (selection.package4L_count > 0) {
      totalQuantity += selection.package4L_count * 4;
      totalPrice += selection.package4L_count * oil.price_4l;
    }

    if (selection.package1L_count > 0) {
      totalQuantity += selection.package1L_count * 1;
      totalPrice += selection.package1L_count * oil.price_1l;
    }

    if (selection.bulkQuantity > 0) {
      totalQuantity += selection.bulkQuantity;
      totalPrice += selection.bulkQuantity * oil.price_per_liter;
    }

    selection.totalQuantity = totalQuantity;
    selection.totalPrice = totalPrice;

    const newSelections = new Map(this.packageSelections());
    newSelections.set(oilId, selection);
    this.packageSelections.set(newSelections);

    this.updateFormValues();
  }

  private updateFormValues() {
    const selectedId = this.selectedOilId();
    if (selectedId) {
      const selection = this.getExtendedSelection(selectedId);

      this.oilForm.get('quantity')?.setValue(selection.totalQuantity);
      this.oilForm.get('oilTypeId')?.setValue(selectedId);
      this.oilForm.get('totalPrice')?.setValue(selection.totalPrice);
      this.oilForm
        .get('requiredQuantity')
        ?.setValue(this.reqOilQnyForm.get('requiredOilQuantity')?.value);
      this.oilForm.get('oilQuantityDetails')?.setValue(selection);
    }
  }

  getSmartSuggestion(oil: OilType | null): string {
    if (!oil) return '';
    const required = this.requiredQuantity();
    if (required <= 0) return '';

    const suggestions: string[] = [];

    if (oil.package_4l_available && oil.package_1l_available) {
      const fourLPackages = Math.floor(required / 4);
      const remainder = required % 4;

      if (fourLPackages > 0) {
        suggestions.push(
          `${fourLPackages}x 4L package${fourLPackages > 1 ? 's' : ''}`
        );
      }

      if (remainder > 0) {
        const oneLPackages = Math.ceil(remainder);
        suggestions.push(
          `${oneLPackages}x 1L package${oneLPackages > 1 ? 's' : ''}`
        );
      }
    } else if (oil.package_4l_available) {
      const packages = Math.ceil(required / 4);
      suggestions.push(`${packages}x 4L package${packages > 1 ? 's' : ''}`);
    } else if (oil.package_1l_available) {
      const packages = Math.ceil(required);
      suggestions.push(`${packages}x 1L package${packages > 1 ? 's' : ''}`);
    }

    if (oil.bulk_available && oil.price_per_liter > 0) {
      suggestions.push(`OR ${required}L bulk`);
    }

    return suggestions.length > 0
      ? suggestions.join(' + ')
      : 'No optimal combination available';
  }

  applySmartSuggestion(oil: OilType | null) {
    if (!oil) return;
    const required = this.requiredQuantity();
    if (required <= 0) return;

    const selection = this.getExtendedSelection(oil.id);

    // Reset current selection
    selection.package4L_count = 0;
    selection.package1L_count = 0;
    selection.bulkQuantity = 0;

    if (oil.package_4l_available && oil.package_1l_available) {
      const fourLPackages = Math.floor(required / 4);
      const remainder = required % 4;

      selection.package4L_count = fourLPackages;
      if (remainder > 0) {
        selection.package1L_count = Math.ceil(remainder);
      }
    } else if (oil.package_4l_available) {
      selection.package4L_count = Math.ceil(required / 4);
    } else if (oil.package_1l_available) {
      selection.package1L_count = Math.ceil(required);
    } else if (oil.bulk_available && oil.price_per_liter > 0) {
      selection.bulkQuantity = required;
    }

    // Update boolean flags
    selection.package4L = selection.package4L_count > 0;
    selection.package1L = selection.package1L_count > 0;

    this.updatePackageSelection(oil.id, selection);
  }

  getQuantityStatus(oilId: number): string {
    const selection = this.getExtendedSelection(oilId);
    const required = this.reqOilQnyForm.get('requiredOilQuantity')?.value || 0;

    if (required <= 0) return '';

    const difference = selection.totalQuantity - required;

    if (difference === 0) return '✓ Exact match';
    if (difference > 0) return `+${difference.toFixed(2)}L extra`;
    if (difference < 0) return `${Math.abs(difference).toFixed(2)}L short`;

    return '';
  }

  getPackageBreakdown(oilId: number): string {
    const selection = this.getExtendedSelection(oilId);
    const parts: string[] = [];

    if (selection.package4L_count > 0) {
      parts.push(`${selection.package4L_count}x 4L`);
    }

    if (selection.package1L_count > 0) {
      parts.push(`${selection.package1L_count}x 1L`);
    }

    if (selection.bulkQuantity > 0) {
      parts.push(`${selection.bulkQuantity}L bulk`);
    }

    return parts.length > 0 ? parts.join(' + ') : 'None';
  }

  getOilPackageSelection(oilId: number): OilPackageSelection {
    const extended = this.getExtendedSelection(oilId);
    return {
      oilTypeId: extended.oilTypeId,
      package4L: extended.package4L,
      package1L: extended.package1L,
      bulkQuantity: extended.bulkQuantity,
      totalQuantity: extended.totalQuantity,
      totalPrice: extended.totalPrice,
    };
  }

  showAllOils(): void {
    this.selectedOilId.set(null);
  }

  proceedToNextStep5() {

    const quantity = this.oilForm.get('quantity')?.value;
    const requiredQuantity = this.oilForm.get('requiredQuantity')?.value;

    if (quantity < requiredQuantity) {
      this.errorMessage.set('Please select a valid quantity');

      setTimeout(() => {
        this.errorMessage.set('');
      }, 2000);
      return;
    }

    if (quantity >= requiredQuantity) {
      this.oilQuantityChange.emit();
      this.oilTypeChange.emit();
    }
  }

  // Add these properties to your component class:
  selectedViscosity = ''; // New property for viscosity filter

  // Add this method to your component class:
  getFilteredOils() {
    let filteredOils = this.oilTypes;

    // Apply search filter
    if (this.searchTerm) {
      const searchKeys = this.searchKeys || ['brand', 'grade', 'name']; // Use your existing searchKeys
      filteredOils = filteredOils.filter((oil: any) =>
        searchKeys.some((key) =>
          oil[key]?.toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      );
    }

    // Apply viscosity filter
    if (this.selectedViscosity) {
      filteredOils = filteredOils.filter((oil) =>
        oil.grade?.includes(this.selectedViscosity)
      );
    }

    return filteredOils;
  }

  // Add this method to clear all filters:
  clearAllFilters() {
    this.searchTerm = '';
    this.selectedViscosity = '';
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
