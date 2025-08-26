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
  package5L: boolean; // NEW: 5L support
  package1L: boolean;
  bulkQuantity: number;
  totalQuantity: number;
  totalPrice: number;
}

// Extended interface for internal use with quantities
interface ExtendedOilPackageSelection extends OilPackageSelection {
  package4L_count: number; // Internal count for 4L packages
  package5L_count: number; // NEW: Internal count for 5L packages
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
  selectedViscosity = ''; // Property for viscosity filter

  ngOnInit(): void {
    this.populateExistingData();
    this.isInitialized = true;
    this.updateViscosityOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
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

    const existingOilTypeId = this.oilForm.get('oilTypeId')?.value;
    const existingRequiredQuantity = this.oilForm.get('requiredQuantity')?.value;
    const existingOilQuantityDetails = this.oilForm.get('oilQuantityDetails')?.value;

    if (existingRequiredQuantity) {
      this.reqOilQnyForm.get('requiredOilQuantity')?.setValue(existingRequiredQuantity);
      this.requiredQuantity.set(existingRequiredQuantity);
    }

    if (existingOilTypeId) {
      this.selectedOilId.set(existingOilTypeId);

      if (existingOilQuantityDetails) {
        this.populatePackageSelection(existingOilTypeId, existingOilQuantityDetails);
      } else {
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
      package5L: details.package5L || false, // NEW: 5L support
      package1L: details.package1L || false,
      bulkQuantity: details.bulkQuantity || 0,
      totalQuantity: details.totalQuantity || 0,
      totalPrice: details.totalPrice || 0,
      package4L_count: details.package4L_count || 0,
      package5L_count: details.package5L_count || 0, // NEW: 5L count
      package1L_count: details.package1L_count || 0,
    };

    // Calculate missing counts if needed
    if (!details.package5L_count && details.package5L) {
      extendedSelection.package5L_count = this.calculatePackageCount(
        details.totalQuantity - details.bulkQuantity,
        oil,
        '5L'
      );
    }

    if (!details.package4L_count && details.package4L) {
      extendedSelection.package4L_count = this.calculatePackageCount(
        details.totalQuantity - details.bulkQuantity - extendedSelection.package5L_count * 5,
        oil,
        '4L'
      );
    }

    if (!details.package1L_count && details.package1L) {
      extendedSelection.package1L_count = this.calculatePackageCount(
        details.totalQuantity - details.bulkQuantity - extendedSelection.package5L_count * 5 - extendedSelection.package4L_count * 4,
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

    if (totalQuantity === 0) return;

    const extendedSelection: ExtendedOilPackageSelection = {
      oilTypeId: oilTypeId,
      package4L: false,
      package5L: false, // NEW: 5L support
      package1L: false,
      bulkQuantity: 0,
      totalQuantity: totalQuantity,
      totalPrice: totalPrice,
      package4L_count: 0,
      package5L_count: 0, // NEW: 5L count
      package1L_count: 0,
    };

    if (oil.bulk_available && oil.price_per_liter > 0) {
      const bulkCost = totalQuantity * oil.price_per_liter;
      if (Math.abs(bulkCost - totalPrice) < 0.01) {
        extendedSelection.bulkQuantity = totalQuantity;
      }
    }

    if (extendedSelection.bulkQuantity === 0) {
      this.reconstructPackageCombination(extendedSelection, oil, totalQuantity, totalPrice);
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
    // Try different combinations including 5L packages
    if (oil.package_5l_available || oil.package_4l_available || oil.package_1l_available) {
      // Try combinations with 5L first (most efficient)
      for (let pkg5L = oil.package_5l_available ? Math.floor(totalQuantity / 5) : 0; pkg5L >= 0; pkg5L--) {
        const remaining5L = totalQuantity - pkg5L * 5;
        
        for (let pkg4L = oil.package_4l_available ? Math.floor(remaining5L / 4) : 0; pkg4L >= 0; pkg4L--) {
          const remaining4L = remaining5L - pkg4L * 4;
          
          if (remaining4L >= 0 && oil.package_1l_available) {
            const pkg1L = Math.ceil(remaining4L);
            const calculatedPrice = pkg5L * (oil.price_5l || 0) + pkg4L * oil.price_4l + pkg1L * oil.price_1l;

            if (Math.abs(calculatedPrice - totalPrice) < 0.01) {
              selection.package5L_count = pkg5L;
              selection.package4L_count = pkg4L;
              selection.package1L_count = pkg1L;
              selection.package5L = pkg5L > 0;
              selection.package4L = pkg4L > 0;
              selection.package1L = pkg1L > 0;
              return;
            }
          }
        }
      }
    }
  }

  private calculatePackageCount(
    remainingQuantity: number,
    oil: OilType,
    packageType: '5L' | '4L' | '1L'
  ): number {
    if (packageType === '5L' && oil.package_5l_available) {
      return Math.floor(remainingQuantity / 5);
    } else if (packageType === '4L' && oil.package_4l_available) {
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
      package5L: false, // NEW: 5L support
      package1L: false,
      bulkQuantity: 0,
      totalQuantity: 0,
      totalPrice: 0,
      package4L_count: 0,
      package5L_count: 0, // NEW: 5L count
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

  // NEW: 5L Package Methods
  increase5LPackage(oilId: number) {
    const selection = this.getExtendedSelection(oilId);
    selection.package5L_count += 1;
    selection.package5L = selection.package5L_count > 0;
    this.updatePackageSelection(oilId, selection);
  }

  decrease5LPackage(oilId: number) {
    const selection = this.getExtendedSelection(oilId);
    if (selection.package5L_count > 0) {
      selection.package5L_count -= 1;
      selection.package5L = selection.package5L_count > 0;
      this.updatePackageSelection(oilId, selection);
    }
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

    // NEW: Add 5L package calculations
    if (selection.package5L_count > 0) {
      totalQuantity += selection.package5L_count * 5;
      totalPrice += selection.package5L_count * (oil.price_5l || 0);
    }

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

    // NEW: Include 5L in smart suggestions (prioritize 5L for efficiency)
    if (oil.package_5l_available || oil.package_4l_available || oil.package_1l_available) {
      let remaining = required;
      
      // Try 5L packages first
      if (oil.package_5l_available) {
        const fiveLPackages = Math.floor(remaining / 5);
        if (fiveLPackages > 0) {
          suggestions.push(`${fiveLPackages}x 5L package${fiveLPackages > 1 ? 's' : ''}`);
          remaining -= fiveLPackages * 5;
        }
      }

      // Then 4L packages
      if (oil.package_4l_available && remaining > 0) {
        const fourLPackages = Math.floor(remaining / 4);
        if (fourLPackages > 0) {
          suggestions.push(`${fourLPackages}x 4L package${fourLPackages > 1 ? 's' : ''}`);
          remaining -= fourLPackages * 4;
        }
      }

      // Finally 1L packages for remainder
      if (oil.package_1l_available && remaining > 0) {
        const oneLPackages = Math.ceil(remaining);
        suggestions.push(`${oneLPackages}x 1L package${oneLPackages > 1 ? 's' : ''}`);
      }
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
    selection.package5L_count = 0; // NEW: Reset 5L count
    selection.package4L_count = 0;
    selection.package1L_count = 0;
    selection.bulkQuantity = 0;

    let remaining = required;

    // NEW: Smart suggestion logic with 5L priority
    if (oil.package_5l_available) {
      selection.package5L_count = Math.floor(remaining / 5);
      remaining -= selection.package5L_count * 5;
    }

    if (oil.package_4l_available && remaining > 0) {
      selection.package4L_count = Math.floor(remaining / 4);
      remaining -= selection.package4L_count * 4;
    }

    if (oil.package_1l_available && remaining > 0) {
      selection.package1L_count = Math.ceil(remaining);
    }

    // Update boolean flags
    selection.package5L = selection.package5L_count > 0; // NEW: 5L flag
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

    // NEW: Include 5L in breakdown
    if (selection.package5L_count > 0) {
      parts.push(`${selection.package5L_count}x 5L`);
    }

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
      package5L: extended.package5L, // NEW: Include 5L in return
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

  getFilteredOils() {
    let filteredOils = this.oilTypes;

    if (this.searchTerm) {
      const searchKeys = this.searchKeys || ['brand', 'grade', 'name'];
      filteredOils = filteredOils.filter((oil: any) =>
        searchKeys.some((key) =>
          oil[key]?.toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      );
    }

    if (this.selectedViscosity) {
      filteredOils = filteredOils.filter((oil) =>
        oil.grade?.includes(this.selectedViscosity)
      );
    }

    return filteredOils;
  }

  clearAllFilters() {
    this.searchTerm = '';
    this.selectedViscosity = '';
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}