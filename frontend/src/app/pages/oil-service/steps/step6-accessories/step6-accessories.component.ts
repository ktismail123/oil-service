import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Accessory } from '../../../../models';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SearchPipe } from '../../../../pipes/search.pipe';

@Component({
  selector: 'app-step6-accessories',
  imports: [NgIf, NgFor, ReactiveFormsModule, ButtonComponent, FormsModule, SearchPipe],
  templateUrl: './step6-accessories.component.html',
  styleUrl: './step6-accessories.component.scss',
})
export class Step6AccessoriesComponent {
  @Input() accessories: Accessory[] = [];
  @Input() selectedAccessories: Accessory[] = [];

  searchTerm: string = '';
  searchKeys: string[] = ['name', 'price'];
  
  @Output() addAccessory = new EventEmitter<Accessory>();
  @Output() removeAccessory = new EventEmitter<number>();
  @Output() accessoriesComplete = new EventEmitter();

  onAddAccessory(accessory: Accessory) {
    this.addAccessory.emit(accessory);
  }

  onRemoveAccessory(accessoryId: number) {
    this.removeAccessory.emit(accessoryId);
  }

  onSkipAccessories(): void {
    this.accessoriesComplete.emit();
  }

  onNextStep(): void {
    this.accessoriesComplete.emit();
  }

  get total(){
    return this.selectedAccessories.reduce((total, accessory) => total + ((accessory.price || 0) * (accessory.quantity || 1)), 0).toFixed(2)
  }

}
