import { Component, EventEmitter, Input, OnDestroy, Output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { OilType } from '../../../../models';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
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
  package4L_count: number;  // Internal count for 4L packages
  package1L_count: number;  // Internal count for 1L packages
}
@Component({
  selector: 'app-step4-oil-type',
  imports: [NgIf, NgFor, ReactiveFormsModule, FormFieldComponent, NgClass],
  templateUrl: './step4-oil-type.component.html',
  styleUrl: './step4-oil-type.component.scss',
})
export class Step4OilTypeComponent implements OnDestroy {
  @Input() oilForm!: FormGroup;
  @Input() oilTypes: OilType[] = [];

  reqOilQnyForm = new FormGroup({
    requiredOilQuantity: new FormControl(4)
  });

  
  @Output() oilTypeChange = new EventEmitter<void>();
  @Output() oilQuantityChange = new EventEmitter<void>();

  selectedOilId = signal<number | null>(null);
  requiredQuantity = signal<number>(0);
  packageSelections = signal<Map<number, ExtendedOilPackageSelection>>(new Map());

  getExtendedSelection(oilId: number): ExtendedOilPackageSelection {
    const selection = this.packageSelections().get(oilId);
    if (selection) return selection;
    
    const defaultSelection: ExtendedOilPackageSelection = {
      oilTypeId: oilId,
      package4L: false,
      package1L: false,
      bulkQuantity: 0,
      totalQuantity: 4,
      totalPrice: 0,
      package4L_count: 0,
      package1L_count: 0
    };
    
    const newSelections = new Map(this.packageSelections());
    newSelections.set(oilId, defaultSelection);
    this.packageSelections.set(newSelections);
    
    return defaultSelection;
  }

  getSelectedOilDetails() {
    const id = this.selectedOilId();
    return id ? this.oilTypes.find(oil => oil.id === id) : null;
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
    const quantity = (this.reqOilQnyForm.get('requiredOilQuantity')?.value) || 0;
    this.requiredQuantity.set(quantity);
    this.oilQuantityChange.emit();
  }

  private updatePackageSelection(oilId: number, selection: ExtendedOilPackageSelection) {
    const oil = this.oilTypes.find(o => o.id === oilId);
    if (!oil) return;

    let totalQuantity = 0;
    let totalPrice = 0;

    if (selection.package4L_count > 0) {
      totalQuantity += selection.package4L_count * 4;
      totalPrice += selection.package4L_count * (oil.price_4l);
    }

    if (selection.package1L_count > 0) {
      totalQuantity += selection.package1L_count * 1;
      totalPrice += selection.package1L_count * (oil.price_1l);
    }

    if (selection.bulkQuantity > 0) {
      totalQuantity += selection.bulkQuantity;
      totalPrice += selection.bulkQuantity * (oil.price_per_liter);
    }

    selection.totalQuantity = totalQuantity;
    selection.totalPrice = totalPrice;

    const newSelections = new Map(this.packageSelections());
    newSelections.set(oilId, selection);
    this.packageSelections.set(newSelections);

    this.updateFormValues();
    this.oilTypeChange.emit();
  }

  private updateFormValues() {
    const selectedId = this.selectedOilId();
    if (selectedId) {
      const selection = this.getExtendedSelection(selectedId);
      console.log(selection);
      
      this.oilForm.get('quantity')?.setValue(selection.totalQuantity);
      this.oilForm.get('oilTypeId')?.setValue(selectedId);
      this.oilForm.get('totalPrice')?.setValue(selection.totalPrice);
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
        suggestions.push(`${fourLPackages}x 4L package${fourLPackages > 1 ? 's' : ''}`);
      }
      
      if (remainder > 0) {
        const oneLPackages = Math.ceil(remainder);
        suggestions.push(`${oneLPackages}x 1L package${oneLPackages > 1 ? 's' : ''}`);
      }
    } else if (oil.package_4l_available) {
      const packages = Math.ceil(required / 4);
      suggestions.push(`${packages}x 4L package${packages > 1 ? 's' : ''}`);
    } else if (oil.package_1l_available) {
      const packages = Math.ceil(required);
      suggestions.push(`${packages}x 1L package${packages > 1 ? 's' : ''}`);
    }

    if (oil.bulk_available && (oil.price_per_liter) > 0) {
      suggestions.push(`OR ${required}L bulk`);
    }

    return suggestions.length > 0 ? suggestions.join(' + ') : 'No optimal combination available';
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
    } else if (oil.bulk_available && (oil.price_per_liter) > 0) {
      selection.bulkQuantity = required;
    }

    // Update boolean flags
    selection.package4L = selection.package4L_count > 0;
    selection.package1L = selection.package1L_count > 0;

    this.updatePackageSelection(oil.id, selection);
  }

  getQuantityStatus(oilId: number): string {
  const selection = this.getExtendedSelection(oilId);
  // const required = this.requiredQuantity();
  const required = this.reqOilQnyForm.get('requiredOilQuantity')?.value || 0

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
      totalPrice: extended.totalPrice
    };
  }

  showAllOils(): void {
    this.selectedOilId.set(null)
  }

  ngOnDestroy(): void {
  }
}
