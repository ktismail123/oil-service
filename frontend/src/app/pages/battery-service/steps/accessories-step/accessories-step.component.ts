import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Accessory } from '../../../../models';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { SearchPipe } from '../../../../pipes/search.pipe';
import { ApiService } from '../../../../services/api.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-accessories-step',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, SearchPipe, CurrencyPipe],
  templateUrl: './accessories-step.component.html',
  styleUrl: './accessories-step.component.scss'
})
export class AccessoriesStepComponent {
  private apiService = inject(ApiService);
// Inputs
  accessories = signal<Accessory[] | any[]>([]);
  initialSelectedAccessories = input<Accessory[]>([]);

  searchTerm: string = '';
  searchKeys: string[] = ['name', 'price'];
  

  // Outputs
  accessoriesChanged = output<Accessory[]>();
  onSkipAccessoriesEmit = output();
  gotToNextStep = output();

  // Signals
  selectedAccessories = signal<Accessory[]>([]);

  // Computed
  accessoriesTotal = computed(() => {
    return this.selectedAccessories().reduce((total, acc) => {
      return total + ((acc.price || 0) * (acc.quantity || 1));
    }, 0);
  });

  ngOnInit() {
    // Initialize with any pre-selected accessories
    const initial = this.initialSelectedAccessories();
    if (initial && initial.length > 0) {
      this.selectedAccessories.set([...initial]);
    }
    this.loadAccessories();
  }

  loadAccessories(): void {
      this.apiService
        .getAccessories()
        .pipe(take(1))
        .subscribe({
          next: (res: any) => [this.accessories.set(res)],
        });
    }

  addAccessory(accessory: Accessory) {
    const current = this.selectedAccessories();
    const index = current.findIndex(a => a.id === accessory.id);

    if (index >= 0) {
      // Increase quantity if already selected
      const updated = [...current];
      updated[index] = {
        ...updated[index],
        quantity: (updated[index].quantity || 0) + 1,
      };
      this.selectedAccessories.set(updated);
    } else {
      // Add new accessory
      this.selectedAccessories.set([...current, { ...accessory, quantity: 1 }]);
    }
    
    this.emitChanges();
  }

 removeAccessory(accessoryId: number) {
  const current = this.selectedAccessories(); // current array
  const index = current.findIndex(a => a.id === accessoryId); // find the index

  if (index >= 0) {
    const updated = [...current]; // copy array

    if ((updated[index].quantity || 0) > 1) {
      updated[index] = {
        ...updated[index],
        quantity: updated[index].quantity! - 1, // decrement quantity
      };
    } else {
      updated.splice(index, 1); // remove accessory if quantity <= 1
    }

    this.selectedAccessories.set(updated); // save updated array
    this.emitChanges(); // trigger update event
  }
}


  increaseQuantity(accessoryId: number) {
    const current = this.selectedAccessories();
    const index = current.findIndex(a => a.id === accessoryId);
    
    if (index >= 0) {
      const updated = [...current];
      const accessory = updated[index];
      const newQuantity = (accessory.quantity || 0) + 1;
      
      // Check if we can increase (respect quantity_available)
      if (!accessory.quantity_available || newQuantity <= accessory.quantity_available) {
        updated[index] = { ...accessory, quantity: newQuantity };
        this.selectedAccessories.set(updated);
        this.emitChanges();
      }
    }
  }

  decreaseQuantity(accessoryId: number) {
    const current = this.selectedAccessories();
    const index = current.findIndex(a => a.id === accessoryId);

    if (index >= 0) {
      const updated = [...current];
      const currentQuantity = updated[index].quantity || 0;
      
      if (currentQuantity > 1) {
        updated[index] = {
          ...updated[index],
          quantity: currentQuantity - 1,
        };
        this.selectedAccessories.set(updated);
      } else {
        // Remove if quantity becomes 0
        this.removeAccessory(accessoryId);
        return;
      }
      
      this.emitChanges();
    }
  }

  isAccessoryMaxed(accessory: Accessory): boolean {
    if (!accessory.quantity_available) return false;
    
    const selected = this.selectedAccessories().find(a => a.id === accessory.id);
    const currentQuantity = selected?.quantity || 0;
    
    return currentQuantity >= accessory.quantity_available;
  }

  formatPrice(price: number): any {
    return price
  }

  trackByAccessoryId(index: number, accessory: Accessory): number {
    return accessory.id;
  }

  private emitChanges() {
    this.accessoriesChanged.emit(this.selectedAccessories());
  }

  getSelectedAccessories(): Accessory[] {
    return this.selectedAccessories();
  }

  getAccessoriesTotal(): number {
    return this.accessoriesTotal();
  }

  onSkipAccessories(){
    this.onSkipAccessoriesEmit.emit();
  }

  onNextStep(){
    this.gotToNextStep.emit();
  }
}
